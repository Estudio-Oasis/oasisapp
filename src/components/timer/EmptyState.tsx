import { Clock, Inbox, ListChecks, Users } from "lucide-react";
import { UI_COPY } from "./ActivityConstants";

type EmptyContext = "no_session" | "no_entries" | "no_tasks" | "no_team";

interface EmptyStateProps {
  context: EmptyContext;
}

const CONFIG: Record<EmptyContext, { icon: typeof Clock; message: string }> = {
  no_session: { icon: Clock, message: UI_COPY.emptyNoSession },
  no_entries: { icon: Inbox, message: UI_COPY.emptyNoEntries },
  no_tasks: { icon: ListChecks, message: UI_COPY.emptyNoTasks },
  no_team: { icon: Users, message: UI_COPY.emptyNoTeam },
};

export function EmptyState({ context }: EmptyStateProps) {
  const { icon: Icon, message } = CONFIG[context];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-background-secondary/50 px-4 py-4">
      <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-foreground-muted" />
      </div>
      <p className="text-sm text-foreground-secondary leading-snug">
        {message}
      </p>
    </div>
  );
}
