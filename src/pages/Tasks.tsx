import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WidgetCard, StatWidget } from "@/components/ui/widget-card";
import { NewTaskModal } from "@/components/NewTaskModal";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { StartTimerModal } from "@/components/StartTimerModal";
import { getClientColor, formatDuration } from "@/lib/timer-utils";
import { CheckSquare, List, LayoutGrid, GanttChart, Zap, Plus, AlertTriangle, Clock, CheckCircle2, Inbox, Eye } from "lucide-react";
import { TaskGanttView } from "@/components/tasks/TaskGanttView";
import { TaskKanbanView } from "@/components/tasks/TaskKanbanView";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
interface ClientInfo { id: string; name: string; }
interface AssigneeInfo { id: string; name: string | null; }

const STATUSES = ["backlog", "todo", "in_progress", "review", "done"] as const;
const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog", todo: "Por hacer", in_progress: "En progreso", review: "Revisión", done: "Listo",
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
  const { t } = useLanguage();
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
    if (statusFilter !== "all" && statusFilter !== "overdue" && t.status !== statusFilter) return false;
    if (statusFilter === "overdue" && !(t.due_date && new Date(t.due_date) < today && t.status !== "done")) return false;
    if (clientFilter !== "all" && t.client_id !== clientFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statDefs = [
    { label: t("tasks.backlog"), value: tasks.filter((t2) => t2.status === "backlog").length, icon: Inbox, accent: "default" as const, filter: "backlog" },
    { label: t("tasks.todo"), value: tasks.filter((t2) => t2.status === "todo").length, icon: CheckSquare, accent: "default" as const, filter: "todo" },
    { label: t("tasks.inProgress"), value: tasks.filter((t2) => t2.status === "in_progress").length, icon: Clock, accent: "amber" as const, filter: "in_progress" },
    { label: t("tasks.review"), value: tasks.filter((t2) => t2.status === "review").length, icon: Eye, accent: "default" as const, filter: "review" },
    { label: t("tasks.done"), value: tasks.filter((t2) => t2.status === "done").length, icon: CheckCircle2, accent: "green" as const, filter: "done" },
    { label: t("tasks.overdue"), value: tasks.filter((t2) => t2.due_date && new Date(t2.due_date) < today && t2.status !== "done").length, icon: AlertTriangle, accent: "red" as const, filter: "overdue" },
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

  // Group tasks for list view
  const inProgressTasks = filtered.filter((t) => t.status === "in_progress");
  const pendingTasks = filtered.filter((t) => t.status !== "in_progress" && t.status !== "done");
  const doneTasks = filtered.filter((t) => t.status === "done");
  const [showDone, setShowDone] = useState(false);

  const renderTaskRow = (task: Task) => {
    const cl = task.client_id ? clientMap[task.client_id] : null;
    const assignee = task.assignee_id ? assignees[task.assignee_id] : null;
    const overdue = isOverdue(task);
    const isDone = task.status === "done";

    return (
      <div
        key={task.id}
        className={`rounded-2xl border bg-card p-4 transition-all duration-200 hover:border-border dark:hover:border-border/60 group cursor-pointer ${
          overdue ? "border-l-4 border-l-destructive" : task.status === "in_progress" ? "border-l-4 border-l-accent" : "border-border/60 dark:border-border/40"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Status circle */}
          <button
            onClick={(e) => { e.stopPropagation(); cycleStatus(task); }}
            className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${overdue ? "border-destructive bg-destructive" : STATUS_COLORS[task.status]}`}
          >
            {task.status === "in_progress" && <div className="h-1.5 w-1.5 rounded-full bg-accent" />}
            {task.status === "review" && <div className="h-1.5 w-1.5 rounded-full bg-foreground-secondary" />}
            {task.status === "done" && (
              <svg className="h-2.5 w-2.5 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0" onClick={() => setSelectedTaskId(task.id)}>
            <div className="flex items-center gap-2">
              <span className={`text-[14px] font-semibold ${isDone ? "line-through opacity-40" : "text-foreground"}`}>
                {task.title}
              </span>
              {overdue && (
                <span className="text-[10px] font-semibold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{t("tasks.overdue")}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {cl && (
                <>
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: getClientColor(cl.name) }} />
                  <span className="text-[12px] text-foreground-secondary">{cl.name}</span>
                </>
              )}
              {task.description && <span className="text-[12px] text-foreground-muted truncate">· {task.description}</span>}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {(task.priority === "urgent" || task.priority === "high") && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                task.priority === "urgent" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
              }`}>
                {task.priority === "urgent" ? "⚡ Urgente" : "↑ Alta"}
              </span>
            )}
            {task.due_date && (
              <span className={`text-[11px] tabular-nums ${overdue ? "text-destructive font-semibold" : "text-foreground-muted"}`}>
                {new Date(task.due_date).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
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
                className="h-7 w-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-all"
                title="Iniciar en Bitácora"
              >
                <Zap className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h1 text-foreground">{t("tasks.title")}</h1>
        <Button data-tour="new-task-btn" onClick={() => { setNewTaskPrefillStatus(undefined); setNewTaskOpen(true); }}>
          <Plus className="h-4 w-4" /> {t("tasks.newTask")}
        </Button>
      </div>

      {/* Stats as widgets */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {statDefs.map((s) => (
          <StatWidget
            key={s.label}
            label={s.label}
            value={s.value}
            accent={s.accent}
            icon={s.icon}
            onClick={() => setStatusFilter(statusFilter === s.filter ? "all" : s.filter)}
            active={statusFilter === s.filter}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <Input
          placeholder={t("tasks.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-[280px]"
        />
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <select
            className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="all">{t("tasks.allClients")}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex border border-border rounded-xl overflow-hidden">
            {([["list", List], ["kanban", LayoutGrid], ["gantt", GanttChart]] as const).map(([v, VIcon]) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={`p-2 transition-colors ${view === v ? "bg-background-secondary" : "hover:bg-background-secondary/50"}`}
              >
                <VIcon className="h-4 w-4 text-foreground-secondary" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <CheckSquare className="h-12 w-12 text-border mb-4" />
          <p className="text-lg font-semibold text-foreground">{t("tasks.noTasks")}</p>
          <p className="text-sm text-foreground-secondary mt-1">{t("tasks.addFirst")}</p>
          <Button className="mt-4" onClick={() => setNewTaskOpen(true)}>
            <Plus className="h-4 w-4" /> {t("tasks.newTask")}
          </Button>
        </div>
      ) : view === "list" ? (
        <div className="space-y-6">
          {/* In progress group */}
          {inProgressTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1 w-1 rounded-full bg-accent" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{t("tasks.inProgress")}</span>
                <span className="text-[10px] text-foreground-muted">{inProgressTasks.length}</span>
              </div>
              {inProgressTasks.map(renderTaskRow)}
            </div>
          )}

          {/* Pending group */}
          {pendingTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1 w-1 rounded-full bg-foreground-muted" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">{t("tasks.pending")}</span>
                <span className="text-[10px] text-foreground-muted">{pendingTasks.length}</span>
              </div>
              {pendingTasks.map(renderTaskRow)}
            </div>
          )}

          {/* Done group */}
          {doneTasks.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowDone(!showDone)}
                className="flex items-center gap-2 mb-1 group"
              >
                <div className="h-1 w-1 rounded-full bg-success" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-success">{t("tasks.done")}</span>
                <span className="text-[10px] text-foreground-muted">{doneTasks.length}</span>
                <span className="text-[10px] text-foreground-muted group-hover:text-foreground transition-colors">
                  {showDone ? "▲" : "▼"}
                </span>
              </button>
              {showDone && doneTasks.map(renderTaskRow)}
            </div>
          )}

          {filtered.length === 0 && tasks.length > 0 && (
            <p className="text-sm text-foreground-muted text-center py-8">{t("tasks.noMatch")}</p>
          )}
        </div>
      ) : view === "kanban" ? (
        <TaskKanbanView
          tasks={filtered}
          clientMap={clientMap}
          assignees={assignees}
          onTaskClick={(id) => setSelectedTaskId(id)}
          onAddTask={(status) => { setNewTaskPrefillStatus(status); setNewTaskOpen(true); }}
          onTimerStart={(taskId, clientId) => openTimerForTask(taskId, clientId)}
          onTasksChange={(updated) => setTasks(prev => {
            const updatedMap = new Map(updated.map(t => [t.id, t]));
            return prev.map(t => updatedMap.get(t.id) || t);
          })}
        />
      ) : (
        <TaskGanttView tasks={filtered} clientMap={clientMap} onSelectTask={(id) => setSelectedTaskId(id)} />
      )}

      <NewTaskModal
        open={newTaskOpen}
        onOpenChange={(open) => { if (!open) setNewTaskOpen(false); }}
        onCreated={() => { fetchAll(); }}
        prefillStatus={newTaskPrefillStatus}
      />

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={fetchAll}
          onStartTimer={(taskId, clientId) => openTimerForTask(taskId, clientId)}
        />
      )}

      <StartTimerModal
        open={timerModalOpen}
        onOpenChange={setTimerModalOpen}
        prefillClientId={timerPrefill?.clientId}
        prefillTaskId={timerPrefill?.taskId}
      />
    </div>
  );
}
