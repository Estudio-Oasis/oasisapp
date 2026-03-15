import { Check, Pencil } from "lucide-react";
import { UI_COPY } from "./ActivityConstants";

interface ContextBadgeProps {
  clientName?: string | null;
  projectName?: string | null;
  taskTitle?: string | null;
  onEdit?: () => void;
}

export function ContextBadge({
  clientName,
  projectName,
  taskTitle,
  onEdit,
}: ContextBadgeProps) {
  if (!clientName && !projectName && !taskTitle) return null;

  return (
    <div className="rounded-lg border border-border bg-background-secondary px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-success" />
          <span className="text-[11px] font-medium text-foreground-secondary">
            {UI_COPY.contextDetected}
          </span>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-[11px] text-foreground-muted hover:text-foreground transition-colors"
          >
            <Pencil className="h-3 w-3" />
            {UI_COPY.contextEdit}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-sm text-foreground flex-wrap">
        {clientName && <span className="font-medium">{clientName}</span>}
        {projectName && (
          <>
            <span className="text-foreground-muted">·</span>
            <span>{projectName}</span>
          </>
        )}
        {taskTitle && (
          <>
            <span className="text-foreground-muted">·</span>
            <span className="truncate">{taskTitle}</span>
          </>
        )}
      </div>
    </div>
  );
}
