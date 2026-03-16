import { Zap, ChevronRight } from "lucide-react";
import { UI_COPY } from "./ActivityConstants";

interface QuickLogInputProps {
  onFocus?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  /** Show total tracked today */
  todaySummary?: string;
}

/**
 * Central launcher / command bar for Bitácora.
 * Designed to feel like the nerve center of the product.
 */
export function QuickLogInput({ onFocus, onClick, disabled, todaySummary }: QuickLogInputProps) {
  return (
    <button
      onClick={onClick}
      onFocus={onFocus}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card px-5 py-4 transition-all hover:border-accent/60 hover:shadow-[0_0_0_4px_hsl(var(--accent)/0.08)] group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
        <Zap className="h-5 w-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[15px] font-medium text-foreground-muted group-hover:text-foreground transition-colors block">
          {UI_COPY.placeholder}
        </span>
        {todaySummary && (
          <span className="text-[12px] text-foreground-muted mt-0.5 block">
            {todaySummary}
          </span>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-foreground-muted group-hover:text-accent shrink-0 transition-colors" />
    </button>
  );
}
