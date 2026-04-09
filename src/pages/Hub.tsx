import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { useUnreadChats } from "@/hooks/useUnreadChats";
import { MemberActivityDrawer } from "@/components/hub/MemberActivityDrawer";
import { ChatPanel } from "@/components/hub/ChatPanel";
import { ChatList } from "@/components/hub/ChatList";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Coffee, Utensils, Bath, Monitor, Moon, Video, MessageSquare, Clock, Users, TrendingUp, Activity } from "lucide-react";
import { QuickSheet } from "@/components/timer/QuickSheet";
import { formatDuration, getClientColor } from "@/lib/timer-utils";

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
  todayHours: number;
  todayMinutes: number;
}

export interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  updated_at: string;
  is_archived: boolean;
}

interface RecentActivity {
  id: string;
  user_id: string;
  userName: string;
  description: string | null;
  clientName: string | null;
  clientId: string | null;
  started_at: string;
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

const statusDotColor = {
  working: "bg-success",
  online: "bg-primary",
  break: "bg-accent",
  offline: "bg-foreground-muted/40",
};

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

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
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const [drawerMember, setDrawerMember] = useState<MemberWithProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

      const [{ data: profiles }, { data: presenceData }, { data: convos }, { data: todayEntries }, { data: recentEntries }] = await Promise.all([
        supabase.from("profiles").select("id, name, avatar_url, email"),
        supabase.from("member_presence").select("*"),
        supabase.from("chat_conversations").select("*").order("updated_at", { ascending: false }),
        supabase.from("time_entries").select("user_id, duration_min, started_at, ended_at").gte("started_at", todayStart.toISOString()),
        supabase.from("time_entries").select("id, user_id, description, client_id, started_at, clients(name)").gte("started_at", eightHoursAgo.toISOString()).not("ended_at", "is", null).order("started_at", { ascending: false }).limit(15),
      ]);

      const profileList = (profiles || []) as Profile[];
      setAllProfiles(profileList);
      setConversations((convos || []) as Conversation[]);

      // Recent activity feed
      const actFeed: RecentActivity[] = (recentEntries || []).map((e: any) => {
        const prof = profileList.find((p) => p.id === e.user_id);
        return {
          id: e.id,
          user_id: e.user_id,
          userName: prof?.name || prof?.email?.split("@")[0] || "?",
          description: e.description,
          clientName: e.clients?.name || null,
          clientId: e.client_id,
          started_at: e.started_at,
        };
      });
      setRecentActivity(actFeed);

      // Hours per user
      const hoursMap: Record<string, number> = {};
      (todayEntries || []).forEach((e: any) => {
        const mins = e.duration_min || (e.ended_at ? (new Date(e.ended_at).getTime() - new Date(e.started_at).getTime()) / 60000 : (Date.now() - new Date(e.started_at).getTime()) / 60000);
        hoursMap[e.user_id] = (hoursMap[e.user_id] || 0) + mins;
      });

      const presenceMap = new Map<string, MemberPresence>();
      (presenceData || []).forEach((p: any) => presenceMap.set(p.user_id, p));

      const myPresence = presenceMap.get(user.id);
      if (myPresence) setMyStatus(myPresence.status);

      const merged: MemberWithProfile[] = profileList.map((p) => {
        const presence = presenceMap.get(p.id);
        const now = Date.now();
        const lastSeen = presence ? new Date(presence.last_seen_at).getTime() : 0;
        const isOffline = !presence || now - lastSeen > OFFLINE_THRESHOLD_MS;
        const totalMins = hoursMap[p.id] || 0;

        return {
          user_id: p.id,
          status: isOffline ? "offline" : presence!.status,
          current_client: presence?.current_client || null,
          current_task: presence?.current_task || null,
          last_seen_at: presence?.last_seen_at || new Date().toISOString(),
          profile: p,
          todayHours: Math.round(totalMins / 60 * 10) / 10,
          todayMinutes: Math.round(totalMins),
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
      .on("postgres_changes", { event: "*", schema: "public", table: "member_presence" }, () => loadData());
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Derived stats
  const teamStats = useMemo(() => {
    const activeCount = members.filter((m) => m.status !== "offline").length;
    const totalMinutes = members.reduce((s, m) => s + m.todayMinutes, 0);
    const topClient = (() => {
      // Simple: find the most common current_client
      const clientCounts: Record<string, number> = {};
      members.forEach((m) => {
        if (m.current_client) clientCounts[m.current_client] = (clientCounts[m.current_client] || 0) + 1;
      });
      const top = Object.entries(clientCounts).sort((a, b) => b[1] - a[1])[0];
      return top ? top[0] : null;
    })();
    return { activeCount, totalMinutes, topClient };
  }, [members]);

  const handleMemberClick = (memberId: string) => {
    const member = members.find((m) => m.user_id === memberId);
    if (member) { setDrawerMember(member); setDrawerOpen(true); }
  };

  const handleOpenChatFromDrawer = async (memberId: string) => {
    if (!user) return;
    const existing = conversations.find(
      (c) => (c.participant_a === user.id && c.participant_b === memberId) || (c.participant_b === user.id && c.participant_a === memberId)
    );
    if (existing) {
      const otherId = existing.participant_a === user.id ? existing.participant_b : existing.participant_a;
      setActiveConversationId(existing.id);
      setActiveChatUserId(otherId);
      markConversationRead(existing.id);
    } else {
      const { data: newConvo } = await supabase.from("chat_conversations").insert({ participant_a: user.id, participant_b: memberId }).select("*").single();
      if (newConvo) {
        setConversations((prev) => [newConvo as Conversation, ...prev]);
        setActiveConversationId(newConvo.id);
        setActiveChatUserId(memberId);
      }
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
    if (status === "online") { setShowQuickSheet(true); return; }
    if (status === "offline") {
      if (isRunning) await stopTimer();
      await startBreakTimer("offline");
      setMyStatus("offline");
      await setManualStatus("offline");
      return;
    }
    if (breakStatuses.includes(status)) {
      if (isRunning) { setPendingStatus(status); setShowStopTimerDialog(true); }
      else { setMyStatus(status); await startBreakTimer(status); }
      return;
    }
    setMyStatus(status); await setManualStatus(status);
  };

  const handleConfirmStopTimer = async () => {
    if (pendingStatus) { await stopTimer(); setMyStatus(pendingStatus); await startBreakTimer(pendingStatus); setPendingStatus(null); }
    setShowStopTimerDialog(false);
  };

  const handleKeepTimerRunning = async () => {
    if (pendingStatus) { setMyStatus(pendingStatus); await setManualStatus(pendingStatus); setPendingStatus(null); }
    setShowStopTimerDialog(false);
  };

  const chatPartnerProfile = activeChatUserId ? allProfiles.find((p) => p.id === activeChatUserId) || null : null;
  const getStatusInfo = (status: string) => STATUS_MAP[status] || STATUS_MAP.offline;
  const getMemberStatusColor = (status: string): "working" | "break" | "offline" | "online" => getStatusInfo(status).color;
  const getMemberStatusLabel = (status: string): string => getStatusInfo(status).label;

  const today = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Status bar — compact */}
      <div className="mb-6">
        <TooltipProvider delayDuration={300}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted mr-2">Tu estado</span>
            {[
              { status: "online", icon: Monitor, label: "En línea" },
              { status: "break", icon: Coffee, label: "Break" },
              { status: "eating", icon: Utensils, label: "Comiendo" },
              { status: "bathroom", icon: Bath, label: "AFK" },
              { status: "meeting", icon: Video, label: "Reunión" },
              { status: "offline", icon: Moon, label: "Offline" },
            ].map(({ status, icon: Icon, label }) => (
              <Tooltip key={status}>
                <TooltipTrigger asChild>
                  <Button
                    variant={myStatus === status ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5 text-xs h-8 transition-all duration-200 active:scale-95"
                    onClick={() => handleStatusChange(status)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left — Pulse */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Hub</h1>
              <p className="text-[11px] text-foreground-muted capitalize">{today} · {teamStats.activeCount} de {members.length} trabajando</p>
            </div>
          </div>

          {/* Active now */}
          <div className="space-y-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
              Activo ahora
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((m) => {
                const statusInfo = getStatusInfo(m.status);
                const dotColor = statusDotColor[statusInfo.color] || statusDotColor.offline;
                const initials = (m.profile.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                const dailyGoal = 480; // 8h default
                const progressPct = Math.min(100, Math.round((m.todayMinutes / dailyGoal) * 100));

                return (
                  <button
                    key={m.user_id}
                    onClick={() => handleMemberClick(m.user_id)}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 hover:bg-muted/40 transition-colors text-left shadow-sm group"
                  >
                    {/* Avatar with status ring */}
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background-tertiary overflow-hidden">
                        {m.profile.avatar_url ? (
                          <img src={m.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-semibold text-foreground-secondary">{initials}</span>
                        )}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${dotColor}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {m.user_id === user?.id ? "Tú" : m.profile.name?.split(" ")[0] || "?"}
                        </span>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
                      </div>
                      {m.status !== "offline" && m.current_task ? (
                        <p className="text-[11px] text-foreground-secondary truncate">
                          {m.current_task}
                          {m.current_client && <span className="text-foreground-muted"> · {m.current_client}</span>}
                        </p>
                      ) : m.status === "offline" ? (
                        <p className="text-[10px] text-foreground-muted">
                          {m.todayHours > 0 ? `Hoy: ${formatDuration(m.todayMinutes)}` : `Offline · ${timeAgo(m.last_seen_at)}`}
                        </p>
                      ) : (
                        <p className="text-[10px] text-foreground-muted">{statusInfo.label}</p>
                      )}
                      {/* Progress bar */}
                      {m.todayMinutes > 0 && (
                        <div className="h-1 rounded-full bg-background-tertiary mt-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                      )}
                    </div>

                    {/* Hours */}
                    {m.todayMinutes > 0 && (
                      <span className="text-[11px] font-bold text-foreground tabular-nums shrink-0">
                        {formatDuration(m.todayMinutes)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity feed */}
          <div className="space-y-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              Actividad reciente
            </h2>
            {recentActivity.length > 0 ? (
              <div className="rounded-xl border border-border/50 bg-card shadow-sm divide-y divide-border/50">
                {recentActivity.map((act) => (
                  <div key={act.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-primary-foreground shrink-0"
                      style={{ backgroundColor: getClientColor(act.userName) }}
                    >
                      {act.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground">
                        <span className="font-semibold">{act.userName.split(" ")[0]}</span>
                        {" inició "}
                        <span className="font-medium">{act.description || "actividad"}</span>
                        {act.clientName && (
                          <span className="text-foreground-muted"> · {act.clientName}</span>
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] text-foreground-muted shrink-0">{timeAgo(act.started_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card shadow-sm p-6 text-center">
                <Activity className="h-5 w-5 text-foreground-muted mx-auto mb-2" />
                <p className="text-sm text-foreground-muted">Sin actividad reciente del equipo</p>
                <p className="text-[11px] text-foreground-muted/70 mt-1">El feed se actualiza en tiempo real cuando alguien registra tiempo.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — Stats + Chats */}
        <div className="space-y-4">
          {/* Team today stats */}
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
              Equipo hoy
            </h3>
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-foreground tabular-nums">{formatDuration(teamStats.totalMinutes)}</p>
              <p className="text-[10px] text-foreground-muted mt-1">de {teamStats.activeCount} personas activas</p>
            </div>
          </div>

          {/* Top client today */}
          {teamStats.topClient && (
            <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm space-y-1">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
                Top cliente hoy
              </h3>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getClientColor(teamStats.topClient) }} />
                <span className="text-sm font-semibold text-foreground">{teamStats.topClient}</span>
              </div>
            </div>
          )}

          {/* Chats */}
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
            <ChatList
              conversations={conversations}
              profiles={allProfiles}
              currentUserId={user?.id || ""}
              onOpenChat={handleOpenChat}
            />
          </div>
        </div>
      </div>

      {/* Panels/Dialogs */}
      <ChatPanel
        open={!!activeConversationId}
        onOpenChange={(open) => { if (!open) { setActiveConversationId(null); setActiveChatUserId(null); } }}
        conversationId={activeConversationId}
        partnerProfile={chatPartnerProfile}
      />
      <MemberActivityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        profile={drawerMember?.profile || null}
        status={drawerMember?.status || "offline"}
        statusLabel={drawerMember ? getMemberStatusLabel(drawerMember.status) : "Offline"}
        currentClient={drawerMember?.current_client || null}
        currentTask={drawerMember?.current_task || null}
        onOpenChat={handleOpenChatFromDrawer}
      />
      <Dialog open={showStopTimerDialog} onOpenChange={setShowStopTimerDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Detener el timer?</DialogTitle>
            <DialogDescription>
              Tienes el timer activo{activeClient ? ` para ${activeClient.name}` : ""}{activeTask ? ` · ${activeTask.title}` : ""}. ¿Deseas detenerlo?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleKeepTimerRunning}>No, mantener</Button>
            <Button variant="default" onClick={handleConfirmStopTimer}>Sí, detener</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <QuickSheet open={showQuickSheet} onOpenChange={setShowQuickSheet} mode={isRunning ? "switch" : "start"} />
    </div>
  );
}
