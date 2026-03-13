import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTimer } from "@/contexts/TimerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateLong } from "@/lib/timer-utils";
import { Plus, Sparkles, Undo2, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";
import { InlineNewClient } from "@/components/InlineNewClient";
import { toast } from "sonner";

type Client = Tables<"clients">;
type Task = Tables<"tasks">;
type Project = Tables<"projects">;

interface StartTimerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "start" | "switch" | "manual";
  prefillStartTime?: string;
  prefillEndTime?: string;
  prefillClientId?: string;
  prefillTaskId?: string;
}

export function StartTimerModal({
  open,
  onOpenChange,
  mode = "start",
  prefillStartTime,
  prefillEndTime,
  prefillClientId,
  prefillTaskId,
}: StartTimerModalProps) {
  const { startTimer, switchTask } = useTimer();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [description, setDescription] = useState("");
  const [manualStart, setManualStart] = useState(prefillStartTime || "");
  const [manualEnd, setManualEnd] = useState(prefillEndTime || "");
  const [loading, setLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const isManual = mode === "manual";

  // Task suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<(Task & { client_name?: string })[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI rewrite state
  const [rewriting, setRewriting] = useState(false);
  const [previousDescription, setPreviousDescription] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedClientId(prefillClientId || "");
      setSelectedProjectId("");
      setSelectedTaskId(prefillTaskId || "");
      setDescription("");
      setManualStart(prefillStartTime || "");
      setManualEnd(prefillEndTime || "");
      setShowNewClient(false);
      setPreviousDescription(null);
    }
  }, [open, prefillStartTime, prefillEndTime, prefillClientId, prefillTaskId]);

  // Load clients
  useEffect(() => {
    if (!open) return;
    supabase
      .from("clients")
      .select("*")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => setClients(data || []));
  }, [open]);

  // Load all open tasks for suggestions
  useEffect(() => {
    if (!open) return;
    supabase
      .from("tasks")
      .select("*, clients(name)")
      .neq("status", "done")
      .order("title")
      .then(({ data }) => {
        const mapped = (data || []).map((t) => ({
          ...t,
          client_name: (t as unknown as { clients: { name: string } | null }).clients?.name || undefined,
        }));
        setAllTasks(mapped);
      });
  }, [open]);

  // Load projects when client changes
  useEffect(() => {
    if (!selectedClientId) {
      setProjects([]);
      setSelectedProjectId("");
      return;
    }
    supabase
      .from("projects")
      .select("*")
      .eq("client_id", selectedClientId)
      .eq("status", "active")
      .order("name")
      .then(({ data }) => setProjects(data || []));
  }, [selectedClientId]);

  // Load tasks when client changes
  useEffect(() => {
    if (!selectedClientId) {
      setTasks([]);
      setSelectedTaskId("");
      return;
    }
    supabase
      .from("tasks")
      .select("*")
      .eq("client_id", selectedClientId)
      .neq("status", "done")
      .order("title")
      .then(({ data }) => setTasks(data || []));
  }, [selectedClientId]);

  // Debounced task suggestion filter
  useEffect(() => {
    const query = description.trim().toLowerCase();
    if (query.length < 2) {
      setFilteredSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      let pool = allTasks;
      if (selectedClientId) {
        // Prioritize client tasks first, then others
        const clientTasks = pool.filter((t) => t.client_id === selectedClientId && t.title.toLowerCase().includes(query));
        const otherTasks = pool.filter((t) => t.client_id !== selectedClientId && t.title.toLowerCase().includes(query));
        setFilteredSuggestions([...clientTasks, ...otherTasks].slice(0, 5));
      } else {
        setFilteredSuggestions(pool.filter((t) => t.title.toLowerCase().includes(query)).slice(0, 5));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [description, allTasks, selectedClientId]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSuggestionClick = (task: Task & { client_name?: string }) => {
    setDescription(task.title);
    setSelectedTaskId(task.id);
    if (task.client_id) setSelectedClientId(task.client_id);
    setShowSuggestions(false);
  };

  const handleRewrite = useCallback(async () => {
    if (description.trim().length < 5 || rewriting) return;
    setRewriting(true);
    setPreviousDescription(description);

    try {
      const { data, error } = await supabase.functions.invoke("rewrite-description", {
        body: { text: description },
      });
      if (error || !data?.result) {
        toast.error("Could not rewrite");
        setPreviousDescription(null);
        return;
      }
      setDescription(data.result);
      // Auto-clear undo after 5s
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => setPreviousDescription(null), 5000);
    } catch {
      toast.error("Rewrite failed");
      setPreviousDescription(null);
    } finally {
      setRewriting(false);
    }
  }, [description, rewriting]);

  const handleUndo = () => {
    if (previousDescription !== null) {
      setDescription(previousDescription);
      setPreviousDescription(null);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    }
  };

  const handleClientCreated = (client: Client) => {
    setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedClientId(client.id);
    setShowNewClient(false);
  };

  const handleSubmit = async () => {
    if (!selectedClientId) return;
    setLoading(true);

    try {
      if (isManual && manualStart && manualEnd) {
        const today = new Date();
        const [startH, startM] = manualStart.split(":").map(Number);
        const [endH, endM] = manualEnd.split(":").map(Number);

        const startDate = new Date(today);
        startDate.setHours(startH, startM, 0, 0);
        const endDate = new Date(today);
        endDate.setHours(endH, endM, 0, 0);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("time_entries").insert({
          user_id: user.id,
          client_id: selectedClientId,
          task_id: selectedTaskId || null,
          project_id: selectedProjectId || null,
          description: description || null,
          started_at: startDate.toISOString(),
          ended_at: endDate.toISOString(),
        });
      } else if (mode === "switch") {
        await switchTask(
          selectedClientId,
          selectedTaskId || null,
          selectedProjectId || null,
          description || null
        );
      } else {
        await startTimer(
          selectedClientId,
          selectedTaskId || null,
          selectedProjectId || null,
          description || null
        );
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const buttonText = isManual
    ? "Agregar entrada"
    : mode === "switch"
    ? "Cambiar tarea"
    : "Iniciar";

  const priorityColor: Record<string, string> = {
    urgent: "bg-destructive",
    high: "bg-amber-500",
    medium: "bg-amber-300",
    low: "bg-emerald-400",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 gap-0 border-border">
        <DialogHeader className="space-y-1 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-h3">
              {isManual ? "Agregar entrada manual" : mode === "switch" ? "Cambiar tarea" : "Iniciar timer"}
            </DialogTitle>
          </div>
          <p className="text-small text-foreground-secondary">
            {formatDateLong(new Date())}
          </p>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Manual time fields */}
          {isManual && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-label">Hora inicio</label>
                <Input
                  type="time"
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label">Hora fin</label>
                <Input
                  type="time"
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Client */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-label">Cliente</label>
              {!showNewClient && clients.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewClient(true)}
                  className="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-0.5 transition-colors"
                >
                  <Plus className="h-3 w-3" /> agregar nuevo
                </button>
              )}
            </div>
            {clients.length === 0 && !showNewClient ? (
              <div>
                <p className="text-small text-foreground-secondary">
                  Aún no hay clientes.{" "}
                  <Link
                    to="/clients"
                    className="font-semibold text-foreground hover:text-accent transition-colors"
                    onClick={() => onOpenChange(false)}
                  >
                    Crear uno →
                  </Link>
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewClient(true)}
                  className="mt-1 text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-0.5 transition-colors"
                >
                  <Plus className="h-3 w-3" /> o crea uno aquí
                </button>
              </div>
            ) : !showNewClient ? (
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {showNewClient && (
              <InlineNewClient
                prefillName=""
                onCreated={handleClientCreated}
                onCancel={() => setShowNewClient(false)}
              />
            )}
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-label">Project (optional)</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Task */}
          <div className="space-y-1.5">
            <label className="text-label">Task (optional)</label>
            <Select
              value={selectedTaskId}
              onValueChange={setSelectedTaskId}
              disabled={!selectedClientId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedClientId ? "No specific task" : "Select a client first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description with task suggestions + AI rewrite */}
          <div className="space-y-1.5 relative">
            <label className="text-label">What are you working on?</label>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                rows={3}
                placeholder="Describe what you're doing... (optional)"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (e.target.value.trim().length >= 2) setShowSuggestions(true);
                  else setShowSuggestions(false);
                }}
                onFocus={() => {
                  if (description.trim().length >= 2) setShowSuggestions(true);
                }}
                className="resize-none pr-20"
              />
              {/* AI rewrite button */}
              {description.trim().length >= 5 && (
                <button
                  type="button"
                  onClick={handleRewrite}
                  disabled={rewriting}
                  className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background border border-border px-2 py-1 text-[11px] font-medium text-foreground-secondary hover:text-accent transition-colors disabled:opacity-50"
                >
                  {rewriting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Rewrite
                </button>
              )}
            </div>
            {/* Undo */}
            {previousDescription !== null && !rewriting && (
              <button
                type="button"
                onClick={handleUndo}
                className="flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors mt-1"
              >
                <Undo2 className="h-3 w-3" /> Undo
              </button>
            )}
            {/* Task suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg max-h-[180px] overflow-y-auto"
              >
                {filteredSuggestions.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleSuggestionClick(task)}
                    className="w-full text-left px-3 py-2 hover:bg-background-secondary flex items-center gap-2 text-sm transition-colors"
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${priorityColor[task.priority] || "bg-muted"}`}
                    />
                    <span className="truncate flex-1 text-foreground">{task.title}</span>
                    {task.client_name && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-background-tertiary text-foreground-muted shrink-0">
                        {task.client_name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedClientId || loading || (isManual && (!manualStart || !manualEnd))}
          className="w-full h-11 mt-6"
        >
          {loading ? "..." : buttonText}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
