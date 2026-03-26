import { useState, useEffect, useCallback } from "react";
import { getClientColor, formatDuration, formatTime } from "@/lib/timer-utils";
import { getNormalizedActivityType, getActivityConfig } from "@/components/timer/ActivityConstants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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

interface ActiveSessionInfo {
  startedAt: string;
  description?: string | null;
  clientName?: string | null;
  clientId?: string | null;
}

interface InteractiveTimelineProps {
  entries: TimelineEntry[];
  gaps: TimelineGap[];
  activeSession?: ActiveSessionInfo | null;
  onGapClick?: (gap: TimelineGap) => void;
  onEntryClick?: (entry: TimelineEntry) => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  workStartHour?: number;
  workEndHour?: number;
}

type ZoomLevel = "full" | "work";

export function InteractiveTimeline({
  entries,
  gaps,
  activeSession,
  onGapClick,
  onEntryClick,
  selectedDate,
  onDateChange,
  workStartHour = 8,
  workEndHour = 20,
}: InteractiveTimelineProps) {
  const { t } = useLanguage();
  const [zoom, setZoom] = useState<ZoomLevel>("full");
  const [expandedEntry, setExpandedEntry] = useState<TimelineEntry | null>(null);
  const [, setTick] = useState(0);

  // Re-render for active session
  useEffect(() => {
    if (!activeSession) return;
    const iv = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, [activeSession]);

  const day = selectedDate || new Date();
  const isToday = new Date().toDateString() === day.toDateString();

  // Time range based on zoom
  const rangeStart = new Date(day);
  rangeStart.setHours(zoom === "work" ? workStartHour : 0, 0, 0, 0);
  const rangeEnd = new Date(day);
  rangeEnd.setHours(zoom === "work" ? workEndHour : 23, zoom === "work" ? 0 : 59, zoom === "work" ? 0 : 59, zoom === "work" ? 0 : 999);

  const totalMs = rangeEnd.getTime() - rangeStart.getTime();

  // Hour markers
  const startH = zoom === "work" ? workStartHour : 0;
  const endH = zoom === "work" ? workEndHour : 24;
  const step = zoom === "work" ? 1 : 3;
  const hourMarkers: { label: string; pct: number }[] = [];
  for (let h = startH; h <= endH; h += step) {
    const markerTime = new Date(day);
    markerTime.setHours(h === 24 ? 23 : h, h === 24 ? 59 : 0, 0, 0);
    const pct = ((markerTime.getTime() - rangeStart.getTime()) / totalMs) * 100;
    if (pct >= 0 && pct <= 100) {
      hourMarkers.push({ label: String(h === 24 ? 24 : h).padStart(2, "0"), pct });
    }
  }

  type Block = {
    type: "entry" | "gap" | "active";
    start: number;
    end: number;
    color: string;
    label: string;
    description?: string | null;
    clientName?: string | null;
    durationMin?: number;
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
      start: Math.max(s, rangeStart.getTime()),
      end: Math.min(end, rangeEnd.getTime()),
      color,
      label,
      description: e.description,
      clientName: e.clientName,
      durationMin: e.durationMin || undefined,
      entry: e,
    });
  });

  gaps.forEach((g) => {
    blocks.push({
      type: "gap",
      start: Math.max(g.startTime.getTime(), rangeStart.getTime()),
      end: Math.min(g.endTime.getTime(), rangeEnd.getTime()),
      color: "transparent",
      label: `${g.durationMin} min sin registrar`,
      durationMin: g.durationMin,
      gap: g,
    });
  });

  const now = Date.now();
  if (activeSession && isToday) {
    const s = new Date(activeSession.startedAt).getTime();
    const actType = getNormalizedActivityType({ description: activeSession.description, client_id: activeSession.clientId });
    const config = getActivityConfig(actType);
    const color = activeSession.clientId ? getClientColor(activeSession.clientName || "") : config.color;
    blocks.push({
      type: "active",
      start: Math.max(s, rangeStart.getTime()),
      end: Math.min(now, rangeEnd.getTime()),
      color,
      label: activeSession.description || "En progreso",
      clientName: activeSession.clientName,
    });
  }

  blocks.sort((a, b) => a.start - b.start);

  const showNow = isToday && now >= rangeStart.getTime() && now <= rangeEnd.getTime();
  const nowPct = showNow ? ((now - rangeStart.getTime()) / totalMs) * 100 : 0;

  const navigateDay = (delta: number) => {
    const newDate = new Date(day);
    newDate.setDate(newDate.getDate() + delta);
    if (newDate <= new Date()) {
      onDateChange?.(newDate);
    }
  };

  const handleEntryClick = (entry: TimelineEntry) => {
    if (expandedEntry?.startedAt === entry.startedAt && expandedEntry?.endedAt === entry.endedAt) {
      setExpandedEntry(null);
    } else {
      setExpandedEntry(entry);
      onEntryClick?.(entry);
    }
  };

  return (
    <div className="space-y-0">
      {/* Navigation + Zoom controls */}
      {onDateChange && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDay(-1)}
              className="h-6 w-6 rounded-md hover:bg-background-secondary flex items-center justify-center text-foreground-muted transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-medium text-foreground-muted tabular-nums min-w-[80px] text-center">
              {isToday ? (t("briefing.today" as any) || "Hoy") : day.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <button
              onClick={() => navigateDay(1)}
              disabled={isToday}
              className="h-6 w-6 rounded-md hover:bg-background-secondary flex items-center justify-center text-foreground-muted transition-colors disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-0.5 bg-background-tertiary rounded-md p-0.5">
            <button
              onClick={() => setZoom("full")}
              className={`h-5 px-1.5 rounded text-[9px] font-medium transition-colors ${zoom === "full" ? "bg-foreground text-background" : "text-foreground-secondary"}`}
              title="24h"
            >
              24h
            </button>
            <button
              onClick={() => setZoom("work")}
              className={`h-5 px-1.5 rounded text-[9px] font-medium transition-colors ${zoom === "work" ? "bg-foreground text-background" : "text-foreground-secondary"}`}
              title="Horario laboral"
            >
              {workStartHour}-{workEndHour}h
            </button>
          </div>
        </div>
      )}

      {/* Timeline bar - taller */}
      <div className="relative">
        <div className="relative h-16 md:h-20 rounded-xl overflow-hidden bg-background-tertiary border border-border/40">
          {blocks.length === 0 ? (
            <div className="flex h-full">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`slot-${i}`} className="h-full flex-1 bg-background-tertiary border-r border-border/20 last:border-r-0" />
              ))}
            </div>
          ) : (
            blocks.map((block, i) => {
              const widthPct = ((block.end - block.start) / totalMs) * 100;
              if (widthPct <= 0) return null;
              const leftPct = ((block.start - rangeStart.getTime()) / totalMs) * 100;
              const blockMinutes = Math.round((block.end - block.start) / 60000);
              const showLabel = blockMinutes >= 30 && widthPct > 6;

              if (block.type === "gap") {
                return (
                  <Tooltip key={`gap-${i}`}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onGapClick?.(block.gap!)}
                        className="absolute h-full rounded-sm hover:opacity-80 transition-opacity cursor-pointer overflow-hidden"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          minWidth: "4px",
                          background: "repeating-linear-gradient(135deg, transparent, transparent 3px, hsl(var(--accent) / 0.08) 3px, hsl(var(--accent) / 0.08) 6px)",
                          border: "1px dashed hsl(var(--accent) / 0.3)",
                        }}
                      >
                        {showLabel && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] text-accent/60 font-medium">
                            {formatDuration(blockMinutes)}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {block.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              if (block.type === "active") {
                return (
                  <Tooltip key={`active-${i}`}>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute h-full rounded-sm animate-pulse flex items-center px-1.5 overflow-hidden"
                        style={{
                          left: `${leftPct}%`,
                          width: `${Math.max(widthPct, 0.3)}%`,
                          backgroundColor: block.color,
                          opacity: 0.7,
                          minWidth: "4px",
                        }}
                      >
                        {showLabel && (
                          <span className="text-[9px] text-white/90 font-medium truncate drop-shadow-sm">
                            {block.label}
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                      <div className="space-y-0.5">
                        <p className="font-semibold">🔴 {block.label}</p>
                        {block.clientName && <p className="text-foreground-secondary">{block.clientName}</p>}
                        <p className="text-foreground-muted tabular-nums">
                          {formatTime(new Date(block.start))} - en curso
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              // Entry block
              const isExpanded = expandedEntry?.startedAt === block.entry?.startedAt;
              return (
                <Tooltip key={`entry-${i}`}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => block.entry && handleEntryClick(block.entry)}
                      className={`absolute h-full rounded-sm transition-all cursor-pointer overflow-hidden flex items-center px-1.5 ${isExpanded ? "ring-2 ring-accent ring-offset-1 ring-offset-card" : "hover:brightness-110"}`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: block.color,
                        minWidth: "3px",
                      }}
                    >
                      {showLabel && (
                        <span className="text-[9px] text-white/90 font-medium truncate drop-shadow-sm">
                          {block.label}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                    <div className="space-y-0.5">
                      {block.description && <p className="font-semibold">{block.description}</p>}
                      {block.clientName && <p className="text-foreground-secondary">{block.clientName}</p>}
                      <p className="text-foreground-muted tabular-nums">
                        {formatTime(new Date(block.start))} - {formatTime(new Date(block.end))} · {formatDuration(blockMinutes)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })
          )}
        </div>

        {/* Now needle */}
        {showNow && (
          <div
            className="absolute top-0 h-full w-[3px] bg-accent z-10 rounded-full shadow-[0_0_6px_hsl(var(--accent)/0.5)]"
            style={{ left: `${nowPct}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-accent border-2 border-card" />
          </div>
        )}
      </div>

      {/* Hour labels */}
      <div className="relative h-4 mt-0.5">
        {hourMarkers.map((m) => (
          <span
            key={m.label}
            className="absolute text-[9px] text-foreground-muted/60 tabular-nums font-medium -translate-x-1/2"
            style={{ left: `${m.pct}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Expanded entry detail */}
      {expandedEntry && (
        <div className="mt-2 rounded-lg border border-border bg-card p-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{expandedEntry.description || "Sin descripcion"}</p>
            <button
              onClick={() => setExpandedEntry(null)}
              className="text-[10px] text-foreground-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>
          {expandedEntry.clientName && (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getClientColor(expandedEntry.clientName) }} />
              <span className="text-xs text-foreground-secondary">{expandedEntry.clientName}</span>
            </div>
          )}
          <p className="text-[11px] text-foreground-muted tabular-nums">
            {formatTime(new Date(expandedEntry.startedAt))} - {formatTime(new Date(expandedEntry.endedAt))} · {formatDuration(expandedEntry.durationMin || 0)}
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onEntryClick?.(expandedEntry)}
              className="text-[11px] font-medium text-accent hover:underline"
            >
              {t("common.edit" as any) || "Editar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
