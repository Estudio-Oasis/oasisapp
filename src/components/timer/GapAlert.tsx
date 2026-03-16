import { Clock } from "lucide-react";
import { formatTime, formatDuration } from "@/lib/timer-utils";
import { UI_COPY } from "./ActivityConstants";

interface GapAlertProps {
  startTime: Date;
  endTime: Date;
  durationMin: number;
  onFill?: () => void;
}

export function GapAlert({ startTime, endTime, durationMin, onFill }: GapAlertProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background-secondary/50 px-4 py-3 my-1">
      <Clock className="h-4 w-4 text-foreground-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-small font-medium text-foreground-secondary">
          {UI_COPY.gapLabel} · {formatDuration(durationMin)}
        </p>
        <p className="text-xs text-foreground-muted">
          {formatTime(startTime)} – {formatTime(endTime)}
        </p>
      </div>
      {onFill && (
        <button
          onClick={onFill}
          className="shrink-0 h-8 px-3 rounded-md border border-border bg-background text-xs font-semibold text-foreground hover:bg-background-tertiary transition-colors whitespace-nowrap"
        >
          {UI_COPY.gapAction}
        </button>
      )}
    </div>
  );
}
