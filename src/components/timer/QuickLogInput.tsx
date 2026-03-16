import { Zap } from "lucide-react";
import { UI_COPY } from "./ActivityConstants";
import { useIsMobile } from "@/hooks/use-mobile";

interface QuickLogInputProps {
  onFocus?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  todaySummary?: string;
}

/**
 * Command center launcher — the nerve center of Bitácora.
 * Feels like a live operational instrument, not a form input.
 */
export function QuickLogInput({ onFocus, onClick, disabled, todaySummary }: QuickLogInputProps) {
  const isMobile = useIsMobile();

  return (
    <button
      onClick={onClick}
      onFocus={onFocus}
      disabled={disabled}
      className="flex w-full items-center gap-4 rounded-xl bg-foreground px-5 py-4 transition-all hover:opacity-90 active:scale-[0.99] group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {/* Pulsing accent icon */}
      <div className="relative h-11 w-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
        <Zap className="h-5 w-5 text-accent-foreground" />
        <span className="absolute inset-0 rounded-xl bg-accent/40 animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-[15px] font-semibold text-primary-foreground/90 group-hover:text-primary-foreground transition-colors block leading-tight">
          {UI_COPY.placeholder}
        </span>
        {todaySummary && (
          <span className="text-[12px] text-primary-foreground/45 mt-1 block leading-tight">
            {todaySummary}
          </span>
        )}
      </div>

      {/* Keyboard shortcut — desktop only */}
      {!isMobile && (
        <div className="h-7 px-2 rounded-md bg-primary-foreground/10 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-primary-foreground/50">⌘K</span>
        </div>
      )}
    </button>
  );
}
