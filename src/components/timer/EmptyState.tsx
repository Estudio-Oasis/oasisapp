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
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="h-12 w-12 rounded-full bg-background-secondary flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-foreground-muted" />
      </div>
      <p className="text-sm text-foreground-secondary max-w-[260px] leading-relaxed">
        {message}
      </p>
    </div>
  );
}
