import { Clock, Inbox, ListChecks, Users } from "lucide-react";
import { UI_COPY } from "./ActivityConstants";

type EmptyContext = "no_session" | "no_entries" | "no_tasks" | "no_team";

interface EmptyStateProps {
  context: EmptyContext;
}

const CONFIG: Record<EmptyContext, { icon: typeof Clock; message: string; hint: string }> = {
  no_session: { icon: Clock, message: UI_COPY.emptyNoSession, hint: "Usa el launcher arriba para empezar" },
  no_entries: { icon: Inbox, message: UI_COPY.emptyNoEntries, hint: "Tu timeline se llenará conforme registres actividad" },
  no_tasks: { icon: ListChecks, message: UI_COPY.emptyNoTasks, hint: "" },
  no_team: { icon: Users, message: UI_COPY.emptyNoTeam, hint: "" },
};

export function EmptyState({ context }: EmptyStateProps) {
  const { icon: Icon, message, hint } = CONFIG[context];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-background-secondary/30 px-4 py-3">
      <div className="h-8 w-8 rounded-lg bg-background-tertiary flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-foreground-muted" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-foreground-secondary leading-snug">{message}</p>
        {hint && <p className="text-[11px] text-foreground-muted mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}
