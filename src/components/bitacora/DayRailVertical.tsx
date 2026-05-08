import { useState, useEffect, useMemo } from "react";
import { getClientColor, formatDuration, formatTime } from "@/lib/timer-utils";
import { getNormalizedActivityType, getActivityConfig } from "@/components/timer/ActivityConstants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TimelineEntry {
  startedAt: string;
  endedAt: string;
  clientName?: string | null;
  clientId?: string | null;
  description?: string | null;
  durationMin?: number | null;
}
interface TimelineGap { startTime: Date; endTime: Date; durationMin: number; }
interface ActiveSessionInfo {
  startedAt: string;
  description?: string | null;
  clientName?: string | null;
  clientId?: string | null;
}

type FilterMode = "all" | "billable" | "gaps";

interface Props {
  entries: TimelineEntry[];
  gaps: TimelineGap[];
  activeSession?: ActiveSessionInfo | null;
  onGapClick?: (gap: TimelineGap) => void;
  onEntryClick?: (entry: TimelineEntry) => void;
  workStartHour?: number;
  workEndHour?: number;
  /** entries marked billable (set of startedAt+endedAt keys) */
  billableKeys?: Set<string>;
}

/**
 * DayRail vertical — Cassiu v2 design.
 * Left rail with hour markers (08→19), blocks anchored vertically with height
 * proportional to duration. Striped gaps. Now-needle in amber.
 */
export function DayRailVertical({
  entries, gaps, activeSession, onGapClick, onEntryClick,
  workStartHour = 8, workEndHour = 19, billableKeys,
}: Props) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!activeSession) return;
    const iv = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, [activeSession]);

  const day = new Date();
  const rangeStart = new Date(day);
  rangeStart.setHours(workStartHour, 0, 0, 0);
  const rangeEnd = new Date(day);
  rangeEnd.setHours(workEndHour, 0, 0, 0);
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  const PX_PER_HOUR = 56;
  const totalHeight = (workEndHour - workStartHour) * PX_PER_HOUR;

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = workStartHour; h <= workEndHour; h++) arr.push(h);
    return arr;
  }, [workStartHour, workEndHour]);

  const showEntries = filter !== "gaps";
  const showGaps = filter !== "billable";

  const visibleEntries = entries.filter((e) => {
    if (!showEntries) return false;
    if (filter === "billable") {
      const key = `${e.startedAt}|${e.endedAt}`;
      return billableKeys?.has(key);
    }
    return true;
  });

  const now = Date.now();
  const isToday = true;
  const showNow = isToday && now >= rangeStart.getTime() && now <= rangeEnd.getTime();
  const nowTop = showNow ? ((now - rangeStart.getTime()) / totalMs) * totalHeight : 0;

  const posFor = (start: number, end: number) => {
    const top = Math.max(0, ((start - rangeStart.getTime()) / totalMs) * totalHeight);
    const height = Math.max(8, ((end - start) / totalMs) * totalHeight);
    return { top, height: Math.min(height, totalHeight - top) };
  };

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex items-center gap-1.5">
        {([
          { id: "all", label: "Todo" },
          { id: "billable", label: "Facturable" },
          { id: "gaps", label: "Huecos" },
        ] as const).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={`h-7 px-3 rounded-full text-[11px] font-semibold transition-colors ${
              filter === opt.id
                ? "bg-foreground text-background"
                : "bg-background-tertiary text-foreground-secondary hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] uppercase tracking-widest text-foreground-muted tabular-nums">
          {workStartHour}h → {workEndHour}h
        </span>
      </div>

      {/* Rail */}
      <div className="relative" style={{ height: totalHeight }}>
        {/* Hour gridlines + labels */}
        {hours.map((h, i) => {
          const top = i * PX_PER_HOUR;
          return (
            <div key={h} className="absolute left-0 right-0 flex items-start" style={{ top }}>
              <span className="w-12 -mt-2 text-[10px] font-medium text-foreground-muted tabular-nums pr-2 text-right">
                {String(h).padStart(2, "0")}:00
              </span>
              <div className="flex-1 border-t border-border/40" />
            </div>
          );
        })}

        {/* Half-hour ticks */}
        {hours.slice(0, -1).map((h, i) => (
          <div
            key={`half-${h}`}
            className="absolute left-12 right-0 border-t border-dashed border-border/20"
            style={{ top: i * PX_PER_HOUR + PX_PER_HOUR / 2 }}
          />
        ))}

        {/* Content area */}
        <div className="absolute left-12 right-0 top-0 bottom-0 ml-2">
          {/* Gaps (striped) */}
          {showGaps && gaps.map((g, i) => {
            const { top, height } = posFor(
              Math.max(g.startTime.getTime(), rangeStart.getTime()),
              Math.min(g.endTime.getTime(), rangeEnd.getTime())
            );
            if (height <= 0) return null;
            return (
              <Tooltip key={`gap-${i}`}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onGapClick?.(g)}
                    className="absolute left-0 right-3 rounded-lg hover:opacity-80 transition-all cursor-pointer overflow-hidden group"
                    style={{
                      top, height,
                      background: "repeating-linear-gradient(135deg, transparent, transparent 4px, hsl(var(--accent) / 0.1) 4px, hsl(var(--accent) / 0.1) 8px)",
                      border: "1px dashed hsl(var(--accent) / 0.4)",
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-accent/80 group-hover:text-accent">
                      Hueco · {formatDuration(g.durationMin)} · + Llenar
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {formatTime(g.startTime)} – {formatTime(g.endTime)} · sin registrar
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Entries */}
          {visibleEntries.map((e, i) => {
            const sMs = new Date(e.startedAt).getTime();
            const enMs = new Date(e.endedAt).getTime();
            const { top, height } = posFor(
              Math.max(sMs, rangeStart.getTime()),
              Math.min(enMs, rangeEnd.getTime())
            );
            if (height <= 0) return null;
            const actType = getNormalizedActivityType({ description: e.description, client_id: e.clientId });
            const config = getActivityConfig(actType);
            const color = e.clientId ? getClientColor(e.clientName || "") : config.color;
            const showLabel = height >= 28;
            const showMeta = height >= 44;

            return (
              <Tooltip key={`e-${i}`}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onEntryClick?.(e)}
                    className="absolute left-0 right-3 rounded-lg overflow-hidden text-left hover:brightness-110 transition-all shadow-sm hover:shadow-md"
                    style={{ top, height, backgroundColor: color }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20" />
                    <div className="relative h-full px-2.5 py-1.5 flex flex-col justify-between text-white">
                      {showLabel && (
                        <p className="text-[11px] font-semibold leading-tight truncate drop-shadow-sm">
                          {e.description || e.clientName || config.label}
                        </p>
                      )}
                      {showMeta && (
                        <div className="flex items-center justify-between text-[9px] font-medium opacity-80 tabular-nums">
                          <span className="truncate">{e.clientName || config.label}</span>
                          <span className="ml-2 shrink-0">{formatDuration(e.durationMin || 0)}</span>
                        </div>
                      )}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs max-w-[240px]">
                  <div className="space-y-0.5">
                    {e.description && <p className="font-semibold">{e.description}</p>}
                    {e.clientName && <p className="text-foreground-secondary">{e.clientName}</p>}
                    <p className="text-foreground-muted tabular-nums">
                      {formatTime(new Date(e.startedAt))} – {formatTime(new Date(e.endedAt))} · {formatDuration(e.durationMin || 0)}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Active session block */}
          {activeSession && showEntries && (() => {
            const sMs = new Date(activeSession.startedAt).getTime();
            const { top, height } = posFor(
              Math.max(sMs, rangeStart.getTime()),
              Math.min(now, rangeEnd.getTime())
            );
            if (height <= 0) return null;
            const actType = getNormalizedActivityType({ description: activeSession.description, client_id: activeSession.clientId });
            const config = getActivityConfig(actType);
            const color = activeSession.clientId ? getClientColor(activeSession.clientName || "") : config.color;
            return (
              <div
                className="absolute left-0 right-3 rounded-lg overflow-hidden ring-2 ring-accent ring-offset-2 ring-offset-card animate-pulse"
                style={{ top, height, backgroundColor: color, opacity: 0.85 }}
              >
                <div className="px-2.5 py-1.5 text-white">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">En curso</span>
                  </div>
                  {height >= 32 && (
                    <p className="text-[11px] font-semibold leading-tight truncate mt-0.5 drop-shadow-sm">
                      {activeSession.description || "Actividad"}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Now needle */}
          {showNow && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: nowTop }}
            >
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_6px_hsl(var(--accent)/0.6)]" />
                <div className="flex-1 h-[2px] bg-accent" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
