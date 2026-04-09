import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { getClientColor } from "@/lib/timer-utils";
import { Plus, Zap } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

interface ClientInfo { id: string; name: string; }
interface AssigneeInfo { id: string; name: string | null; }

const STATUSES = ["backlog", "todo", "in_progress", "review", "done"] as const;
const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog", todo: "Por hacer", in_progress: "En progreso", review: "Revisión", done: "Listo",
};
const STATUS_COLORS: Record<string, string> = {
  backlog: "text-foreground-muted",
  todo: "text-foreground-secondary",
  in_progress: "text-accent",
  review: "text-foreground-secondary",
  done: "text-success",
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive",
  high: "bg-accent/10 text-accent",
  medium: "bg-foreground-muted/10 text-foreground-secondary",
  low: "bg-background-secondary text-foreground-muted",
};

interface TaskKanbanViewProps {
  tasks: Task[];
  clientMap: Record<string, ClientInfo>;
  assignees: Record<string, AssigneeInfo>;
  onTaskClick: (id: string) => void;
  onAddTask: (status: string) => void;
  onTimerStart: (taskId: string, clientId: string) => void;
  onTasksChange: (tasks: Task[]) => void;
}

function KanbanColumn({ status, children, count }: { status: string; children: React.ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[250px] flex-1 flex flex-col rounded-xl transition-colors ${isOver ? "bg-accent/5" : ""}`}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`text-sm font-semibold ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
        <span className="text-[11px] bg-background-secondary border border-border rounded-full px-2 py-0.5">{count}</span>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-h-[100px]">
        {children}
      </div>
    </div>
  );
}

function SortableTaskCard({
  task,
  clientMap,
  assignees,
  onTaskClick,
  onTimerStart,
}: {
  task: Task;
  clientMap: Record<string, ClientInfo>;
  assignees: Record<string, AssigneeInfo>;
  onTaskClick: (id: string) => void;
  onTimerStart: (taskId: string, clientId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cl = task.client_id ? clientMap[task.client_id] : null;
  const assignee = task.assignee_id ? assignees[task.assignee_id] : null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = task.due_date && new Date(task.due_date) < today && task.status !== "done";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick(task.id)}
      className={`bg-card border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-border transition-all group ${overdue ? "border-destructive" : "border-border/60"}`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority]}`}>
          {task.priority === "urgent" ? "⚡" : task.priority === "high" ? "↑" : ""}{task.priority}
        </span>
        {overdue && (
          <span className="text-[9px] font-semibold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">Vencida</span>
        )}
      </div>
      <p className={`text-sm font-medium text-foreground mb-1 line-clamp-2 ${task.status === "done" ? "line-through opacity-50" : ""}`}>{task.title}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {cl && (
            <>
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getClientColor(cl.name) }} />
              <span className="text-[11px] text-foreground-secondary truncate max-w-[100px]">{cl.name}</span>
            </>
          )}
          {task.due_date && (
            <span className={`text-[10px] ${overdue ? "text-destructive" : "text-foreground-muted"}`}>
              {new Date(task.due_date).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {assignee && (
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-semibold text-background"
              style={{ backgroundColor: getClientColor(assignee.name || "U") }}
            >
              {(assignee.name || "U").slice(0, 2).toUpperCase()}
            </div>
          )}
          {task.client_id && (
            <button
              onClick={(e) => { e.stopPropagation(); onTimerStart(task.id, task.client_id!); }}
              className="h-5 w-5 flex items-center justify-center rounded text-foreground-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
            >
              <Zap className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskKanbanView({ tasks, clientMap, assignees, onTaskClick, onAddTask, onTimerStart, onTasksChange }: TaskKanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    if (!STATUSES.includes(newStatus as any)) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus as Task["status"] } : t);
    onTasksChange(updated);

    // Persist
    const { error } = await supabase.from("tasks").update({ status: newStatus as Task["status"] }).eq("id", taskId);
    if (error) {
      toast.error("Error al mover tarea");
      onTasksChange(tasks); // rollback
    }
  }, [tasks, onTasksChange]);

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1">
        {STATUSES.map(status => {
          const colTasks = tasks.filter(t => t.status === status);
          return (
            <KanbanColumn key={status} status={status} count={colTasks.length}>
              <button
                onClick={() => onAddTask(status)}
                className="text-xs text-foreground-secondary hover:text-foreground mb-1 px-1 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Agregar
              </button>
              <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {colTasks.map(task => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    clientMap={clientMap}
                    assignees={assignees}
                    onTaskClick={onTaskClick}
                    onTimerStart={onTimerStart}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="bg-card border border-accent rounded-xl p-3 shadow-lg opacity-90 max-w-[260px]">
            <p className="text-sm font-medium text-foreground truncate">{activeTask.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
