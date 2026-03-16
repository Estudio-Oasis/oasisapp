import { Zap, ChevronRight } from "lucide-react";
import { UI_COPY } from "./ActivityConstants";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDuration } from "@/lib/timer-utils";

interface QuickLogInputProps {
  onFocus?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  todaySummary?: string;
  totalMinutes?: number;
}

/**
 * Command center launcher — the irresistible primary action of Bitácora.
 * Feels like a live command bar, not a passive input.
 */
export function QuickLogInput({ onFocus, onClick, disabled, todaySummary, totalMinutes = 0 }: QuickLogInputProps) {
  const isMobile = useIsMobile();

  return (
    <button
      onClick={onClick}
      onFocus={onFocus}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-xl bg-foreground px-4 py-3.5 transition-all hover:opacity-90 active:scale-[0.985] group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {/* Pulsing accent beacon */}
      <div className="relative h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <Zap className="h-[18px] w-[18px] text-accent-foreground" />
        <span className="absolute inset-0 rounded-lg bg-accent/30 animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      {/* Text stack */}
      <div className="flex-1 min-w-0">
        <span className="text-[14px] font-semibold text-primary-foreground/90 group-hover:text-primary-foreground transition-colors block leading-tight">
          {UI_COPY.placeholder}
        </span>
        {todaySummary && (
          <span className="text-[11px] text-primary-foreground/40 mt-0.5 block leading-tight">
            {todaySummary}
          </span>
        )}
      </div>

      {/* Right action hint */}
      {!isMobile ? (
        <div className="h-6 px-1.5 rounded bg-primary-foreground/10 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-primary-foreground/40 tabular-nums">⌘K</span>
        </div>
      ) : (
        <ChevronRight className="h-4 w-4 text-primary-foreground/30 shrink-0" />
      )}
    </button>
  );
}
