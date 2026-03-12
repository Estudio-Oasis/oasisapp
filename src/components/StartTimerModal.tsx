import { useState, useEffect } from "react";
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
import { X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";

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
}: StartTimerModalProps) {
  const { startTimer, switchTask } = useTimer();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [description, setDescription] = useState("");
  const [manualStart, setManualStart] = useState(prefillStartTime || "");
  const [manualEnd, setManualEnd] = useState(prefillEndTime || "");
  const [loading, setLoading] = useState(false);
  const isManual = mode === "manual";

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedClientId("");
      setSelectedProjectId("");
      setSelectedTaskId("");
      setDescription("");
      setManualStart(prefillStartTime || "");
      setManualEnd(prefillEndTime || "");
    }
  }, [open, prefillStartTime, prefillEndTime]);

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

  const handleSubmit = async () => {
    if (!selectedClientId) return;
    setLoading(true);

    try {
      if (isManual && manualStart && manualEnd) {
        // Create manual entry directly
        const today = new Date();
        const [startH, startM] = manualStart.split(":").map(Number);
        const [endH, endM] = manualEnd.split(":").map(Number);

        const startDate = new Date(today);
        startDate.setHours(startH, startM, 0, 0);
        const endDate = new Date(today);
        endDate.setHours(endH, endM, 0, 0);

        const durationMin = Math.round(
          (endDate.getTime() - startDate.getTime()) / 60000
        );

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
          duration_min: durationMin,
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
    ? "Add entry"
    : mode === "switch"
    ? "Switch task"
    : "Start";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 gap-0 border-border">
        <DialogHeader className="space-y-1 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-h3">
              {isManual ? "Add manual entry" : mode === "switch" ? "Switch task" : "Start timer"}
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
                <label className="text-label">Start time</label>
                <Input
                  type="time"
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label">End time</label>
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
            <label className="text-label">Client</label>
            {clients.length === 0 ? (
              <p className="text-small text-foreground-secondary">
                No clients yet.{" "}
                <Link
                  to="/clients"
                  className="font-semibold text-foreground hover:text-accent transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  Create one →
                </Link>
              </p>
            ) : (
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

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-label">What are you working on?</label>
            <Textarea
              rows={3}
              placeholder="Describe what you're doing... (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
            />
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
