import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface WidgetCardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
  accent?: "default" | "amber" | "green" | "red" | "blue";
  glow?: boolean;
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const accentBorder: Record<string, string> = {
  default: "border-border/60 dark:border-border/40",
  amber: "border-accent/20",
  green: "border-success/20",
  red: "border-destructive/20",
  blue: "border-blue-500/20",
};

const accentGlow: Record<string, string> = {
  default: "",
  amber: "shadow-[0_0_20px_hsl(var(--accent)/0.05)]",
  green: "shadow-[0_0_20px_hsl(var(--success)/0.05)]",
  red: "shadow-[0_0_20px_hsl(var(--destructive)/0.05)]",
  blue: "shadow-[0_0_20px_220_90%_56%/0.05]",
};

const accentIcon: Record<string, string> = {
  default: "text-foreground-muted",
  amber: "text-accent",
  green: "text-success",
  red: "text-destructive",
  blue: "text-blue-500",
};

export function WidgetCard({
  title,
  subtitle,
  icon: Icon,
  action,
  accent = "default",
  glow = false,
  className,
  headerClassName,
  children,
  onClick,
}: WidgetCardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "rounded-2xl border bg-card overflow-hidden transition-all duration-200",
        "hover:border-border dark:hover:border-border/60",
        accentBorder[accent],
        glow && accentGlow[accent],
        onClick && "cursor-pointer text-left w-full",
        className
      )}
    >
      {(title || action) && (
        <div className={cn("flex items-center justify-between px-5 pt-4 pb-0", headerClassName)}>
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", accentIcon[accent])} />}
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                {title}
              </span>
              {subtitle && (
                <span className="text-[10px] text-foreground-muted/60 ml-2">{subtitle}</span>
              )}
            </div>
          </div>
          {action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className="text-[11px] font-medium text-accent hover:text-accent/80 transition-colors shrink-0"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
      <div className="px-5 pb-4 pt-3">{children}</div>
    </Wrapper>
  );
}

/** Mini stat widget for dashboards */
interface StatWidgetProps {
  label: string;
  value: string | number;
  accent?: "default" | "amber" | "green" | "red";
  icon?: LucideIcon;
  onClick?: () => void;
  active?: boolean;
}

export function StatWidget({ label, value, accent = "default", icon: Icon, onClick, active }: StatWidgetProps) {
  const colorMap: Record<string, string> = {
    default: "text-foreground",
    amber: "text-accent",
    green: "text-success",
    red: "text-destructive",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl border bg-card p-4 text-left transition-all duration-200 w-full",
        "hover:border-border dark:hover:border-border/60",
        active ? accentBorder[accent] : "border-border/60 dark:border-border/40",
        active && accentGlow[accent],
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className={cn("h-4 w-4", colorMap[accent])} />}
        <p className={cn("text-2xl font-bold tabular-nums", colorMap[accent])}>{value}</p>
      </div>
      <p className="text-[11px] text-foreground-secondary mt-1">{label}</p>
    </button>
  );
}
