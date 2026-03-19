import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DayTimeline } from "@/components/timer/DayTimeline";
import { getNormalizedActivityType, getActivityConfig } from "@/components/timer/ActivityConstants";
import { getClientColor, isSameDay, startOfDay, startOfWeek } from "@/lib/timer-utils";
import { Clock, User, Briefcase, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

interface MemberProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
  job_title?: string | null;
  role?: string;
}

interface EntryWithRelations {
  id: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_min: number | null;
  client_id: string | null;
  task_id: string | null;
  project_id: string | null;
  user_id: string;
  clients: { name: string } | null;
  tasks: { title: string } | null;
}

interface ActiveSession {
  startedAt: string;
  description: string | null;
  clientName: string | null;
  clientId: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: MemberProfile | null;
  status: string;
  statusLabel: string;
  currentClient: string | null;
  currentTask: string | null;
}

type Period = "today" | "yesterday" | "week";

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  if (period === "today") {
    return { start: startOfDay(now), end: now };
  }
  if (period === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return { start: startOfDay(yesterday), end: startOfDay(now) };
  }
  return { start: startOfWeek(now), end: now };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(min: number | null) {
  if (!min) return "0m";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function MemberActivityDrawer({
  open,
  onOpenChange,
  profile,
  status,
  statusLabel,
  currentClient,
  currentTask,
}: Props) {
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<Period>("today");
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { start, end } = getPeriodRange(period);

    let query = supabase
      .from("time_entries")
      .select("*, clients(name), tasks(title)")
      .eq("user_id", profile.id)
      .not("ended_at", "is", null)
      .gte("started_at", start.toISOString())
      .lte("started_at", end.toISOString())
      .order("started_at", { ascending: false });

    const { data } = await query;
    setEntries((data || []) as EntryWithRelations[]);
    setLoading(false);
  }, [profile, period]);

  useEffect(() => {
    if (open && profile) {
      setPeriod("today");
      fetchEntries();
    }
  }, [open, profile]);

  useEffect(() => {
    if (open && profile) fetchEntries();
  }, [period, fetchEntries, open, profile]);

  // Realtime updates
  useEffect(() => {
    if (!open || !profile) return;
    const channel = supabase
      .channel(`member-activity-${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "time_entries", filter: `user_id=eq.${profile.id}` }, () => {
        fetchEntries();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, profile, fetchEntries]);

  if (!profile) return null;

  const totalMinutes = entries.reduce((sum, e) => sum + (Number(e.duration_min) || 0), 0);

  // Productive vs break
  const productiveMin = entries.reduce((sum, e) => {
    const actType = getNormalizedActivityType({ description: e.description, client_id: e.client_id });
    return actType === "break" || actType === "food" ? sum : sum + (Number(e.duration_min) || 0);
  }, 0);
  const breakMin = totalMinutes - productiveMin;

  // Top client
  const clientMinutes: Record<string, { name: string; min: number }> = {};
  entries.forEach((e) => {
    if (e.clients?.name) {
      const key = e.clients.name;
      if (!clientMinutes[key]) clientMinutes[key] = { name: key, min: 0 };
      clientMinutes[key].min += Number(e.duration_min) || 0;
    }
  });
  const topClient = Object.values(clientMinutes).sort((a, b) => b.min - a.min)[0];

  // Timeline entries for today
  const today = new Date();
  const timelineEntries = period === "today"
    ? entries
        .filter((e) => e.ended_at && isSameDay(new Date(e.started_at), today))
        .map((e) => ({
          startedAt: e.started_at,
          endedAt: e.ended_at!,
          clientName: e.clients?.name || null,
          clientId: e.client_id,
          description: e.description,
          durationMin: e.duration_min,
        }))
    : [];

  // Active session info
  const activeSession: ActiveSession | null =
    status === "working" && currentClient
      ? { startedAt: new Date().toISOString(), description: currentTask, clientName: currentClient, clientId: null }
      : null;

  const initials = (profile.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusColor: Record<string, string> = {
    working: "bg-success",
    online: "bg-primary",
    break: "bg-accent",
    eating: "bg-accent",
    bathroom: "bg-accent",
    meeting: "bg-success",
    offline: "bg-muted-foreground",
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        {isMobile && (
          <button onClick={() => onOpenChange(false)} className="p-1 -ml-1">
            <ArrowLeft className="h-5 w-5 text-foreground-muted" />
          </button>
        )}
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-background-secondary flex items-center justify-center overflow-hidden border-2 border-border">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-foreground-secondary">{initials}</span>
            )}
          </div>
          <div className={cn("absolute -bottom-0.5 right-0 h-3 w-3 rounded-full border-2 border-background", statusColor[status] || "bg-muted-foreground")} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{profile.name}</h3>
          <p className="text-xs text-foreground-muted">{statusLabel}</p>
          {status === "working" && currentClient && (
            <p className="text-xs text-accent truncate mt-0.5">
              {currentClient}{currentTask ? ` · ${currentTask}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 mt-3 mb-3">
        {([
          { key: "today" as Period, label: "Hoy" },
          { key: "yesterday" as Period, label: "Ayer" },
          { key: "week" as Period, label: "Esta semana" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors",
              period === key
                ? "bg-accent/15 text-accent"
                : "bg-background-secondary text-foreground-muted hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-background-secondary p-2.5 text-center">
          <p className="text-lg font-bold text-foreground tabular-nums">{formatDuration(totalMinutes)}</p>
          <p className="text-[10px] text-foreground-muted">Total</p>
        </div>
        <div className="rounded-lg bg-background-secondary p-2.5 text-center">
          <p className="text-lg font-bold text-success tabular-nums">{formatDuration(productiveMin)}</p>
          <p className="text-[10px] text-foreground-muted">Productivo</p>
        </div>
        <div className="rounded-lg bg-background-secondary p-2.5 text-center">
          <p className="text-lg font-bold text-foreground-secondary tabular-nums">{formatDuration(breakMin)}</p>
          <p className="text-[10px] text-foreground-muted">Pausas</p>
        </div>
      </div>

      {topClient && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <Briefcase className="h-3.5 w-3.5 text-foreground-muted" />
          <span className="text-xs text-foreground-muted">Cliente principal:</span>
          <span className="text-xs font-medium text-foreground">{topClient.name} ({formatDuration(topClient.min)})</span>
        </div>
      )}

      {/* Timeline (today only) */}
      {period === "today" && timelineEntries.length > 0 && (
        <div className="mb-3">
          <TooltipProvider>
            <DayTimeline entries={timelineEntries} gaps={[]} activeSession={activeSession} />
          </TooltipProvider>
        </div>
      )}

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {loading ? (
          <div className="text-center py-8">
            <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sin registros en este periodo</p>
          </div>
        ) : (
          entries.map((entry) => {
            const actType = getNormalizedActivityType({ description: entry.description, client_id: entry.client_id });
            const config = getActivityConfig(actType);
            const Icon = config.icon;
            const color = entry.client_id ? getClientColor(entry.clients?.name || "") : config.color;

            return (
              <div key={entry.id} className="flex items-start gap-2.5 px-1 py-2 rounded-lg hover:bg-background-secondary transition-colors">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">
                    {entry.description || config.label}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.clients?.name && (
                      <span className="text-[11px] text-foreground-secondary truncate">{entry.clients.name}</span>
                    )}
                    {entry.tasks?.title && (
                      <span className="text-[11px] text-foreground-muted italic truncate">{entry.tasks.title}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-medium text-foreground tabular-nums">{formatDuration(entry.duration_min)}</p>
                  <p className="text-[10px] text-foreground-muted tabular-nums">
                    {formatTime(entry.started_at)}{entry.ended_at ? ` - ${formatTime(entry.ended_at)}` : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          isMobile
            ? "rounded-t-2xl max-h-[95dvh] h-[95dvh]"
            : "w-[420px] sm:max-w-[420px]"
        )}
      >
        <SheetTitle className="sr-only">Actividad de {profile.name}</SheetTitle>
        {content}
      </SheetContent>
    </Sheet>
  );
}
