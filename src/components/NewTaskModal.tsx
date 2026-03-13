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
  todo: "To do",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (taskId: string, clientId: string) => void;
  prefillClientId?: string;
  prefillStatus?: string;
}

/* ── Inline quick-create client card ── */
function InlineNewClient({
  prefillName,
  onCreated,
  onCancel,
}: {
  prefillName: string;
  onCreated: (client: Client) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const rate = parseFloat(monthlyRate) || 0;
      const fields = { name: name.trim(), email: email || null, monthly_rate: rate, currency };
      const score = calculateCompleteness({ ...fields, phone: null, contact_name: null, payment_method: null, communication_channel: null, billing_entity: null });
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...fields, completeness_score: score })
        .select()
        .single();
      if (error || !data) { toast.error("Failed to create client"); return; }
      toast.success(`Client "${data.name}" created`);
      onCreated(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background-secondary border border-border rounded-xl p-4 mt-2 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">New client</span>
        <button onClick={onCancel} className="h-6 w-6 flex items-center justify-center rounded text-foreground-muted hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div>
        <label className="text-label mb-1 block">Name *</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <label className="text-label mb-1 block">Email</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-label mb-1 block">Monthly rate</label>
          <Input value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} type="number" placeholder="0" />
        </div>
        <div>
          <label className="text-label mb-1 block">Currency</label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="MXN">MXN</SelectItem>
              <SelectItem value="COP">COP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button size="sm" onClick={handleCreate} disabled={!name.trim() || saving} className="flex-1">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create & select →"}
        </Button>
      </div>
    </div>
  );
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

      if (error) { toast.error("Failed to create task"); return; }
      toast.success("Task created!");
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
          <DialogTitle className="text-h2">New task</DialogTitle>
          <DialogDescription className="sr-only">Create a new task for a client</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <div className="mt-4 flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="text-label mb-1 block">Title *</label>
              <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" />
            </div>

            {/* Client */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-label">Client *</label>
                <button
                  type="button"
                  onClick={() => setShowInlineClient(true)}
                  className="text-[12px] text-foreground-muted hover:text-accent flex items-center gap-0.5 transition-colors"
                  title="Add new client"
                >
                  <Plus className="h-3 w-3" /> add new
                </button>
              </div>
              <Select value={selectedClientId} onValueChange={(v) => { setSelectedClientId(v); setShowInlineClient(false); }}>
                <SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger>
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
                <label className="text-label mb-1 block">Project (optional)</label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="text-label mb-1 block">Status</label>
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
