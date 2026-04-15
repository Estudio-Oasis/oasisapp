import { useState } from "react";
import { formatElapsed } from "@/lib/timer-utils";
import {
  getNormalizedActivityType,
  getActivityConfig,
  UI_COPY,
} from "./ActivityConstants";
import { InlineEditableText } from "@/components/ui/inline-editable-text";

interface ActiveSessionCardProps {
  variant: "compact" | "mobile" | "expanded";
  clientName?: string | null;
  taskTitle?: string | null;
  description?: string | null;
  clientId?: string | null;
  elapsedSeconds: number;
  rateTarget?: number | null;
  incomeCurrency?: string;
  onDescriptionChange?: (newDesc: string) => void;
  children?: React.ReactNode;
}

export function ActiveSessionCard({
  variant,
  clientName,
  taskTitle,
  description,
  clientId,
  elapsedSeconds,
  rateTarget,
  incomeCurrency = "MXN",
  onDescriptionChange,
  children,
}: ActiveSessionCardProps) {
  const activityType = getNormalizedActivityType({ description, client_id: clientId });
  const config = getActivityConfig(activityType);
  const Icon = config.icon;

  const displayName = clientName || description || UI_COPY.sessionNoClient;
  const displayTask = taskTitle;

  const GENERIC_NAMES = ['Actividad libre', 'Pendientes del día', 'Reunión', 'Descanso', 'Comida', 'Break', 'Tarea libre'];
  const hasCustomDescription = description && description.trim() !== '' && !GENERIC_NAMES.includes(description);

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 px-3 py-2.5 space-y-2">
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
        {displayTask && (
          <p className="text-[11px] text-foreground-secondary truncate" style={{ lineHeight: "1.4" }}>
            {displayTask}
          </p>
        )}
        {children}
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ backgroundColor: config.color }} />
          <span className="text-micro text-accent uppercase tracking-wider">{UI_COPY.sessionActive}</span>
        </div>
        {onDescriptionChange ? (
          <InlineEditableText
            value={description || ""}
            onSave={onDescriptionChange}
            placeholder="Añadir descripción..."
            className="text-h3 text-foreground justify-center"
            inputClassName="text-h3 text-center"
          />
        ) : (
          <p className="text-h3 text-foreground">{displayName}</p>
        )}
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
        <p className="text-display text-accent tabular-nums pt-2">{formatElapsed(elapsedSeconds)}</p>
        {rateTarget && (
          <p className="text-xs text-foreground-muted">
            💰 ~${Math.round((elapsedSeconds / 3600) * rateTarget).toLocaleString()} {incomeCurrency}
          </p>
        )}
        {children}
      </div>
    );
  }

  // expanded — premium widget feel
  return (
    <div className="rounded-2xl border border-accent/30 overflow-hidden flex flex-col max-h-[60vh]"
      style={{ boxShadow: "0 0 24px hsl(var(--accent) / 0.06)" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 space-y-3 shrink-0 bg-gradient-to-b from-accent/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
            <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">{UI_COPY.sessionActive}</span>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-black text-accent tabular-nums tracking-tight leading-none">
              {formatElapsed(elapsedSeconds)}
            </p>
            {rateTarget && (
              <p className="text-[11px] text-foreground-muted mt-0.5">
                💰 ~${Math.round((elapsedSeconds / 3600) * rateTarget).toLocaleString()} {incomeCurrency}
              </p>
            )}
          </div>
        </div>

        {onDescriptionChange ? (
          <InlineEditableText
            value={description || ""}
            onSave={onDescriptionChange}
            placeholder="Añadir descripción..."
            className="text-[16px] font-semibold text-foreground"
            inputClassName="text-[16px] font-semibold"
          />
        ) : (
          <p className="text-[16px] font-semibold text-foreground truncate">{displayName}</p>
        )}

        <div className="flex items-center gap-1.5 text-foreground-secondary flex-wrap">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="text-sm">{config.label}</span>
          {taskTitle && (
            <>
              <span className="text-foreground-muted">·</span>
              <span className="text-sm truncate max-w-[180px]">{taskTitle}</span>
            </>
          )}
        </div>

        {/* Prompt for naming unnamed activities */}
        {onDescriptionChange && !hasCustomDescription && (
          <NamePromptInline onSave={onDescriptionChange} />
        )}
      </div>

      {/* Scrollable content */}
      {children && (
        <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-0">
          {children}
        </div>
      )}
    </div>
  );
}

function NamePromptInline({ onSave }: { onSave: (val: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-2 rounded-lg bg-accent/5 border border-accent/20 px-3 py-2">
      <span className="text-xs text-foreground-secondary shrink-0">¿Cómo llamas a esto?</span>
      <input
        className="flex-1 text-xs bg-transparent border-none outline-none text-foreground placeholder-foreground-muted"
        placeholder="ej: Diseño campaña Q2..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) { onSave(value.trim()); setValue(""); } }}
        onBlur={() => { if (value.trim()) { onSave(value.trim()); setValue(""); } }}
      />
    </div>
  );
}
