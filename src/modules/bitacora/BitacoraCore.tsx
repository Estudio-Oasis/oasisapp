import { useState } from "react";
import { useBitacora, useBitacoraVM } from "./BitacoraContext";
import { ActiveSessionCard } from "@/components/timer/ActiveSessionCard";
import { TimerControls } from "@/components/timer/TimerControls";
import { QuickLogInput } from "@/components/timer/QuickLogInput";
import { DayTimeline } from "@/components/timer/DayTimeline";
import { DayInsights } from "@/components/timer/DayInsights";
import { TimeEntryRow } from "@/components/timer/TimeEntryRow";
import { GapAlert } from "@/components/timer/GapAlert";
import { EmptyState } from "@/components/timer/EmptyState";
import { UI_COPY } from "@/components/timer/ActivityConstants";
import { BitacoraQuickSheet } from "./BitacoraQuickSheet";
import { ContextEnrichmentPanel } from "./ContextEnrichmentPanel";
import { StartTimerModal } from "@/components/StartTimerModal";
import { Plus } from "lucide-react";
import { formatDateLong, formatDuration, formatDayHeader } from "@/lib/timer-utils";

/**
 * BitacoraCore — the shared visual nucleus.
 * Reads everything from BitacoraContext + ViewModelContext.
 * No direct Supabase or TimerContext imports.
 */
export function BitacoraCore() {
  const bita = useBitacora();
  const vm = useBitacoraVM();

  const [quickSheetOpen, setQuickSheetOpen] = useState(false);
  const [quickSheetMode, setQuickSheetMode] = useState<"start" | "switch">("start");
  const [modalOpen, setModalOpen] = useState(false);
  const [gapPrefill, setGapPrefill] = useState<{ start: string; end: string } | null>(null);

  const { config } = bita;

  const openGapModal = (gap: { startTime: Date; endTime: Date }) => {
    const toTimeStr = (d: Date) =>
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    setGapPrefill({ start: toTimeStr(gap.startTime), end: toTimeStr(gap.endTime) });
    setModalOpen(true);
  };

  return (
    <div className="space-y-2.5 max-w-2xl mx-auto">
      {/* ── CONTROL SURFACE ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-3 pb-0">
          {bita.isRunning ? (
            <ActiveSessionCard
              variant="expanded"
              clientName={bita.activeEntry?.clientName}
              taskTitle={bita.activeEntry?.taskTitle}
              description={bita.activeEntry?.description}
              clientId={bita.activeEntry?.clientId}
              elapsedSeconds={bita.elapsedSeconds}
            >
              {/* Inline context chips — uses abstract provider */}
              {config.mode === "oasis" && <BitacoraInlineChips />}
              <TimerControls
                onSwitch={() => {
                  setQuickSheetMode("switch");
                  setQuickSheetOpen(true);
                }}
                onPause={() => {}}
                onFinish={() => void bita.stopActivity()}
                isStopping={bita.isStopping}
                layout="row"
              />
            </ActiveSessionCard>
          ) : (
            <QuickLogInput
              onClick={() => {
                setQuickSheetMode("start");
                setQuickSheetOpen(true);
              }}
              todaySummary={vm.todaySummaryText}
              totalMinutes={vm.totalMinutes}
            />
          )}
        </div>

        {/* Day state */}
        <div className="px-3 pt-2.5 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              {formatDateLong(new Date())}
            </span>
            {vm.totalMinutes > 0 && (
              <span className="text-[11px] font-bold text-foreground tabular-nums">
                {formatDuration(vm.totalMinutes)}
              </span>
            )}
          </div>
          <DayTimeline
            entries={vm.timelineEntries}
            gaps={vm.gaps}
            workStartHour={vm.workSchedule.startHour}
            workStartMinute={vm.workSchedule.startMinute}
            workEndHour={vm.workSchedule.endHour}
            workEndMinute={vm.workSchedule.endMinute}
            onGapClick={openGapModal}
          />
        </div>

        {/* Insights */}
        {vm.view === "today" && vm.entries.length > 0 && (
          <div className="border-t border-border px-3 py-2">
            <DayInsights entries={vm.entries} gapCount={vm.gaps.length} />
          </div>
        )}
      </div>

      {/* ── SECONDARY CONTROLS ── */}
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-lg bg-background-tertiary p-0.5 gap-0.5">
          {(["today", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => vm.setView(v)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                vm.view === v
                  ? "bg-foreground text-background"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {v === "today" ? UI_COPY.todayTab : UI_COPY.weekTab}
            </button>
          ))}
        </div>
        {config.features.allowFilterAll && (
          <div className="inline-flex rounded-lg bg-background-tertiary p-0.5 gap-0.5">
            {(["mine", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => vm.setEntryFilter(f)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  vm.entryFilter === f
                    ? "bg-foreground text-background"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                {f === "mine" ? UI_COPY.myEntries : UI_COPY.allEntries}
              </button>
            ))}
          </div>
        )}
        {config.features.allowManualEntry && (
          <button
            onClick={() => {
              setGapPrefill(null);
              setModalOpen(true);
            }}
            className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
            Manual
          </button>
        )}
      </div>

      {/* ── FEED ── */}
      {vm.view === "today" ? (
        !vm.hasData ? (
          <EmptyState context="no_entries" />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {vm.gaps.map((g, i) => (
                <div key={`gap-${i}`} className="px-3 py-1">
                  <GapAlert
                    startTime={g.startTime}
                    endTime={g.endTime}
                    durationMin={g.durationMin}
                    onFill={() => openGapModal(g)}
                  />
                </div>
              ))}
              {vm.entries.map((entry) => (
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
                    userName={vm.profileMap[entry.user_id]?.name}
                    showUser={vm.entryFilter === "all"}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      ) : vm.sortedDays.length === 0 ? (
        <EmptyState context="no_entries" />
      ) : (
        <div className="space-y-2.5">
          {vm.sortedDays.map((dayKey) => {
            const dayEntries = vm.groupedByDay[dayKey];
            const dayTotal = dayEntries.reduce(
              (s, e) => s + (Number(e.duration_min) || 0),
              0
            );
            return (
              <div
                key={dayKey}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
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
                        userName={vm.profileMap[entry.user_id]?.name}
                        showUser={vm.entryFilter === "all"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── QUICK SHEET ── */}
      <BitacoraQuickSheet
        open={quickSheetOpen}
        onOpenChange={(open) => {
          setQuickSheetOpen(open);
          if (!open) vm.refresh();
        }}
        mode={quickSheetMode}
      />

      {/* ── MANUAL MODAL (OasisOS only) ── */}
      {config.features.allowManualEntry && (
        <StartTimerModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) {
              setGapPrefill(null);
              vm.refresh();
            }
          }}
          mode="manual"
          prefillStartTime={gapPrefill?.start}
          prefillEndTime={gapPrefill?.end}
        />
      )}
    </div>
  );
}
