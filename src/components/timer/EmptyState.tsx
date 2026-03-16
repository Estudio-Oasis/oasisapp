import { Clock, Inbox, ListChecks, Users } from "lucide-react";

type EmptyContext = "no_session" | "no_entries" | "no_tasks" | "no_team";

interface EmptyStateProps {
  context: EmptyContext;
}

const CONFIG: Record<EmptyContext, { icon: typeof Clock; hint: string }> = {
  no_session: { icon: Clock, hint: "Usa el launcher para comenzar" },
  no_entries: { icon: Inbox, hint: "Los registros de hoy aparecerán aquí" },
  no_tasks: { icon: ListChecks, hint: "" },
  no_team: { icon: Users, hint: "" },
};

export function EmptyState({ context }: EmptyStateProps) {
  const { hint } = CONFIG[context];

  return (
    <div className="flex items-center justify-center py-8">
      {hint && (
        <span className="text-[11px] text-foreground-muted/60">{hint}</span>
      )}
    </div>
  );
}
