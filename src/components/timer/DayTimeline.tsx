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
}

export function DayTimeline({
  entries,
  gaps,
  workStartHour = 9,
  workStartMinute = 0,
  workEndHour = 18,
  workEndMinute = 0,
  onGapClick,
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

  return (
    <div className="space-y-1">
      {/* Hour tick marks above */}
      <div className="relative h-4">
        {hourMarkers.map((m, i) => (
          <span
            key={m.label}
            className="absolute text-[9px] text-foreground-muted tabular-nums -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${m.pct}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Timeline bar */}
      <div className="relative">
        <div className="flex h-8 rounded-lg overflow-hidden bg-background-tertiary gap-[1px]">
          {isEmpty ? (
            // Empty shell — show faint hour divisions to hint at structure
            hourMarkers.slice(0, -1).map((m, i) => {
              const next = hourMarkers[i + 1];
              if (!next) return null;
              const width = next.pct - m.pct;
              return (
                <div
                  key={`slot-${i}`}
                  className="h-full bg-background-tertiary border-r border-border/30 last:border-r-0"
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
                        className="h-full border border-dashed border-accent/40 rounded-sm bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer"
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

        {/* Current time indicator */}
        {(() => {
          const now = Date.now();
          if (now >= dayStart.getTime() && now <= dayEnd.getTime()) {
            const pct = ((now - dayStart.getTime()) / totalMs) * 100;
            return (
              <div
                className="absolute top-0 h-full w-0.5 bg-accent z-10"
                style={{ left: `${pct}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-accent" />
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}
