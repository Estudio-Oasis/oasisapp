import { Zap, ChevronRight, Play } from "lucide-react";
import { UI_COPY } from "./ActivityConstants";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDuration } from "@/lib/timer-utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuickLogInputProps {
  onFocus?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  todaySummary?: string;
  totalMinutes?: number;
  suggestedActivity?: { description: string; clientName?: string | null } | null;
  onResume?: () => void;
}

export function QuickLogInput({ onFocus, onClick, disabled, todaySummary, totalMinutes = 0, suggestedActivity, onResume }: QuickLogInputProps) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      {/* Main launcher */}
      <button
        onClick={onClick}
        onFocus={onFocus}
        disabled={disabled}
        className="flex w-full items-center gap-3 rounded-2xl bg-foreground px-5 py-4 transition-all hover:opacity-90 active:scale-[0.98] group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 shadow-[0_2px_16px_-3px_hsl(var(--foreground)/0.3)]"
      >
        {/* Pulsing beacon */}
        <div className="relative h-11 w-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
          <Zap className="h-5 w-5 text-accent-foreground" />
          <span className="absolute inset-0 rounded-xl bg-accent/30 animate-ping" style={{ animationDuration: '3s' }} />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[15px] font-bold text-primary-foreground block leading-tight">
            {UI_COPY.placeholder}
          </span>
          <span className="text-[12px] text-primary-foreground/40 mt-0.5 block leading-tight">
            {todaySummary || t("bitacora.dayStartsHere")}
          </span>
        </div>

        {!isMobile ? (
          <div className="h-7 px-2.5 rounded-md bg-primary-foreground/10 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary-foreground/40 tabular-nums">⌘K</span>
          </div>
        ) : (
          <div className="h-9 w-9 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <ChevronRight className="h-4 w-4 text-accent" />
          </div>
        )}
      </button>

      {/* Suggested activity */}
      {suggestedActivity && onResume && (
        <button
          onClick={onResume}
          className="w-full flex items-center gap-3 rounded-xl border border-border/60 dark:border-border/40 bg-card px-4 py-3 text-left hover:bg-background-secondary transition-colors group"
        >
          <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
            <Play className="h-3 w-3 text-accent ml-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              {t("bitacora.suggested")}
            </span>
            <p className="text-[13px] font-medium text-foreground truncate">
              {t("bitacora.continue")} "{suggestedActivity.description}"
              {suggestedActivity.clientName && (
                <span className="text-foreground-secondary"> ({suggestedActivity.clientName})</span>
              )}
            </p>
          </div>
          <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Play className="h-3 w-3 text-accent-foreground ml-0.5" />
          </div>
        </button>
      )}
    </div>
  );
}
