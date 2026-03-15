import { Zap } from "lucide-react";
import { UI_COPY } from "./ActivityConstants";

interface QuickLogInputProps {
  onFocus?: () => void;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Simplified launcher-style input for the playground.
 * In the real system, this will open the full QuickStart flow.
 */
export function QuickLogInput({ onFocus, onClick, disabled }: QuickLogInputProps) {
  return (
    <button
      onClick={onClick}
      onFocus={onFocus}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-foreground-muted group text-left"
    >
      <div className="h-8 w-8 rounded-full bg-background-secondary flex items-center justify-center shrink-0 group-hover:bg-background-tertiary transition-colors">
        <Zap className="h-4 w-4 text-foreground-muted group-hover:text-foreground transition-colors" />
      </div>
      <span className="text-sm text-foreground-muted group-hover:text-foreground-secondary transition-colors">
        {UI_COPY.placeholder}
      </span>
    </button>
  );
}
