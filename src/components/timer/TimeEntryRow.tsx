import { formatTime, formatDuration, getClientColor } from "@/lib/timer-utils";
import {
  getNormalizedActivityType,
  getActivityConfig,
  TRUNCATION,
} from "./ActivityConstants";
import { ChevronRight } from "lucide-react";

interface TimeEntryRowProps {
  id: string;
  description?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  taskTitle?: string | null;
  startedAt: string;
  endedAt?: string | null;
  durationMin?: number | null;
  userId?: string;
  userName?: string | null;
  showUser?: boolean;
  onClick?: () => void;
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function TimeEntryRow({
  id,
  description,
  clientId,
  clientName,
  taskTitle,
  startedAt,
  endedAt,
  durationMin,
  userName,
  showUser = false,
  onClick,
}: TimeEntryRowProps) {
  const activityType = getNormalizedActivityType({ description, client_id: clientId });
  const config = getActivityConfig(activityType);
  const Icon = config.icon;
  const isNonProductive = !config.productive;

  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : null;
  const dur = Number(durationMin) || 0;

  const displayClient = clientName || "Sin cliente";
  const barColor = clientId ? getClientColor(displayClient) : config.color;

  return (
    <div
      className={`flex items-center gap-3 border-b border-border py-3.5 ${
        isNonProductive ? "opacity-60" : ""
      }`}
    >
      {/* Color bar or icon */}
      {isNonProductive ? (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-background-tertiary"
        >
          <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
        </div>
      ) : (
        <div
          className="w-[3px] h-8 rounded-sm shrink-0"
          style={{ backgroundColor: barColor }}
        />
      )}

      {/* User avatar */}
      {showUser && userName && (
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-primary-foreground shrink-0"
          style={{ backgroundColor: getClientColor(userName) }}
          title={userName}
        >
          {userName.slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isNonProductive ? (
          <>
            <p className="text-sm font-medium text-foreground-muted truncate italic">
              {config.label}
            </p>
            <p className="text-xs text-foreground-muted truncate">
              {description || config.label}
              {showUser && userName && <span> · {userName}</span>}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground truncate">
              {taskTitle ? (
                truncate(taskTitle, TRUNCATION.taskName)
              ) : (
                <span className="text-foreground-muted font-normal">Sin tarea</span>
              )}
            </p>
            <p className="text-xs text-foreground-secondary truncate">
              {truncate(displayClient, TRUNCATION.clientName)}
              {showUser && userName && (
                <span className="text-foreground-muted"> · {userName}</span>
              )}
              {description && config.key !== "trabajo" && (
                <span className="text-foreground-muted"> · {config.label}</span>
              )}
            </p>
          </>
        )}
      </div>

      {/* Time & duration */}
      <div className="text-right shrink-0">
        <p className="text-small text-foreground-secondary">
          {formatTime(start)}
          {end && ` – ${formatTime(end)}`}
        </p>
        <p className="text-small font-semibold text-foreground">
          {formatDuration(dur)}
        </p>
      </div>
    </div>
  );
}
