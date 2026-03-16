import { Clock, Inbox, ListChecks, Users } from "lucide-react";
import { UI_COPY } from "./ActivityConstants";

type EmptyContext = "no_session" | "no_entries" | "no_tasks" | "no_team";

interface EmptyStateProps {
  context: EmptyContext;
}

const CONFIG: Record<EmptyContext, { icon: typeof Clock; hint: string }> = {
  no_session: { icon: Clock, hint: "Usa el launcher para comenzar" },
  no_entries: { icon: Inbox, hint: "Registra actividad para ver tu día aquí" },
  no_tasks: { icon: ListChecks, hint: "" },
  no_team: { icon: Users, hint: "" },
};

export function EmptyState({ context }: EmptyStateProps) {
  const { icon: Icon, hint } = CONFIG[context];

  return (
    <div className="flex items-center justify-center gap-2 py-6 text-foreground-muted">
      <Icon className="h-4 w-4 opacity-40" />
      {hint && <span className="text-xs">{hint}</span>}
    </div>
  );
}
