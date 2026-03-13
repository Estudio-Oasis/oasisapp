import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewTaskModal } from "@/components/NewTaskModal";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { StartTimerModal } from "@/components/StartTimerModal";
import { getClientColor, formatDuration } from "@/lib/timer-utils";
import { CheckSquare, List, LayoutGrid, GanttChart, Zap, Plus } from "lucide-react";
import { TaskGanttView } from "@/components/tasks/TaskGanttView";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
interface ClientInfo { id: string; name: string; }
interface AssigneeInfo { id: string; name: string | null; }

const STATUSES = ["backlog", "todo", "in_progress", "review", "done"] as const;
const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog", todo: "To do", in_progress: "In progress", review: "Review", done: "Done",
};
const STATUS_COLORS: Record<string, string> = {
  backlog: "border-foreground-muted border-dashed",
  todo: "border-foreground-secondary",
  in_progress: "border-accent",
  review: "border-foreground-secondary",
  done: "border-success bg-success",
};

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [assignees, setAssignees] = useState<Record<string, AssigneeInfo>>({});
  const [clientMap, setClientMap] = useState<Record<string, ClientInfo>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [view, setView] = useState<"list" | "kanban" | "gantt">("list");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskPrefillStatus, setNewTaskPrefillStatus] = useState<string | undefined>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [timerPrefill, setTimerPrefill] = useState<{ clientId: string; taskId: string } | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [{ data: taskData }, { data: clientData }, { data: profileData }] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name").eq("status", "active").order("name"),
      supabase.from("profiles").select("id, name"),
    ]);
    setTasks(taskData || []);
    const cList = (clientData || []) as ClientInfo[];
    setClients(cList);
    const cMap: Record<string, ClientInfo> = {};
    cList.forEach((c) => { cMap[c.id] = c; });
    setClientMap(cMap);
    const aMap: Record<string, AssigneeInfo> = {};
    ((profileData || []) as AssigneeInfo[]).forEach((p) => { aMap[p.id] = p; });
    setAssignees(aMap);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Listen for timer-for-task events from NewTaskModal
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTimerPrefill({ clientId: detail.clientId, taskId: detail.taskId });
      setTimerModalOpen(true);
    };
    window.addEventListener("open-timer-for-task", handler);
    return () => window.removeEventListener("open-timer-for-task", handler);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (clientFilter !== "all" && t.client_id !== clientFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = [
    { label: "Backlog", value: tasks.filter((t) => t.status === "backlog").length, color: "text-foreground-muted" },
    { label: "To do", value: tasks.filter((t) => t.status === "todo").length, color: "text-foreground-secondary" },
    { label: "In progress", value: tasks.filter((t) => t.status === "in_progress").length, color: "text-accent" },
    { label: "Review", value: tasks.filter((t) => t.status === "review").length, color: "text-foreground-secondary" },
    { label: "Done", value: tasks.filter((t) => t.status === "done").length, color: "text-success" },
    { label: "Overdue", value: tasks.filter((t) => t.due_date && new Date(t.due_date) < today && t.status !== "done").length, danger: true },
  ];

  const cycleStatus = async (task: Task) => {
    const idx = STATUSES.indexOf(task.status as typeof STATUSES[number]);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    await supabase.from("tasks").update({ status: next }).eq("id", task.id);
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t));
  };

  const openTimerForTask = (taskId: string, clientId: string) => {
    setTimerPrefill({ clientId, taskId });
    setTimerModalOpen(true);
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedTaskId) return;
    await supabase.from("tasks").update({ status: newStatus as Task["status"] }).eq("id", draggedTaskId);
    setTasks((prev) => prev.map((t) => t.id === draggedTaskId ? { ...t, status: newStatus as Task["status"] } : t));
    setDraggedTaskId(null);
  };

  const isOverdue = (t: Task) => t.due_date && new Date(t.due_date) < today && t.status !== "done";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h1 text-foreground">Tasks</h1>
        <Button onClick={() => { setNewTaskPrefillStatus(undefined); setNewTaskOpen(true); }}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="border border-border rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.danger && s.value > 0 ? "text-destructive" : s.color || "text-foreground"}`}>{s.value}</p>
            <p className="text-small text-foreground-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-[280px]"
        />
        <div className="flex gap-1 overflow-x-auto flex-1">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-foreground-secondary hover:bg-background-secondary"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="all">All clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex border border-border rounded-md">
            <button
              onClick={() => setView("list")}
              className={`p-1.5 ${view === "list" ? "bg-background-secondary" : ""}`}
              title="List view"
            >
              <List className="h-4 w-4 text-foreground-secondary" />
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`p-1.5 ${view === "kanban" ? "bg-background-secondary" : ""}`}
              title="Kanban view"
            >
              <LayoutGrid className="h-4 w-4 text-foreground-secondary" />
            </button>
            <button
              onClick={() => setView("gantt")}
              className={`p-1.5 ${view === "gantt" ? "bg-background-secondary" : ""}`}
              title="Gantt view"
            >
              <GanttChart className="h-4 w-4 text-foreground-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <CheckSquare className="h-12 w-12 text-border mb-4" />
          <p className="text-lg font-semibold text-foreground">No tasks yet</p>
          <p className="text-sm text-foreground-secondary mt-1">Create your first task to start organizing your work.</p>
          <Button className="mt-4" onClick={() => setNewTaskOpen(true)}>
            <Plus className="h-4 w-4" /> New task
          </Button>
        </div>
      ) : view === "list" ? (
        /* List view */
        <div className="flex flex-col">
          {filtered.map((task) => {
            const cl = task.client_id ? clientMap[task.client_id] : null;
            const assignee = task.assignee_id ? assignees[task.assignee_id] : null;
            const overdue = isOverdue(task);
            const isDone = task.status === "done";
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 py-3.5 border-b border-border group cursor-pointer hover:bg-background-secondary/50 px-1 -mx-1 rounded-sm"
              >
                {/* Status circle */}
                <button
                  onClick={(e) => { e.stopPropagation(); cycleStatus(task); }}
                  className={`h-6 w-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${STATUS_COLORS[task.status]}`}
                >
                  {task.status === "in_progress" && <div className="h-2 w-2 rounded-full bg-accent" />}
                  {task.status === "review" && <div className="h-2 w-2 rounded-full bg-foreground-secondary" />}
                  {task.status === "done" && (
                    <svg className="h-3 w-3 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0" onClick={() => setSelectedTaskId(task.id)}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isDone ? "line-through opacity-50" : "text-foreground"}`}>
                      {task.title}
                    </span>
                    {overdue && (
                      <span className="text-[11px] font-medium bg-destructive-light text-destructive px-2 py-0.5 rounded-full">Overdue</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-small text-foreground-muted">
                    {cl && (
                      <>
                        <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: getClientColor(cl.name) }} />
                        <span>{cl.name}</span>
                      </>
                    )}
                    {task.description && <span className="truncate">· {task.description}</span>}
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 shrink-0">
                  {(task.priority === "urgent" || task.priority === "high") && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      task.priority === "urgent" ? "bg-destructive-light text-destructive" : "bg-accent-light text-accent-foreground"
                    }`}>
                      {task.priority === "urgent" ? "⚡ Urgent" : "↑ High"}
                    </span>
                  )}
                  {task.due_date && (
                    <span className={`text-small ${overdue ? "text-destructive" : "text-foreground-muted"}`}>
                      {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  {assignee && (
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-background shrink-0"
                      style={{ backgroundColor: getClientColor(assignee.name || "U") }}
                    >
                      {(assignee.name || "U").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {task.client_id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openTimerForTask(task.id, task.client_id!); }}
                      className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && tasks.length > 0 && (
            <p className="text-sm text-foreground-muted text-center py-8">No tasks match your filters.</p>
          )}
        </div>
      ) : (
        /* Kanban view */
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1">
          {STATUSES.map((status) => {
            const colTasks = filtered.filter((t) => t.status === status);
            const statusColor: Record<string, string> = {
              backlog: "text-foreground-muted",
              todo: "text-foreground-secondary",
              in_progress: "text-accent",
              review: "text-foreground-secondary",
              done: "text-success",
            };
            return (
              <div
                key={status}
                className="min-w-[260px] flex-1"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(status)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm font-semibold ${statusColor[status]}`}>{STATUS_LABELS[status]}</span>
                  <span className="text-small bg-background-secondary border border-border rounded-full px-2 py-0.5">{colTasks.length}</span>
                </div>
                <button
                  onClick={() => { setNewTaskPrefillStatus(status); setNewTaskOpen(true); }}
                  className="text-small text-foreground-secondary hover:text-foreground mb-2"
                >
                  + Add
                </button>
                <div className="flex flex-col gap-2">
                  {colTasks.map((task) => {
                    const cl = task.client_id ? clientMap[task.client_id] : null;
                    const assignee = task.assignee_id ? assignees[task.assignee_id] : null;
                    const overdue = isOverdue(task);
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="bg-background border border-border rounded-lg p-3.5 cursor-pointer hover:border-foreground transition-colors"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {(task.priority === "urgent" || task.priority === "high") && (
                            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                              task.priority === "urgent" ? "bg-destructive-light text-destructive" : "bg-accent-light text-accent-foreground"
                            }`}>
                              {task.priority === "urgent" ? "⚡" : "↑"}
                            </span>
                          )}
                          {cl && (
                            <div className="flex items-center gap-1 text-[11px] text-foreground-muted">
                              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getClientColor(cl.name) }} />
                              {cl.name}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground line-clamp-2">{task.title}</p>
                        <div className="flex items-center justify-between mt-2">
                          {task.due_date ? (
                            <span className={`text-small ${overdue ? "text-destructive" : "text-foreground-muted"}`}>
                              {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          ) : <span />}
                          {assignee && (
                            <div
                              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-background"
                              style={{ backgroundColor: getClientColor(assignee.name || "U") }}
                            >
                              {(assignee.name || "U").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals & Panels */}
      <NewTaskModal
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        prefillStatus={newTaskPrefillStatus}
        onCreated={() => fetchAll()}
      />
      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={fetchAll}
          onStartTimer={openTimerForTask}
        />
      )}
      <StartTimerModal
        open={timerModalOpen}
        onOpenChange={(o) => { setTimerModalOpen(o); if (!o) setTimerPrefill(null); }}
        prefillClientId={timerPrefill?.clientId}
        prefillTaskId={timerPrefill?.taskId}
      />
    </div>
  );
}
