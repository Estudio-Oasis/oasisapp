import { formatElapsed, formatElapsedShort } from "@/lib/timer-utils";
import {
  getNormalizedActivityType,
  getActivityConfig,
  UI_COPY,
} from "./ActivityConstants";

interface ActiveSessionCardProps {
  variant: "compact" | "mobile" | "expanded";
  clientName?: string | null;
  taskTitle?: string | null;
  description?: string | null;
  clientId?: string | null;
  elapsedSeconds: number;
  children?: React.ReactNode; // slot for TimerControls
}

export function ActiveSessionCard({
  variant,
  clientName,
  taskTitle,
  description,
  clientId,
  elapsedSeconds,
  children,
}: ActiveSessionCardProps) {
  const activityType = getNormalizedActivityType({ description, client_id: clientId });
  const config = getActivityConfig(activityType);
  const Icon = config.icon;

  const displayName = clientName || description || UI_COPY.sessionNoClient;
  const displayTask = taskTitle || UI_COPY.sessionNoTask;

  if (variant === "compact") {
    return (
      <div className="rounded-lg border border-accent bg-accent-light px-3 py-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-2 w-2 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-xs font-medium text-foreground truncate max-w-[110px]">
              {displayName}
            </span>
          </div>
          <span className="text-small font-bold text-accent tabular-nums">
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
        <p
          className="text-[11px] text-foreground-secondary truncate"
          style={{ lineHeight: "1.4" }}
        >
          {displayTask}
        </p>
        {children}
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-micro text-accent uppercase tracking-wider">
            {UI_COPY.sessionActive}
          </span>
        </div>
        <p className="text-h3 text-foreground">{displayName}</p>
        <div className="flex items-center justify-center gap-1.5 text-foreground-secondary">
          <Icon className="h-3.5 w-3.5" />
          <span className="text-small">{config.label}</span>
          {taskTitle && (
            <>
              <span className="text-foreground-muted">·</span>
              <span className="text-small truncate max-w-[140px]">{taskTitle}</span>
            </>
          )}
        </div>
        <p className="text-display text-accent tabular-nums pt-2">
          {formatElapsed(elapsedSeconds)}
        </p>
        {children}
      </div>
    );
  }

  // expanded
  return (
    <div className="rounded-xl border border-accent bg-accent-light px-5 py-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full animate-pulse shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-micro text-accent">{UI_COPY.sessionActive}</span>
          </div>
          <p className="text-h3 text-foreground mt-1.5 truncate">{displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-foreground-secondary">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="text-sm">{config.label}</span>
            {taskTitle && (
              <>
                <span className="text-foreground-muted">·</span>
                <span className="text-sm truncate">{taskTitle}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-display text-accent tabular-nums">
            {formatElapsed(elapsedSeconds)}
          </p>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
