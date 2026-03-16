import { Zap } from "lucide-react";
import { UI_COPY } from "./ActivityConstants";

interface QuickLogInputProps {
  onFocus?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  todaySummary?: string;
}

/**
 * Command center / launcher — the nerve center of Bitácora.
 * Designed to feel like an operational instrument, not a form input.
 */
export function QuickLogInput({ onFocus, onClick, disabled, todaySummary }: QuickLogInputProps) {
  return (
    <button
      onClick={onClick}
      onFocus={onFocus}
      disabled={disabled}
      className="flex w-full items-center gap-4 rounded-xl bg-foreground px-5 py-4 transition-all hover:opacity-90 active:scale-[0.99] group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <Zap className="h-5 w-5 text-accent-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[15px] font-medium text-primary-foreground/80 group-hover:text-primary-foreground transition-colors block">
          {UI_COPY.placeholder}
        </span>
        {todaySummary && (
          <span className="text-[12px] text-primary-foreground/50 mt-0.5 block">
            {todaySummary}
          </span>
        )}
      </div>
      <div className="h-8 w-8 rounded-md bg-primary-foreground/10 flex items-center justify-center shrink-0">
        <span className="text-[11px] font-bold text-primary-foreground/60">⌘K</span>
      </div>
    </button>
  );
}
