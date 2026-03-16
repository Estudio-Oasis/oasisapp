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
import { QuickSheet } from "@/components/timer/QuickSheet";
import { StartTimerModal } from "@/components/StartTimerModal";
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
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);
  const [quickSheetMode, setQuickSheetMode] = useState<"start" | "switch">("start");
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

  const todaySummaryText = totalMinutes > 0
    ? `${formatDuration(totalMinutes)} registradas`
    : "Tu día empieza aquí";

  const hasData = entries.length > 0 || gaps.length > 0;

  return (
    <div className="space-y-2.5 max-w-2xl mx-auto">
      {/* ── CONTROL SURFACE ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Launcher — THE primary action */}
        <div className="p-3 pb-0">
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
                onPause={() => {}}
                onFinish={() => void stopTimer()}
                isStopping={isStopping}
                layout="row"
              />
            </ActiveSessionCard>
          ) : (
            <QuickLogInput
              onClick={() => { setModalMode("start"); setModalOpen(true); }}
              todaySummary={todaySummaryText}
              totalMinutes={totalMinutes}
            />
          )}
        </div>

        {/* Day state — date + timeline integrated */}
        <div className="px-3 pt-2.5 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              {formatDateLong(new Date())}
            </span>
            {totalMinutes > 0 && (
              <span className="text-[11px] font-bold text-foreground tabular-nums">
                {formatDuration(totalMinutes)}
              </span>
            )}
          </div>
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

        {/* Insights — compact, only when there's data */}
        {view === "today" && entries.length > 0 && (
          <div className="border-t border-border px-3 py-2">
            <DayInsights entries={entries} gapCount={gaps.length} />
          </div>
        )}
      </div>

      {/* ── SECONDARY CONTROLS ── */}
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-lg bg-background-tertiary p-0.5 gap-0.5">
          {(["today", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                view === v
                  ? "bg-foreground text-background"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {v === "today" ? UI_COPY.todayTab : UI_COPY.weekTab}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg bg-background-tertiary p-0.5 gap-0.5">
          {(["mine", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setEntryFilter(f)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                entryFilter === f
                  ? "bg-foreground text-background"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {f === "mine" ? UI_COPY.myEntries : UI_COPY.allEntries}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setGapPrefill(null); setModalMode("manual"); setModalOpen(true); }}
          className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-foreground-muted hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          Manual
        </button>
      </div>

      {/* ── FEED ── */}
      {view === "today" ? (
        !hasData ? (
          <EmptyState context="no_entries" />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {gaps.map((g, i) => (
                <div key={`gap-${i}`} className="px-3 py-1">
                  <GapAlert
                    startTime={g.startTime}
                    endTime={g.endTime}
                    durationMin={g.durationMin}
                    onFill={() => openGapModal(g)}
                  />
                </div>
              ))}
              {entries.map((entry) => (
                <div key={entry.id} className="px-3">
                  <TimeEntryRow
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
                </div>
              ))}
            </div>
          </div>
        )
      ) : sortedDays.length === 0 ? (
        <EmptyState context="no_entries" />
      ) : (
        <div className="space-y-2.5">
          {sortedDays.map((dayKey) => {
            const dayEntries = groupedByDay[dayKey];
            const dayTotal = dayEntries.reduce((s, e) => s + (Number(e.duration_min) || 0), 0);
            return (
              <div key={dayKey} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between bg-background-secondary px-3 py-2">
                  <span className="text-[11px] font-semibold text-foreground">
                    {formatDayHeader(new Date(dayKey))}
                  </span>
                  <span className="text-[11px] font-semibold text-foreground tabular-nums">
                    {formatDuration(dayTotal)}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="px-3">
                      <TimeEntryRow
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
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL ── */}
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
