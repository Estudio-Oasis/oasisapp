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
    <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border/60 bg-muted/30 px-3 py-2 my-1">
      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">
          Hueco sin registrar · {formatDuration(durationMin)}
        </p>
        <p className="text-[11px] text-muted-foreground/70">
          {formatTime(startTime)} – {formatTime(endTime)}
        </p>
      </div>
      {onFill && (
        <button
          onClick={onFill}
          className="shrink-0 h-7 px-2.5 rounded-md border border-border/60 bg-background text-[11px] font-semibold text-foreground hover:bg-accent/10 transition-colors whitespace-nowrap"
        >
          Completar hueco
        </button>
      )}
    </div>
  );
}
