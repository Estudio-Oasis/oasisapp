import { useState } from "react";
import { useTimer } from "@/contexts/TimerContext";
import { useRole } from "@/hooks/useRole";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { ActiveSessionCard } from "@/components/timer/ActiveSessionCard";
import { TimerControls } from "@/components/timer/TimerControls";
import { QuickLogInput } from "@/components/timer/QuickLogInput";
import { DayTimeline } from "@/components/timer/DayTimeline";
import { DayInsights } from "@/components/timer/DayInsights";
import { TimeEntryRow } from "@/components/timer/TimeEntryRow";
import { GapAlert } from "@/components/timer/GapAlert";
import { EmptyState } from "@/components/timer/EmptyState";
import { UI_COPY } from "@/components/timer/ActivityConstants";
import { StartTimerModal } from "@/components/StartTimerModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  formatDateLong,
  formatDuration,
  formatDayHeader,
} from "@/lib/timer-utils";

export default function BitacoraPage() {
  const { isRunning, isStopping, activeClient, activeTask, activeEntry, elapsedSeconds, stopTimer } = useTimer();
  const { isAdmin } = useRole();

  const [view, setView] = useState<"today" | "week">("today");
  const [entryFilter, setEntryFilter] = useState<"mine" | "all">(isAdmin ? "all" : "mine");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"start" | "switch" | "manual">("start");
  const [gapPrefill, setGapPrefill] = useState<{ start: string; end: string } | null>(null);

  const {
    entries,
    profileMap,
    gaps,
    totalMinutes,
    groupedByDay,
    sortedDays,
    fetchEntries,
    workSchedule,
  } = useTimeEntries({ view, entryFilter, refreshTrigger: isRunning });

  const openGapModal = (gap: { startTime: Date; endTime: Date }) => {
    const toTimeStr = (d: Date) =>
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    setGapPrefill({ start: toTimeStr(gap.startTime), end: toTimeStr(gap.endTime) });
    setModalMode("manual");
    setModalOpen(true);
  };

  // Build timeline entries for DayTimeline
  const timelineEntries = view === "today"
    ? entries
        .filter((e) => e.ended_at)
        .map((e) => ({
          startedAt: e.started_at,
          endedAt: e.ended_at!,
          clientName: e.clients?.name,
          clientId: e.client_id,
          description: e.description,
          durationMin: e.duration_min,
        }))
    : [];

  return (
    <div className="space-y-6">
      {/* ── Section: Hero ── */}
      {isRunning ? (
        <ActiveSessionCard
          variant="expanded"
          clientName={activeClient?.name}
          taskTitle={activeTask?.title}
          description={activeEntry?.description}
          clientId={activeEntry?.client_id}
          elapsedSeconds={elapsedSeconds}
        >
          <TimerControls
            onSwitch={() => { setModalMode("switch"); setModalOpen(true); }}
            onPause={(type) => { /* handled via TimerContext.startBreakTimer */ }}
            onFinish={() => void stopTimer()}
            isStopping={isStopping}
            layout="row"
          />
        </ActiveSessionCard>
      ) : (
        <QuickLogInput onClick={() => { setModalMode("start"); setModalOpen(true); }} />
      )}

      {/* ── Section: Header + Summary ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-foreground">{UI_COPY.pageTitle}</h1>
          <p className="text-sm text-foreground-secondary mt-0.5">{formatDateLong(new Date())}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-1.5">
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {formatDuration(totalMinutes)} {view === "today" ? UI_COPY.todayTab.toLowerCase() : UI_COPY.weekTab.toLowerCase()}
          </span>
        </div>
      </div>

      {/* ── Section: Timeline Visual ── */}
      {view === "today" && (entries.length > 0 || gaps.length > 0) && (
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <DayTimeline
            entries={timelineEntries}
            gaps={gaps}
            workStartHour={workSchedule.startHour}
            workStartMinute={workSchedule.startMinute}
            workEndHour={workSchedule.endHour}
            workEndMinute={workSchedule.endMinute}
            onGapClick={openGapModal}
          />
        </div>
      )}

      {/* ── Section: Day Insights ── */}
      {view === "today" && entries.length > 0 && (
        <DayInsights entries={entries} gapCount={gaps.length} />
      )}

      {/* ── Section: Filters ── */}
      <div className="flex items-center gap-4">
        <div className="inline-flex rounded-lg bg-background-secondary p-1">
          {(["today", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                view === v
                  ? "bg-foreground text-background"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {v === "today" ? UI_COPY.todayTab : UI_COPY.weekTab}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg bg-background-secondary p-1">
          {(["mine", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setEntryFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                entryFilter === f
                  ? "bg-foreground text-background"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {f === "mine" ? UI_COPY.myEntries : UI_COPY.allEntries}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section: Feed ── */}
      {view === "today" ? (
        entries.length === 0 && gaps.length === 0 ? (
          <EmptyState context="no_entries" />
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <div className="divide-y divide-border px-4">
              {gaps.map((g, i) => (
                <div key={`gap-${i}`} className="py-1">
                  <GapAlert
                    startTime={g.startTime}
                    endTime={g.endTime}
                    durationMin={g.durationMin}
                    onFill={() => openGapModal(g)}
                  />
                </div>
              ))}
              {entries.map((entry) => (
                <TimeEntryRow
                  key={entry.id}
                  id={entry.id}
                  description={entry.description}
                  clientId={entry.client_id}
                  clientName={entry.clients?.name}
                  taskTitle={entry.tasks?.title}
                  startedAt={entry.started_at}
                  endedAt={entry.ended_at}
                  durationMin={entry.duration_min}
                  userId={entry.user_id}
                  userName={profileMap[entry.user_id]?.name}
                  showUser={entryFilter === "all"}
                />
              ))}
            </div>
          </div>
        )
      ) : sortedDays.length === 0 ? (
        <EmptyState context="no_entries" />
      ) : (
        <div className="space-y-3">
          {sortedDays.map((dayKey) => {
            const dayEntries = groupedByDay[dayKey];
            const dayTotal = dayEntries.reduce((s, e) => s + (Number(e.duration_min) || 0), 0);
            return (
              <div key={dayKey} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between bg-background-secondary px-4 py-2.5">
                  <span className="text-sm font-semibold text-foreground">
                    {formatDayHeader(new Date(dayKey))}
                  </span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {formatDuration(dayTotal)}
                  </span>
                </div>
                <div className="divide-y divide-border px-4">
                  {dayEntries.map((entry) => (
                    <TimeEntryRow
                      key={entry.id}
                      id={entry.id}
                      description={entry.description}
                      clientId={entry.client_id}
                      clientName={entry.clients?.name}
                      taskTitle={entry.tasks?.title}
                      startedAt={entry.started_at}
                      endedAt={entry.ended_at}
                      durationMin={entry.duration_min}
                      userId={entry.user_id}
                      userName={profileMap[entry.user_id]?.name}
                      showUser={entryFilter === "all"}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Section: Manual entry ── */}
      <Button
        variant="outline"
        onClick={() => { setGapPrefill(null); setModalMode("manual"); setModalOpen(true); }}
        className="w-full md:w-auto"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        {UI_COPY.btnManualEntry}
      </Button>

      {/* ── Modal ── */}
      <StartTimerModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) { setGapPrefill(null); fetchEntries(); }
        }}
        mode={modalMode}
        prefillStartTime={gapPrefill?.start}
        prefillEndTime={gapPrefill?.end}
      />
    </div>
  );
}
