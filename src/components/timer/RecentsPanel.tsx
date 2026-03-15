import { Clock } from "lucide-react";
import { getClientColor } from "@/lib/timer-utils";
import {
  getNormalizedActivityType,
  getActivityConfig,
  UI_COPY,
} from "./ActivityConstants";

export interface RecentItem {
  id: string;
  clientName?: string | null;
  taskTitle?: string | null;
  description?: string | null;
  clientId?: string | null;
}

interface RecentsPanelProps {
  items: RecentItem[];
  onSelect: (item: RecentItem) => void;
}

export function RecentsPanel({ items, onSelect }: RecentsPanelProps) {
  if (items.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-small text-foreground-muted">{UI_COPY.recentsEmpty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-micro text-foreground-secondary px-1 mb-2">
        {UI_COPY.recentsTitle}
      </p>
      {items.map((item) => {
        const type = getNormalizedActivityType({
          description: item.description,
          client_id: item.clientId,
        });
        const config = getActivityConfig(type);
        const Icon = config.icon;

        return (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 hover:bg-background-secondary transition-colors text-left"
          >
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: item.clientId
                  ? getClientColor(item.clientName || "")
                  : config.color,
                opacity: item.clientId ? 0.15 : 0.15,
              }}
            >
              {item.clientId ? (
                <span
                  className="text-[10px] font-bold"
                  style={{ color: getClientColor(item.clientName || "") }}
                >
                  {(item.clientName || "?").slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {item.taskTitle || item.description || config.label}
              </p>
              {item.clientName && (
                <p className="text-xs text-foreground-secondary truncate">
                  {item.clientName}
                </p>
              )}
            </div>
            <Clock className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
