import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Pencil, Zap, Loader2 } from "lucide-react";
import { formatDuration, getClientColor } from "@/lib/timer-utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

const STATUSES = ["backlog", "todo", "in_progress", "review", "done"] as const;
const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog", todo: "To do", in_progress: "In progress", review: "Review", done: "Done",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High", urgent: "Urgent",
};

interface TaskDetailPanelProps {
  taskId: string;
  onClose: () => void;
  onUpdated: () => void;
  onStartTimer: (taskId: string, clientId: string) => void;
}

interface ClientInfo { id: string; name: string; }
interface ProjectInfo { id: string; name: string; }
interface AssigneeInfo { id: string; name: string | null; email: string | null; }
interface TimeEntryInfo { id: string; started_at: string; duration_min: number | null; }

export const TaskDetailPanel = ({ taskId, onClose, onUpdated, onStartTimer }: TaskDetailPanelProps) => {
  const { isAdmin } = useRole();
  const [task, setTask] = useState<Task | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [assignee, setAssignee] = useState<AssigneeInfo | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntryInfo[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTask = useCallback(async () => {
    const { data } = await supabase.from("tasks").select("*").eq("id", taskId).single();
    if (!data) return;
    setTask(data);
    setDescDraft(data.description || "");

    // Fetch related data in parallel
    if (data.client_id) {
      const { data: c } = await supabase.from("clients").select("id, name").eq("id", data.client_id).single();
      if (c) setClient(c);
    }
    if (data.project_id) {
      const { data: p } = await supabase.from("projects").select("id, name").eq("id", data.project_id).single();
      if (p) setProject(p);
    }
    if (data.assignee_id) {
      const { data: a } = await supabase.from("profiles").select("id, name, email").eq("id", data.assignee_id).single();
      if (a) setAssignee(a as AssigneeInfo);
    }
    const { data: entries } = await supabase.from("time_entries").select("id, started_at, duration_min")
      .eq("task_id", taskId).order("started_at", { ascending: false }).limit(5);
    const list = (entries || []) as TimeEntryInfo[];
    setTimeEntries(list);
    setTotalMinutes(list.reduce((acc, e) => acc + (e.duration_min || 0), 0));
    setLoading(false);
  }, [taskId]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  const updateStatus = async (newStatus: string) => {
    if (!task) return;
    await supabase.from("tasks").update({ status: newStatus as Task["status"] }).eq("id", task.id);
    setTask({ ...task, status: newStatus as Task["status"] });
    onUpdated();
  };

  const saveDescription = async () => {
    if (!task) return;
    await supabase.from("tasks").update({ description: descDraft || null }).eq("id", task.id);
    setTask({ ...task, description: descDraft || null });
    setEditingDesc(false);
    onUpdated();
  };

  const deleteTask = async () => {
    if (!task) return;
    if (!confirm("Delete this task? This cannot be undone.")) return;
    await supabase.from("tasks").delete().eq("id", task.id);
    toast.success("Task deleted");
    onClose();
    onUpdated();
  };

  if (loading || !task) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-foreground/20" onClick={onClose} />
        <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[400px] bg-background border-l border-border flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
        </div>
      </>
    );
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/20" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[400px] bg-background border-l border-border overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-h2 text-foreground flex-1 pr-2">{task.title}</h2>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-tertiary shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap gap-1 mb-6">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  task.status === s
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground-secondary hover:bg-background-secondary"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Details */}
          <div className="border border-border rounded-lg p-4 mb-4">
            <p className="text-micro text-foreground-muted mb-3">Details</p>
            <div className="flex flex-col gap-2.5 text-sm">
              {client && (
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Client</span>
                  <Link to={`/clients/${client.id}`} className="text-accent hover:underline font-medium">{client.name}</Link>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Project</span>
                <span className="text-foreground">{project?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Priority</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  task.priority === "urgent" ? "bg-destructive-light text-destructive" :
                  task.priority === "high" ? "bg-accent-light text-accent-foreground" :
                  "text-foreground"
                }`}>
                  {task.priority === "urgent" ? "⚡ " : task.priority === "high" ? "↑ " : ""}{PRIORITY_LABELS[task.priority]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Due date</span>
                <span className={isOverdue ? "text-destructive font-medium" : "text-foreground"}>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Assignee</span>
                <span className="text-foreground">{assignee ? (assignee.name || assignee.email || "User") : "Unassigned"}</span>
              </div>
            </div>
          </div>

          {/* Time tracked */}
          <div className="border border-border rounded-lg p-4 mb-4">
            <p className="text-micro text-foreground-muted mb-3">Time tracked</p>
            <p className="text-h3 text-foreground mb-2">{totalMinutes > 0 ? formatDuration(totalMinutes) + " total" : "No time tracked"}</p>
            {timeEntries.slice(0, 3).map((e) => (
              <div key={e.id} className="flex justify-between text-small text-foreground-secondary py-1">
                <span>{new Date(e.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <span>{e.duration_min ? formatDuration(e.duration_min) : "—"}</span>
              </div>
            ))}
            {task.client_id && (
              <Button
                variant="accent"
                size="sm"
                className="w-full mt-3"
                onClick={() => onStartTimer(task.id, task.client_id!)}
              >
                <Zap className="h-3.5 w-3.5" /> Start timer on this task
              </Button>
            )}
          </div>

          {/* Description */}
          <div className="border border-border rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-micro text-foreground-muted">Description</p>
              {!editingDesc && (
                <button onClick={() => setEditingDesc(true)} className="text-foreground-muted hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {editingDesc ? (
              <div className="flex flex-col gap-2">
                <Textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)} rows={4} className="resize-none" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveDescription}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setEditingDesc(false); setDescDraft(task.description || ""); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {task.description || <span className="text-foreground-muted">No description</span>}
              </p>
            )}
          </div>

          {/* Delete */}
          <button onClick={deleteTask} className="text-destructive text-small hover:underline">
            Delete task
          </button>
        </div>
      </div>
    </>
  );
}
