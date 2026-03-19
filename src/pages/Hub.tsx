import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { useUnreadChats } from "@/hooks/useUnreadChats";
import { MemberBubble } from "@/components/hub/MemberBubble";
import { MemberActivityDrawer } from "@/components/hub/MemberActivityDrawer";
import { ChatPanel } from "@/components/hub/ChatPanel";
import { ChatList } from "@/components/hub/ChatList";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Coffee, Utensils, Bath, Monitor, Moon, Video } from "lucide-react";
import { QuickSheet } from "@/components/timer/QuickSheet";

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

const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000;

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

  // Member activity drawer state
  const [drawerMember, setDrawerMember] = useState<MemberWithProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

      const order: Record<string, number> = { working: 0, online: 1, meeting: 1, break: 2, eating: 2, bathroom: 2, offline: 3 };
      merged.sort((a, b) => {
        if (a.user_id === user.id) return -1;
        if (b.user_id === user.id) return 1;
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
      setMembers(merged);
    };

    loadData();

    const channel = supabase
      .channel("hub-presence")
      .on("postgres_changes", { event: "*", schema: "public", table: "member_presence" }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleMemberClick = (memberId: string) => {
    if (!user) return;
    // Open activity drawer for any member (including self)
    const member = members.find((m) => m.user_id === memberId);
    if (member) {
      setDrawerMember(member);
      setDrawerOpen(true);
    }
  };

  const handleOpenChat = (conversationId: string) => {
    if (!user) return;
    const convo = conversations.find((c) => c.id === conversationId);
    if (!convo) return;
    const otherId = convo.participant_a === user.id ? convo.participant_b : convo.participant_a;
    setActiveConversationId(conversationId);
    setActiveChatUserId(otherId);
    markConversationRead(conversationId);
  };

  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showStopTimerDialog, setShowStopTimerDialog] = useState(false);
  const [showQuickSheet, setShowQuickSheet] = useState(false);
  const { isRunning, stopTimer, activeClient, activeTask, startBreakTimer } = useTimer();

  const handleStatusChange = async (status: string) => {
    const breakStatuses = ["break", "eating", "bathroom", "meeting"];

    if (status === "online") {
      setShowQuickSheet(true);
      return;
    }

    if (status === "offline") {
      if (isRunning) await stopTimer();
      await startBreakTimer("offline");
      setMyStatus("offline");
      await setManualStatus("offline");
      return;
    }

    if (breakStatuses.includes(status)) {
      if (isRunning) {
        setPendingStatus(status);
        setShowStopTimerDialog(true);
      } else {
        setMyStatus(status);
        await startBreakTimer(status);
      }
      return;
    }

    setMyStatus(status);
    await setManualStatus(status);
  };

  const handleConfirmStopTimer = async () => {
    if (pendingStatus) {
      await stopTimer();
      setMyStatus(pendingStatus);
      await startBreakTimer(pendingStatus);
      setPendingStatus(null);
    }
    setShowStopTimerDialog(false);
  };

  const handleKeepTimerRunning = async () => {
    if (pendingStatus) {
      setMyStatus(pendingStatus);
      await setManualStatus(pendingStatus);
      setPendingStatus(null);
    }
    setShowStopTimerDialog(false);
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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Quick status */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Tu estado</h2>
        <TooltipProvider delayDuration={300}>
          <div className="flex flex-wrap gap-2">
            {[
              { status: "online", icon: Monitor, label: "En línea", tip: "Disponible para trabajar. Abre el timer para comenzar." },
              { status: "break", icon: Coffee, label: "Break", tip: "Tómate un descanso. Se registra automáticamente." },
              { status: "eating", icon: Utensils, label: "Comiendo", tip: "Hora de comer. Se registra como pausa." },
              { status: "bathroom", icon: Bath, label: "AFK", tip: "Lejos del teclado por un momento." },
              { status: "meeting", icon: Video, label: "Reunión", tip: "En una llamada o reunión." },
              { status: "offline", icon: Moon, label: "Offline", tip: "Fuera de línea. Se detiene cualquier timer activo." },
            ].map(({ status, icon: Icon, label, tip }) => (
              <Tooltip key={status}>
                <TooltipTrigger asChild>
                  <Button
                    variant={myStatus === status ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5 text-xs transition-all duration-200 active:scale-95"
                    onClick={() => handleStatusChange(status)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                  {tip}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>

      {/* Team members */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Equipo</h2>
        {members.length === 0 ? (
          <p className="text-sm text-foreground-muted">No hay miembros en el equipo aún.</p>
        ) : (
          <div className="flex flex-wrap gap-5">
            {members.map((m) => (
              <MemberBubble
                key={m.user_id}
                name={m.profile.name || m.profile.email?.split("@")[0] || "?"}
                avatarUrl={m.profile.avatar_url}
                status={getMemberStatusColor(m.status)}
                statusLabel={getMemberStatusLabel(m.status)}
                currentClient={m.current_client}
                currentTask={m.current_task}
                lastSeenAt={m.last_seen_at}
                isMe={m.user_id === user?.id}
                onClick={() => handleMemberClick(m.user_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Chat list */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <ChatList
          conversations={conversations}
          profiles={allProfiles}
          currentUserId={user?.id || ""}
          onOpenChat={handleOpenChat}
        />
      </div>

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

      {/* Member Activity Drawer */}
      <MemberActivityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        profile={drawerMember?.profile || null}
        status={drawerMember?.status || "offline"}
        statusLabel={drawerMember ? getMemberStatusLabel(drawerMember.status) : "Offline"}
        currentClient={drawerMember?.current_client || null}
        currentTask={drawerMember?.current_task || null}
      />

      {/* Stop timer confirmation dialog */}
      <Dialog open={showStopTimerDialog} onOpenChange={setShowStopTimerDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Detener el timer?</DialogTitle>
            <DialogDescription>
              Tienes el timer activo
              {activeClient ? ` para ${activeClient.name}` : ""}
              {activeTask ? ` · ${activeTask.title}` : ""}.
              ¿Deseas detenerlo antes de cambiar tu estado?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleKeepTimerRunning}>
              No, mantener timer
            </Button>
            <Button variant="default" onClick={handleConfirmStopTimer}>
              Sí, detener timer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start/Switch quick sheet */}
      <QuickSheet
        open={showQuickSheet}
        onOpenChange={setShowQuickSheet}
        mode={isRunning ? "switch" : "start"}
      />
    </div>
  );
}
