import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { StartTimerModal } from "@/components/StartTimerModal";
import { Button } from "@/components/ui/button";
import {
  formatElapsed,
  formatDuration,
  formatTime,
  formatDateLong,
  formatDayHeader,
  getClientColor,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "@/lib/timer-utils";
import { Clock, AlertTriangle, Loader2, Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type TimeEntry = Tables<"time_entries">;

interface EntryWithRelations extends TimeEntry {
  clients: { name: string } | null;
  tasks: { title: string } | null;
}

interface ProfileInfo { id: string; name: string | null; }

interface GapInfo {
  startTime: Date;
  endTime: Date;
  durationMin: number;
}

export default function TimerPage() {
  const { user } = useAuth();
  const { isRunning, isStopping, activeClient, activeTask, elapsedSeconds, stopTimer } = useTimer();
  const [view, setView] = useState<"today" | "week">("today");
  const [entryFilter, setEntryFilter] = useState<"mine" | "all">("mine");
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, ProfileInfo>>({});
  const [gaps, setGaps] = useState<GapInfo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"start" | "switch" | "manual">("start");
  const [gapPrefill, setGapPrefill] = useState<{ start: string; end: string } | null>(null);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("id, name");
    const map: Record<string, ProfileInfo> = {};
    ((data || []) as ProfileInfo[]).forEach((p) => { map[p.id] = p; });
    setProfileMap(map);
  }, []);

  const fetchEntries = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const rangeStart = view === "today" ? startOfDay(now) : startOfWeek(now);

    let query = supabase
      .from("time_entries")
      .select("*, clients(name), tasks(title)")
      .not("ended_at", "is", null)
      .gte("started_at", rangeStart.toISOString())
      .order("started_at", { ascending: false });

    if (entryFilter === "mine") {
      query = query.eq("user_id", user.id);
    }

    const { data } = await query;

    const typedData = (data || []) as EntryWithRelations[];
    setEntries(typedData);

    if (view === "today") {
      detectGaps(typedData);
    } else {
      setGaps([]);
    }
  }, [user, view, entryFilter]);

  useEffect(() => {
    fetchProfiles();
    fetchEntries();
  }, [fetchEntries, fetchProfiles, isRunning]);

  const detectGaps = (todayEntries: EntryWithRelations[]) => {
    const today = new Date();
    const sorted = [...todayEntries]
      .filter((e) => e.ended_at && isSameDay(new Date(e.started_at), today))
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

    const foundGaps: GapInfo[] = [];
    const THRESHOLD = 30;

    const nineAm = new Date(today);
    nineAm.setHours(9, 0, 0, 0);

    if (today.getHours() >= 9) {
      if (sorted.length === 0) {
        const gapMin = Math.round((Date.now() - nineAm.getTime()) / 60000);
        if (gapMin > THRESHOLD) {
          foundGaps.push({ startTime: nineAm, endTime: new Date(), durationMin: gapMin });
        }
      } else {
        const firstStart = new Date(sorted[0].started_at);
        const gapMin = Math.round((firstStart.getTime() - nineAm.getTime()) / 60000);
        if (gapMin > THRESHOLD) {
          foundGaps.push({ startTime: nineAm, endTime: firstStart, durationMin: gapMin });
        }
      }
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      const currEnd = new Date(sorted[i].ended_at!);
      const nextStart = new Date(sorted[i + 1].started_at);
      const gapMin = Math.round((nextStart.getTime() - currEnd.getTime()) / 60000);
      if (gapMin > THRESHOLD) {
        foundGaps.push({ startTime: currEnd, endTime: nextStart, durationMin: gapMin });
      }
    }

    setGaps(foundGaps);
  };

  const totalMinutes = entries.reduce((sum, e) => sum + (Number(e.duration_min) || 0), 0);

  const groupedByDay = entries.reduce<Record<string, EntryWithRelations[]>>((acc, entry) => {
    const dayKey = startOfDay(new Date(entry.started_at)).toISOString();
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(entry);
    return acc;
  }, {});

  const sortedDays = Object.keys(groupedByDay).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const openGapModal = (gap: GapInfo) => {
    const toTimeStr = (d: Date) =>
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    setGapPrefill({ start: toTimeStr(gap.startTime), end: toTimeStr(gap.endTime) });
    setModalMode("manual");
    setModalOpen(true);
  };

  const renderEntry = (entry: EntryWithRelations) => {
    const clientName = entry.clients?.name || "Unknown";
    const taskTitle = entry.tasks?.title;
    const start = new Date(entry.started_at);
    const end = entry.ended_at ? new Date(entry.ended_at) : null;
    const dur = Number(entry.duration_min) || 0;

    return (
      <div key={entry.id} className="flex items-center gap-3 border-b border-border py-3.5">
        <div className="w-[3px] h-8 rounded-sm shrink-0" style={{ backgroundColor: getClientColor(clientName) }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {taskTitle || <span className="text-foreground-muted font-normal">No task</span>}
          </p>
          <p className="text-xs text-foreground-secondary truncate">
            {clientName}
            {entry.description && <span className="text-foreground-muted"> · {entry.description}</span>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-small text-foreground-secondary">
            {formatTime(start)}{end && ` – ${formatTime(end)}`}
          </p>
          <p className="text-small font-semibold text-foreground">{formatDuration(dur)}</p>
        </div>
      </div>
    );
  };

  const renderGap = (gap: GapInfo, idx: number) => (
    <div key={`gap-${idx}`} className="flex items-center gap-3 rounded-lg border border-dashed border-accent bg-accent-light px-4 py-3 my-1">
      <AlertTriangle className="h-4 w-4 text-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-small font-medium text-foreground">Untracked time · {formatDuration(gap.durationMin)}</p>
        <p className="text-xs text-foreground-secondary">{formatTime(gap.startTime)} – {formatTime(gap.endTime)}</p>
      </div>
      <button onClick={() => openGapModal(gap)} className="shrink-0 h-8 px-3 rounded-md border border-border bg-background text-xs font-semibold text-foreground hover:bg-background-tertiary transition-colors whitespace-nowrap">
        What happened here?
      </button>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Clock className="h-10 w-10 text-border mb-4" />
      <h3 className="text-h3 text-foreground">No time tracked yet {view === "today" ? "today" : "this week"}</h3>
      <p className="text-sm text-foreground-secondary mt-1">Start the timer to begin tracking your work.</p>
    </div>
  );

  return (
    <div>
      {isRunning && (
        <div className="rounded-xl border border-accent bg-accent-light px-5 py-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-micro text-accent">Live Session</p>
              <p className="text-h3 text-foreground mt-1">{activeClient?.name || "Client"}</p>
              <p className="text-sm text-foreground-secondary">{activeTask?.title || "No specific task"}</p>
            </div>
            <div className="text-right">
              <p className="text-display text-accent tabular-nums">{formatElapsed(elapsedSeconds)}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setModalMode("switch"); setModalOpen(true); }} className="h-9 px-4 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:bg-background-tertiary transition-colors">Switch</button>
                <Button variant="destructive" size="sm" className="h-9" onClick={() => void stopTimer()} disabled={isStopping}>
                  {isStopping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Stop"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-foreground">Timer</h1>
          <p className="text-sm text-foreground-secondary mt-0.5">{formatDateLong(new Date())}</p>
        </div>
        <div className="rounded-lg border border-border bg-background-secondary px-3 py-1.5">
          <span className="text-sm font-semibold text-foreground">{formatDuration(totalMinutes)} {view === "today" ? "today" : "this week"}</span>
        </div>
      </div>

      <div className="mt-6 mb-6 inline-flex rounded-lg bg-background-secondary p-1">
        {(["today", "week"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${view === v ? "bg-foreground text-background" : "text-foreground-secondary hover:text-foreground"}`}>
            {v === "today" ? "Today" : "This Week"}
          </button>
        ))}
      </div>

      {view === "today" ? (
        entries.length === 0 && gaps.length === 0 ? <EmptyState /> : (
          <div>
            {gaps.map((g, i) => renderGap(g, i))}
            {entries.map(renderEntry)}
          </div>
        )
      ) : sortedDays.length === 0 ? <EmptyState /> : (
        <div className="space-y-2">
          {sortedDays.map((dayKey) => {
            const dayEntries = groupedByDay[dayKey];
            const dayTotal = dayEntries.reduce((s, e) => s + (Number(e.duration_min) || 0), 0);
            return (
              <div key={dayKey}>
                <div className="flex items-center justify-between bg-background-secondary rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-foreground">{formatDayHeader(new Date(dayKey))}</span>
                  <span className="text-sm font-semibold text-foreground">{formatDuration(dayTotal)}</span>
                </div>
                {dayEntries.map(renderEntry)}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <Button variant="outline" onClick={() => { setGapPrefill(null); setModalMode("manual"); setModalOpen(true); }} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-1.5" />Add manual entry
        </Button>
      </div>

      <StartTimerModal
        open={modalOpen}
        onOpenChange={(open) => { setModalOpen(open); if (!open) { setGapPrefill(null); fetchEntries(); } }}
        mode={modalMode}
        prefillStartTime={gapPrefill?.start}
        prefillEndTime={gapPrefill?.end}
      />
    </div>
  );
}

