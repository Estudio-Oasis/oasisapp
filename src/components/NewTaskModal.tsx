import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { InlineNewClient } from "@/components/InlineNewClient";

type Client = Tables<"clients">;
type Project = Tables<"projects">;

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
}

const STATUSES = ["backlog", "todo", "in_progress", "review", "done"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "Por hacer",
  in_progress: "En progreso",
  review: "Revisión",
  done: "Listo",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (taskId: string, clientId: string) => void;
  prefillClientId?: string;
  prefillStatus?: string;
}


export function NewTaskModal({
  open,
  onOpenChange,
  onCreated,
  prefillClientId,
  prefillStatus,
}: NewTaskModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [title, setTitle] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [status, setStatus] = useState<string>("todo");
  const [priority, setPriority] = useState<string>("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInlineClient, setShowInlineClient] = useState(false);
  const [clientSearchText, setClientSearchText] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setSelectedClientId(prefillClientId || "");
      setSelectedProjectId("");
      setStatus(prefillStatus || "todo");
      setPriority("medium");
      setAssigneeId("");
      setDueDate("");
      setDescription("");
      setShowInlineClient(false);
      setClientSearchText("");
    }
  }, [open, prefillClientId, prefillStatus]);

  useEffect(() => {
    if (!open) return;
    supabase.from("clients").select("*").eq("status", "active").order("name")
      .then(({ data }) => setClients(data || []));
    supabase.from("profiles").select("id, name, email")
      .then(({ data }) => setProfiles((data as Profile[]) || []));
  }, [open]);

  useEffect(() => {
    if (!selectedClientId) { setProjects([]); setSelectedProjectId(""); return; }
    supabase.from("projects").select("*").eq("client_id", selectedClientId).eq("status", "active").order("name")
      .then(({ data }) => setProjects(data || []));
  }, [selectedClientId]);

  const handleSubmit = async (startTimer = false) => {
    if (!title.trim() || !selectedClientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("tasks").insert({
        title: title.trim(),
        client_id: selectedClientId,
        project_id: selectedProjectId || null,
        status: status as "backlog" | "todo" | "in_progress" | "review" | "done",
        priority: priority as "low" | "medium" | "high" | "urgent",
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
        description: description || null,
      }).select("id").single();

      if (error) { toast.error("Error al crear la tarea"); return; }
      toast.success("¡Tarea creada!");
      onOpenChange(false);
      if (onCreated && data) onCreated(data.id, selectedClientId);
      if (startTimer && data) {
        window.dispatchEvent(new CustomEvent("open-timer-for-task", {
          detail: { taskId: data.id, clientId: selectedClientId },
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInlineClientCreated = (newClient: Client) => {
    setClients((prev) => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedClientId(newClient.id);
    setShowInlineClient(false);
    setClientSearchText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 border-border max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-xl w-full">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <DialogTitle className="text-h2">Nueva tarea</DialogTitle>
          <DialogDescription className="sr-only">Crea una nueva tarea para un cliente</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <div className="mt-4 flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="text-label mb-1 block">Título *</label>
              <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Qué hay que hacer?" />
            </div>

            {/* Client */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-label">Cliente *</label>
                <button
                  type="button"
                  onClick={() => setShowInlineClient(true)}
                  className="text-[12px] text-foreground-muted hover:text-accent flex items-center gap-0.5 transition-colors"
                  title="Add new client"
                >
                  <Plus className="h-3 w-3" /> agregar nuevo
                </button>
              </div>
              <Select value={selectedClientId} onValueChange={(v) => { setSelectedClientId(v); setShowInlineClient(false); }}>
                <SelectTrigger><SelectValue placeholder="Selecciona un cliente..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {showInlineClient && (
                <InlineNewClient
                  prefillName={clientSearchText}
                  onCreated={handleInlineClientCreated}
                  onCancel={() => setShowInlineClient(false)}
                />
              )}
            </div>

            {/* Project */}
            {projects.length > 0 && (
              <div>
                <label className="text-label mb-1 block">Proyecto (opcional)</label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="text-label mb-1 block">Estado</label>
              <div className="flex flex-wrap gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      status === s
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-foreground-secondary hover:bg-background-secondary"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-label mb-1 block">Priority</label>
              <div className="flex flex-wrap gap-1">
                {PRIORITIES.map((p) => {
                  const isActive = priority === p;
                  let activeClass = "bg-primary text-primary-foreground";
                  if (isActive && p === "urgent") activeClass = "bg-destructive text-destructive-foreground";
                  if (isActive && p === "high") activeClass = "bg-accent text-accent-foreground";
                  if (isActive && p === "low") activeClass = "bg-background-tertiary text-foreground-secondary";
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isActive ? activeClass : "border border-border text-foreground-secondary hover:bg-background-secondary"
                      }`}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-label mb-1 block">Assignee (optional)</label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name || p.email || "User"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due date */}
            <div>
              <label className="text-label mb-1 block">Due date (optional)</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            {/* Description */}
            <div>
              <label className="text-label mb-1 block">Description (optional)</label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details..." className="resize-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-6 pt-4 shrink-0 border-t border-border" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          <Button variant="secondary" onClick={() => handleSubmit(false)} disabled={!title.trim() || !selectedClientId || loading} className="w-full h-11">
            Create task
          </Button>
          <Button onClick={() => handleSubmit(true)} disabled={!title.trim() || !selectedClientId || loading} className="w-full h-11">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "⚡ Create & start timer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
