import { getClientColor } from "@/lib/timer-utils";
import { getNormalizedActivityType, getActivityConfig } from "./ActivityConstants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TimelineEntry {
  startedAt: string;
  endedAt: string;
  clientName?: string | null;
  clientId?: string | null;
  description?: string | null;
  durationMin?: number | null;
}

interface TimelineGap {
  startTime: Date;
  endTime: Date;
  durationMin: number;
}

interface DayTimelineProps {
  entries: TimelineEntry[];
  gaps: TimelineGap[];
  workStartHour?: number;
  workStartMinute?: number;
  workEndHour?: number;
  workEndMinute?: number;
  onGapClick?: (gap: TimelineGap) => void;
  onEntryClick?: (entry: TimelineEntry) => void;
}

export function DayTimeline({
  entries,
  gaps,
  workStartHour = 9,
  workStartMinute = 0,
  workEndHour = 18,
  workEndMinute = 0,
  onGapClick,
  onEntryClick,
}: DayTimelineProps) {
  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(workStartHour, workStartMinute, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(workEndHour, workEndMinute, 0, 0);

  const totalMs = dayEnd.getTime() - dayStart.getTime();
  if (totalMs <= 0) return null;

  // Generate hour markers
  const hourMarkers: { label: string; pct: number }[] = [];
  for (let h = workStartHour; h <= workEndHour; h++) {
    const markerTime = new Date(today);
    markerTime.setHours(h, 0, 0, 0);
    const pct = ((markerTime.getTime() - dayStart.getTime()) / totalMs) * 100;
    if (pct >= 0 && pct <= 100) {
      hourMarkers.push({ label: `${String(h).padStart(2, "0")}`, pct });
    }
  }

  type Block = {
    type: "entry" | "gap";
    start: number;
    end: number;
    color: string;
    label: string;
    gap?: TimelineGap;
    entry?: TimelineEntry;
  };

  const blocks: Block[] = [];

  entries.forEach((e) => {
    const s = new Date(e.startedAt).getTime();
    const end = new Date(e.endedAt).getTime();
    const actType = getNormalizedActivityType({ description: e.description, client_id: e.clientId });
    const config = getActivityConfig(actType);
    const color = e.clientId ? getClientColor(e.clientName || "") : config.color;
    const label = e.clientName || config.label;

    blocks.push({
      type: "entry",
      start: Math.max(s, dayStart.getTime()),
      end: Math.min(end, dayEnd.getTime()),
      color,
      label,
    });
  });

  gaps.forEach((g) => {
    blocks.push({
      type: "gap",
      start: Math.max(g.startTime.getTime(), dayStart.getTime()),
      end: Math.min(g.endTime.getTime(), dayEnd.getTime()),
      color: "transparent",
      label: `${g.durationMin}m sin registrar`,
      gap: g,
    });
  });

  blocks.sort((a, b) => a.start - b.start);

  const isEmpty = blocks.length === 0;

  // Current time indicator position
  const now = Date.now();
  const showNowIndicator = now >= dayStart.getTime() && now <= dayEnd.getTime();
  const nowPct = showNowIndicator ? ((now - dayStart.getTime()) / totalMs) * 100 : 0;

  return (
    <div className="space-y-0">
      {/* Timeline bar — the instrument's core visual */}
      <div className="relative">
        <div className="flex h-8 rounded-lg overflow-hidden bg-background-tertiary gap-px border border-border/40">
          {isEmpty ? (
            // Empty shell — faint hour divisions hint at structure
            hourMarkers.slice(0, -1).map((m, i) => {
              const next = hourMarkers[i + 1];
              if (!next) return null;
              const width = next.pct - m.pct;
              return (
                <div
                  key={`slot-${i}`}
                  className="h-full bg-background-tertiary border-r border-border/20 last:border-r-0"
                  style={{ width: `${width}%` }}
                />
              );
            })
          ) : (
            blocks.map((block, i) => {
              const widthPct = ((block.end - block.start) / totalMs) * 100;
              if (widthPct <= 0) return null;

              if (block.type === "gap") {
                return (
                  <Tooltip key={`gap-${i}`}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onGapClick?.(block.gap!)}
                        className="h-full border border-dashed border-accent/30 rounded-sm bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer"
                        style={{ width: `${widthPct}%`, minWidth: "4px" }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {block.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Tooltip key={`entry-${i}`}>
                  <TooltipTrigger asChild>
                    <div
                      className="h-full rounded-sm transition-opacity hover:opacity-80"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: block.color,
                        minWidth: "3px",
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {block.label}
                  </TooltipContent>
                </Tooltip>
              );
            })
          )}
        </div>

        {/* Current time needle — prominent */}
        {showNowIndicator && (
          <div
            className="absolute top-0 h-full w-[3px] bg-accent z-10 rounded-full shadow-[0_0_6px_hsl(var(--accent)/0.5)]"
            style={{ left: `${nowPct}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-accent border-2 border-card" />
          </div>
        )}
      </div>

      {/* Hour labels below */}
      <div className="relative h-4 mt-0.5">
        {hourMarkers.filter((_, i) => i % 2 === 0 || i === hourMarkers.length - 1).map((m) => (
          <span
            key={m.label}
            className="absolute text-[9px] text-foreground-muted/60 tabular-nums font-medium -translate-x-1/2"
            style={{ left: `${m.pct}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}
