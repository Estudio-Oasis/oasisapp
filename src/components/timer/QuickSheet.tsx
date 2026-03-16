import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTimer } from "@/contexts/TimerContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Play,
  Clock,
  Video,
  Coffee,
  Utensils,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getClientColor } from "@/lib/timer-utils";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────────────── */

interface RecentEntry {
  id: string;
  description: string | null;
  clientId: string | null;
  clientName: string | null;
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
}

interface QuickAction {
  key: string;
  label: string;
  icon: React.ElementType;
  description: string; // what gets stored
  isBreak: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: "reunion", label: "Reunión", icon: Video, description: "Reunión", isBreak: false },
  { key: "break", label: "Descanso", icon: Coffee, description: "Break", isBreak: true },
  { key: "comida", label: "Comida", icon: Utensils, description: "Comiendo", isBreak: true },
];

/* ── Props ─────────────────────────────────────────────────── */

interface QuickSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "start" = new session, "switch" = swap running session */
  mode?: "start" | "switch";
}

/* ── Component ─────────────────────────────────────────────── */

export function QuickSheet({ open, onOpenChange, mode = "start" }: QuickSheetProps) {
  const { startTimer, switchTask, startBreakTimer } = useTimer();
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [recents, setRecents] = useState<RecentEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setText("");
      setShowContext(false);
      setSelectedClientId(null);
      setSelectedTaskId(null);
      setSelectedProjectId(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Load recents
  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("time_entries")
      .select("id, description, client_id, task_id, project_id, clients(name), tasks(title)")
      .eq("user_id", user.id)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data) return;
        // Deduplicate by description+client combo
        const seen = new Set<string>();
        const unique: RecentEntry[] = [];
        for (const e of data) {
          const key = `${e.description || ""}::${e.client_id || ""}::${e.task_id || ""}`;
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push({
            id: e.id,
            description: e.description,
            clientId: e.client_id,
            clientName: (e.clients as any)?.name || null,
            taskId: e.task_id,
            taskTitle: (e.tasks as any)?.title || null,
            projectId: e.project_id,
          });
          if (unique.length >= 5) break;
        }
        setRecents(unique);
      });
  }, [open, user]);

  // Load clients for optional context
  useEffect(() => {
    if (!open) return;
    supabase
      .from("clients")
      .select("id, name")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => setClients(data || []));
  }, [open]);

  /* ── Handlers ────────────────────────────────────────────── */

  const handleStart = useCallback(async (desc?: string | null, clientId?: string | null, taskId?: string | null, projectId?: string | null) => {
    setLoading(true);
    try {
      const fn = mode === "switch" ? switchTask : startTimer;
      await fn(
        clientId || null,
        taskId || null,
        projectId || null,
        desc || null,
      );
      onOpenChange(false);
    } catch {
      toast.error("No se pudo iniciar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [mode, startTimer, switchTask, onOpenChange]);

  const handleQuickAction = useCallback(async (action: QuickAction) => {
    setLoading(true);
    try {
      if (action.isBreak) {
        const breakMap: Record<string, string> = {
          break: "break",
          comida: "eating",
        };
        await startBreakTimer(breakMap[action.key] || action.key);
      } else {
        await startTimer(null, null, null, action.description);
      }
      onOpenChange(false);
    } catch {
      toast.error("No se pudo iniciar.");
    } finally {
      setLoading(false);
    }
  }, [startBreakTimer, startTimer, onOpenChange]);

  const handleRecentSelect = useCallback((recent: RecentEntry) => {
    handleStart(recent.description, recent.clientId, recent.taskId, recent.projectId);
  }, [handleStart]);

  const handleSubmit = useCallback(() => {
    handleStart(text.trim() || null, selectedClientId, selectedTaskId, selectedProjectId);
  }, [text, selectedClientId, selectedTaskId, selectedProjectId, handleStart]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 pb-6 pt-3 max-h-[85dvh] overflow-y-auto border-t border-border"
      >
        <SheetTitle className="sr-only">
          {mode === "switch" ? "Cambiar actividad" : "Iniciar actividad"}
        </SheetTitle>

        {/* Drag handle */}
        <div className="flex justify-center mb-3">
          <div className="h-1 w-10 rounded-full bg-foreground/15" />
        </div>

        {/* ── Input principal ── */}
        <div className="relative">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="¿Qué estás haciendo?"
            className="h-12 text-[15px] pr-14 bg-background-secondary border-0 rounded-xl placeholder:text-foreground-muted focus-visible:ring-1 focus-visible:ring-accent/40"
            disabled={loading}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-accent-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            <Play className="h-4 w-4 ml-0.5" />
          </button>
        </div>

        {/* ── Microcopy ── */}
        <p className="text-[11px] text-foreground-muted mt-1.5 px-1">
          Escribe algo, elige un reciente o toca una acción rápida
        </p>

        {/* ── Quick Actions ── */}
        <div className="flex gap-2 mt-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => handleQuickAction(action)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-background-secondary py-2.5 text-[12px] font-medium text-foreground-secondary hover:text-foreground hover:bg-background-tertiary transition-colors active:scale-[0.97] disabled:opacity-50"
              >
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            );
          })}
        </div>

        {/* ── Optional context (project/client) ── */}
        <button
          onClick={() => setShowContext(!showContext)}
          className="flex items-center gap-1 mt-3 px-1 text-[11px] font-medium text-foreground-muted hover:text-foreground-secondary transition-colors"
        >
          {showContext ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Añadir contexto (cliente, proyecto)
        </button>

        {showContext && (
          <div className="mt-2 space-y-2 px-1">
            <div className="flex flex-wrap gap-1.5">
              {selectedClientId && (
                <button
                  onClick={() => setSelectedClientId(null)}
                  className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium text-accent"
                >
                  {clients.find(c => c.id === selectedClientId)?.name || "Cliente"}
                  <span className="text-accent/60">×</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {clients.filter(c => c.id !== selectedClientId).slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground-secondary hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: getClientColor(c.name) }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Recents ── */}
        {recents.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider px-1 mb-2">
              Recientes
            </p>
            <div className="space-y-0.5">
              {recents.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleRecentSelect(item)}
                  disabled={loading}
                  className="flex items-center gap-3 w-full rounded-lg px-2.5 py-2.5 hover:bg-background-secondary transition-colors text-left active:scale-[0.98] disabled:opacity-50"
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: item.clientId
                        ? `${getClientColor(item.clientName || "")}20`
                        : "hsl(var(--muted))",
                    }}
                  >
                    {item.clientId ? (
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: getClientColor(item.clientName || "") }}
                      >
                        {(item.clientName || "?").slice(0, 2).toUpperCase()}
                      </span>
                    ) : (
                      <Briefcase className="h-3.5 w-3.5 text-foreground-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {item.taskTitle || item.description || "Sin descripción"}
                    </p>
                    {item.clientName && (
                      <p className="text-[11px] text-foreground-secondary truncate">
                        {item.clientName}
                      </p>
                    )}
                  </div>
                  <Clock className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
