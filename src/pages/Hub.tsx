import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { useUnreadChats } from "@/hooks/useUnreadChats";
import { MemberBubble } from "@/components/hub/MemberBubble";
import { ChatPanel } from "@/components/hub/ChatPanel";
import { ChatList } from "@/components/hub/ChatList";
import { Button } from "@/components/ui/button";
import { Coffee, Utensils, Bath, Monitor, Moon } from "lucide-react";

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

const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

const STATUS_MAP: Record<string, { label: string; color: "working" | "break" | "offline" | "online" }> = {
  working: { label: "Trabajando", color: "working" },
  online: { label: "En línea", color: "online" },
  break: { label: "En break", color: "break" },
  eating: { label: "Comiendo 🍽️", color: "break" },
  bathroom: { label: "AFK 🚿", color: "break" },
  meeting: { label: "En reunión", color: "working" },
  offline: { label: "Offline", color: "offline" },
};

export default function HubPage() {
  const { user } = useAuth();
  const { setManualStatus } = useTimer();
  const { markConversationRead } = useUnreadChats();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [myStatus, setMyStatus] = useState<string>("online");

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

      // Find my status
      const myPresence = presenceMap.get(user.id);
      if (myPresence) setMyStatus(myPresence.status);

      const merged: MemberWithProfile[] = profileList
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

      // Sort: self first, then working, online, break, offline
      const order: Record<string, number> = { working: 0, online: 1, meeting: 1, break: 2, eating: 2, bathroom: 2, offline: 3 };
      merged.sort((a, b) => {
        if (a.user_id === user.id) return -1;
        if (b.user_id === user.id) return 1;
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
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
    if (!user || memberId === user.id) return;

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

  const handleStatusChange = async (status: string) => {
    setMyStatus(status);
    await setManualStatus(status);
  };

  const chatPartnerProfile = activeChatUserId
    ? allProfiles.find((p) => p.id === activeChatUserId) || null
    : null;

  const getStatusInfo = (status: string) => {
    return STATUS_MAP[status] || STATUS_MAP.offline;
  };

  const getMemberStatusColor = (status: string): "working" | "break" | "offline" | "online" => {
    return getStatusInfo(status).color;
  };

  const getMemberStatusLabel = (status: string): string => {
    return getStatusInfo(status).label;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Hub</h1>
        <p className="text-sm text-foreground-muted mt-1">Actividad del equipo en tiempo real</p>
      </div>

      {/* Quick status buttons for current user */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">Tu estado</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { status: "online", icon: Monitor, label: "En línea" },
            { status: "break", icon: Coffee, label: "Break" },
            { status: "eating", icon: Utensils, label: "Comiendo" },
            { status: "bathroom", icon: Bath, label: "AFK" },
            { status: "meeting", icon: Moon, label: "Reunión" },
          ].map(({ status, icon: Icon, label }) => (
            <Button
              key={status}
              variant={myStatus === status ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => handleStatusChange(status)}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Member bubbles */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-4">Equipo</h2>
        {members.length === 0 ? (
          <p className="text-sm text-foreground-muted">No hay miembros en el equipo aún.</p>
        ) : (
          <div className="flex flex-wrap gap-6">
            {members.map((m) => (
              <MemberBubble
                key={m.user_id}
                name={m.profile.name || m.profile.email?.split("@")[0] || "?"}
                avatarUrl={m.profile.avatar_url}
                status={getMemberStatusColor(m.status)}
                statusLabel={getMemberStatusLabel(m.status)}
                currentClient={m.current_client}
                currentTask={m.current_task}
                isMe={m.user_id === user?.id}
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