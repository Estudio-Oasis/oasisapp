import { useMemo } from "react";
import { getClientColor } from "@/lib/timer-utils";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
interface ClientInfo { id: string; name: string; }

interface Props {
  tasks: Task[];
  clientMap: Record<string, ClientInfo>;
  onSelectTask: (id: string) => void;
}

const STATUS_DOT: Record<string, string> = {
  backlog: "bg-foreground-muted",
  todo: "bg-foreground-secondary",
  in_progress: "bg-accent",
  review: "bg-foreground-secondary",
  done: "bg-success",
};

export function TaskGanttView({ tasks, clientMap, onSelectTask }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine timeline range: 2 weeks before today → 6 weeks after
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - 14);
  const rangeEnd = new Date(today);
  rangeEnd.setDate(rangeEnd.getDate() + 42);
  const totalDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000);

  // Generate week labels
  const weeks = useMemo(() => {
    const w: { label: string; offsetPct: number; widthPct: number }[] = [];
    let d = new Date(rangeStart);
    // Align to Monday
    const day = d.getDay();
    d.setDate(d.getDate() - ((day + 6) % 7));
    while (d < rangeEnd) {
      const weekStart = new Date(d);
      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const offset = Math.max(0, (weekStart.getTime() - rangeStart.getTime()) / 86400000);
      const end = Math.min(totalDays, (weekEnd.getTime() - rangeStart.getTime()) / 86400000);
      w.push({
        label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        offsetPct: (offset / totalDays) * 100,
        widthPct: ((end - offset) / totalDays) * 100,
      });
      d.setDate(d.getDate() + 7);
    }
    return w;
  }, []);

  const todayPct = ((today.getTime() - rangeStart.getTime()) / 86400000 / totalDays) * 100;

  // Only show tasks with a due_date
  const ganttTasks = tasks.filter((t) => t.due_date);

  // Sort by due_date
  const sorted = [...ganttTasks].sort(
    (a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
  );

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-border bg-background-secondary/50">
        <div className="w-[220px] shrink-0 px-3 py-2 text-small font-semibold text-foreground-secondary border-r border-border">
          Task
        </div>
        <div className="flex-1 relative h-8 overflow-hidden">
          {weeks.map((w, i) => (
            <div
              key={i}
              className="absolute top-0 h-full border-r border-border flex items-center px-1.5"
              style={{ left: `${w.offsetPct}%`, width: `${w.widthPct}%` }}
            >
              <span className="text-[10px] text-foreground-muted whitespace-nowrap">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div className="py-8 text-center text-sm text-foreground-muted">
          No tasks with due dates to display on the timeline.
        </div>
      ) : (
        sorted.map((task) => {
          const due = new Date(task.due_date!);
          due.setHours(0, 0, 0, 0);
          // Bar: starts 3 days before due, ends on due date
          const barEnd = (due.getTime() - rangeStart.getTime()) / 86400000;
          const created = new Date(task.created_at);
          created.setHours(0, 0, 0, 0);
          const barStartRaw = (created.getTime() - rangeStart.getTime()) / 86400000;
          const barStart = Math.max(0, Math.min(barStartRaw, barEnd - 1));

          const leftPct = (barStart / totalDays) * 100;
          const widthPct = Math.max(((barEnd - barStart) / totalDays) * 100, 1.5);

          const cl = task.client_id ? clientMap[task.client_id] : null;
          const isOverdue = due < today && task.status !== "done";
          const isDone = task.status === "done";

          return (
            <div
              key={task.id}
              className="flex border-b border-border last:border-b-0 hover:bg-background-secondary/30 cursor-pointer group"
              onClick={() => onSelectTask(task.id)}
            >
              {/* Task name */}
              <div className="w-[220px] shrink-0 px-3 py-2.5 border-r border-border flex items-center gap-2 min-w-0">
                <div className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[task.status] || "bg-foreground-muted"}`} />
                <span className={`text-sm truncate ${isDone ? "line-through opacity-50" : "text-foreground"}`}>
                  {task.title}
                </span>
              </div>
              {/* Timeline bar */}
              <div className="flex-1 relative py-2">
                {/* Today line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-accent/40 z-10"
                  style={{ left: `${todayPct}%` }}
                />
                <div
                  className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-full transition-colors ${
                    isDone
                      ? "bg-success/60"
                      : isOverdue
                        ? "bg-destructive/70"
                        : "bg-accent/70 group-hover:bg-accent"
                  }`}
                  style={{
                    left: `${Math.max(0, Math.min(leftPct, 98))}%`,
                    width: `${Math.min(widthPct, 100 - Math.max(0, leftPct))}%`,
                    minWidth: "8px",
                  }}
                >
                  {cl && widthPct > 5 && (
                    <span className="text-[9px] text-background font-medium px-1.5 leading-5 truncate block">
                      {cl.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
