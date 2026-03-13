import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MemberBubble } from "@/components/hub/MemberBubble";
import { ChatPanel } from "@/components/hub/ChatPanel";
import { ChatList } from "@/components/hub/ChatList";

interface MemberPresence {
  user_id: string;
  status: string;
  current_client: string | null;
  current_task: string | null;
  last_seen_at: string;
}

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface MemberWithProfile extends MemberPresence {
  profile: Profile;
}

export interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  updated_at: string;
  is_archived: boolean;
}

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;

export default function HubPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Load profiles + presence
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [{ data: profiles }, { data: presenceData }, { data: convos }] = await Promise.all([
        supabase.from("profiles").select("id, name, avatar_url, email"),
        supabase.from("member_presence").select("*"),
        supabase.from("chat_conversations").select("*").order("updated_at", { ascending: false }),
      ]);

      const profileList = (profiles || []) as Profile[];
      setAllProfiles(profileList);
      setConversations((convos || []) as Conversation[]);

      const presenceMap = new Map<string, MemberPresence>();
      (presenceData || []).forEach((p: any) => presenceMap.set(p.user_id, p));

      const merged: MemberWithProfile[] = profileList
        .filter((p) => p.id !== user.id)
        .map((p) => {
          const presence = presenceMap.get(p.id);
          const now = Date.now();
          const lastSeen = presence ? new Date(presence.last_seen_at).getTime() : 0;
          const isOffline = !presence || now - lastSeen > OFFLINE_THRESHOLD_MS;

          return {
            user_id: p.id,
            status: isOffline ? "offline" : presence!.status,
            current_client: presence?.current_client || null,
            current_task: presence?.current_task || null,
            last_seen_at: presence?.last_seen_at || new Date().toISOString(),
            profile: p,
          };
        });

      // Sort: working first, then break, then offline
      const order = { working: 0, break: 1, offline: 2 };
      merged.sort((a, b) => (order[a.status as keyof typeof order] ?? 2) - (order[b.status as keyof typeof order] ?? 2));
      setMembers(merged);
    };

    loadData();

    // Realtime presence
    const channel = supabase
      .channel("hub-presence")
      .on("postgres_changes", { event: "*", schema: "public", table: "member_presence" }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleMemberClick = async (memberId: string) => {
    if (!user) return;

    // Find or create conversation
    const existing = conversations.find(
      (c) =>
        (c.participant_a === user.id && c.participant_b === memberId) ||
        (c.participant_b === user.id && c.participant_a === memberId)
    );

    if (existing) {
      setActiveConversationId(existing.id);
      setActiveChatUserId(memberId);
      return;
    }

    const { data: newConvo, error } = await supabase
      .from("chat_conversations")
      .insert({ participant_a: user.id, participant_b: memberId })
      .select("*")
      .single();

    if (!error && newConvo) {
      setConversations((prev) => [newConvo as Conversation, ...prev]);
      setActiveConversationId(newConvo.id);
      setActiveChatUserId(memberId);
    }
  };

  const handleOpenChat = (conversationId: string) => {
    if (!user) return;
    const convo = conversations.find((c) => c.id === conversationId);
    if (!convo) return;
    const otherId = convo.participant_a === user.id ? convo.participant_b : convo.participant_a;
    setActiveConversationId(conversationId);
    setActiveChatUserId(otherId);
  };

  const chatPartnerProfile = activeChatUserId
    ? allProfiles.find((p) => p.id === activeChatUserId) || null
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Hub</h1>
        <p className="text-sm text-foreground-muted mt-1">Actividad del equipo en tiempo real</p>
      </div>

      {/* Member bubbles */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-4">Equipo</h2>
        {members.length === 0 ? (
          <p className="text-sm text-foreground-muted">No hay otros miembros en el equipo aún.</p>
        ) : (
          <div className="flex flex-wrap gap-6">
            {members.map((m) => (
              <MemberBubble
                key={m.user_id}
                name={m.profile.name || m.profile.email?.split("@")[0] || "?"}
                avatarUrl={m.profile.avatar_url}
                status={m.status as "working" | "break" | "offline"}
                currentClient={m.current_client}
                currentTask={m.current_task}
                onClick={() => handleMemberClick(m.user_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Chat list */}
      <ChatList
        conversations={conversations}
        profiles={allProfiles}
        currentUserId={user?.id || ""}
        onOpenChat={handleOpenChat}
      />

      {/* Chat panel */}
      <ChatPanel
        open={!!activeConversationId}
        onOpenChange={(open) => {
          if (!open) {
            setActiveConversationId(null);
            setActiveChatUserId(null);
          }
        }}
        conversationId={activeConversationId}
        partnerProfile={chatPartnerProfile}
      />
    </div>
  );
}
