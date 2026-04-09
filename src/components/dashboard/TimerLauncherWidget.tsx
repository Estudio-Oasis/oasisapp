import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { WidgetCard } from "@/components/ui/widget-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatElapsed, getClientColor } from "@/lib/timer-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Timer, Play, Search, Plus, Clock, ChevronDown, ChevronUp,
  Coffee, ArrowRightLeft, StickyNote, Lightbulb, X, Loader2,
} from "lucide-react";
import { QuickSheet } from "@/components/timer/QuickSheet";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

interface RecentTask {
  id: string;
  title: string;
  client_id: string | null;
  client_name: string | null;
  project_id: string | null;
}

type LauncherMode = null | "free" | "continue" | "search" | "create";

export function TimerLauncherWidget({ onIdea }: { onIdea?: (text: string) => void }) {
  const { user } = useAuth();
  const { isRunning, isStopping, activeEntry, activeClient, activeTask, elapsedSeconds, startTimer, stopTimer, switchTask, startBreakTimer } = useTimer();

  const [mode, setMode] = useState<LauncherMode>(null);
  const [switchSheetOpen, setSwitchSheetOpen] = useState(false);
  const [recents, setRecents] = useState<RecentTask[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClient, setFilterClient] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Note & Idea inputs for active state
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showIdea, setShowIdea] = useState(false);
  const [ideaText, setIdeaText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingIdea, setSavingIdea] = useState(false);

  // Load recents
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Recent distinct tasks from time_entries
      const { data: entries } = await supabase
        .from("time_entries")
        .select("task_id, description, client_id")
        .eq("user_id", user.id)
        .not("task_id", "is", null)
        .order("started_at", { ascending: false })
        .limit(40);

      const { data: clientList } = await supabase.from("clients").select("id, name").eq("status", "active");
      const cMap: Record<string, string> = {};
      (clientList || []).forEach((c: { id: string; name: string }) => { cMap[c.id] = c.name; });
      setClients(cMap);

      // Dedupe by task_id
      const seen = new Set<string>();
      const recent: RecentTask[] = [];
      for (const e of (entries || [])) {
        if (!e.task_id || seen.has(e.task_id)) continue;
        seen.add(e.task_id);
        recent.push({
          id: e.task_id,
          title: e.description || "Sin descripción",
          client_id: e.client_id,
          client_name: e.client_id ? cMap[e.client_id] || null : null,
          project_id: null,
        });
        if (recent.length >= 20) break;
      }

      // Enrich with task titles
      if (recent.length > 0) {
        const taskIds = recent.map(r => r.id);
        const { data: taskData } = await supabase.from("tasks").select("id, title, project_id").in("id", taskIds);
        const taskMap: Record<string, { title: string; project_id: string | null }> = {};
        (taskData || []).forEach((t: { id: string; title: string; project_id: string | null }) => {
          taskMap[t.id] = { title: t.title, project_id: t.project_id };
        });
        recent.forEach(r => {
          if (taskMap[r.id]) {
            r.title = taskMap[r.id].title;
            r.project_id = taskMap[r.id].project_id;
          }
        });
      }

      setRecents(recent);
    };
    load();
  }, [user?.id, isRunning]);

  const loadAllTasks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .in("status", ["todo", "in_progress", "backlog"])
      .order("updated_at", { ascending: false })
      .limit(100);
    setAllTasks((data || []) as Task[]);
  }, [user]);

  const filteredTasks = allTasks.filter(t => {
    if (filterClient && t.client_id !== filterClient) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleStartFree = async () => {
    await startTimer({ description: "Tarea libre" });
    setMode(null);
    toast.success("⏱ Timer iniciado — llénalo después");
  };

  const handleStartWithTask = async (task: RecentTask | Task) => {
    const clientId = task.client_id;
    const projectId = "project_id" in task ? task.project_id : null;
    if (isRunning) {
      await switchTask({ description: task.title, taskId: task.id, clientId, projectId });
    } else {
      await startTimer({ description: task.title, taskId: task.id, clientId, projectId });
    }
    await supabase.from("tasks").update({ status: "in_progress" as const }).eq("id", task.id);
    setMode(null);
    toast.success(`⏱ ${task.title}`);
  };

  const handleCreateAndStart = async () => {
    if (!newTaskTitle.trim() || !user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title: newTaskTitle.trim(), status: "in_progress" as const, assignee_id: user.id })
      .select("id, title, client_id, project_id")
      .single();
    if (error || !data) {
      toast.error("No se pudo crear la tarea");
      setCreating(false);
      return;
    }
    await startTimer({ description: data.title, taskId: data.id, clientId: data.client_id, projectId: data.project_id });
    setMode(null);
    setNewTaskTitle("");
    setCreating(false);
    toast.success(`⏱ Creada e iniciada: ${data.title}`);
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !activeEntry) return;
    setSavingNote(true);
    const current = activeEntry.description || "";
    const updated = current ? `${current}\n📝 ${noteText.trim()}` : `📝 ${noteText.trim()}`;
    const { error } = await supabase.from("time_entries").update({ description: updated }).eq("id", activeEntry.id);
    if (error) toast.error("No se pudo guardar la nota");
    else toast.success("📝 Nota guardada");
    setNoteText("");
    setShowNote(false);
    setSavingNote(false);
  };

  const handleSaveIdea = async () => {
    if (!ideaText.trim() || !user) return;
    setSavingIdea(true);
    const { error } = await supabase.from("tasks").insert({
      title: ideaText.trim(),
      status: "backlog" as const,
      description: "[idea]",
      assignee_id: user.id,
      client_id: activeEntry?.client_id || null,
    });
    if (error) toast.error("No se pudo guardar la idea");
    else {
      toast.success("💡 Idea guardada");
      onIdea?.(ideaText.trim());
    }
    setIdeaText("");
    setShowIdea(false);
    setSavingIdea(false);
  };

  // ── Active timer state ──
  if (isRunning && activeEntry) {
    return (
      <WidgetCard title="Bitácora" icon={Timer} accent="amber" glow>
        {/* Timer display */}
        <div className="text-center mb-4">
          <p className="text-3xl font-bold tabular-nums text-accent">{formatElapsed(elapsedSeconds)}</p>
          <p className="text-sm text-foreground mt-1 truncate">
            {activeEntry.description || activeTask?.title || "Registrando tiempo..."}
          </p>
          {activeClient && (
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getClientColor(activeClient.name) }} />
              <span className="text-xs text-foreground-secondary">{activeClient.name}</span>
            </div>
          )}
        </div>

        {/* 4 circular action buttons */}
        <div className="flex items-center justify-center gap-4 mb-3">
          {[
            { icon: Coffee, label: "Break", color: "text-foreground-secondary hover:text-accent hover:bg-accent/10", onClick: () => startBreakTimer("break") },
            { icon: ArrowRightLeft, label: "Cambiar", color: "text-foreground-secondary hover:text-accent hover:bg-accent/10", onClick: () => setSwitchSheetOpen(true) },
            { icon: StickyNote, label: "Nota", color: "text-foreground-secondary hover:text-accent hover:bg-accent/10", onClick: () => { setShowNote(!showNote); setShowIdea(false); } },
            { icon: Lightbulb, label: "Idea", color: "text-foreground-secondary hover:text-accent hover:bg-accent/10", onClick: () => { setShowIdea(!showIdea); setShowNote(false); } },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                btn.color
              )}
            >
              <div className="h-11 w-11 rounded-full border border-border bg-card flex items-center justify-center hover:border-accent/30 transition-all">
                <btn.icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] font-medium">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Note input */}
        {showNote && (
          <div className="flex gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <Input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(); if (e.key === "Escape") setShowNote(false); }}
              placeholder="Agregar nota... (@usuario para etiquetar)"
              className="h-8 text-xs"
              autoFocus
              disabled={savingNote}
            />
            <Button size="sm" onClick={handleSaveNote} disabled={!noteText.trim() || savingNote} className="h-8 px-3 text-xs">
              {savingNote ? "..." : "✓"}
            </Button>
          </div>
        )}

        {/* Idea input */}
        {showIdea && (
          <div className="flex gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <Input
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveIdea(); if (e.key === "Escape") setShowIdea(false); }}
              placeholder="¿Qué se te ocurrió?"
              className="h-8 text-xs"
              autoFocus
              disabled={savingIdea}
            />
            <Button size="sm" onClick={handleSaveIdea} disabled={!ideaText.trim() || savingIdea} className="h-8 px-3 text-xs">
              {savingIdea ? "..." : "💡"}
            </Button>
          </div>
        )}

        {/* Switch task — opens full QuickSheet for consistency */}
        <QuickSheet open={switchSheetOpen} onOpenChange={setSwitchSheetOpen} mode="switch" />

        {/* Stop button */}
        <div className="mt-3 pt-3 border-t border-border">
          <Button
            variant="destructive"
            className="w-full"
            onClick={stopTimer}
            disabled={isStopping}
          >
            {isStopping ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</> : "⏹ Detener registro"}
          </Button>
        </div>
      </WidgetCard>
    );
  }

  // ── Idle state ──
  return (
    <WidgetCard title="Bitácora" icon={Timer}>
      {mode === null ? (
        /* 4 launcher buttons */
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "free" as const, icon: Play, label: "Tarea libre", sub: "Llénala después" },
            { key: "continue" as const, icon: Clock, label: "Continuar con...", sub: "Últimas tareas" },
            { key: "search" as const, icon: Search, label: "Escoger tarea", sub: "Por cliente o proyecto" },
            { key: "create" as const, icon: Plus, label: "Crear tarea", sub: "Nueva tarea + timer" },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => {
                if (opt.key === "free") { handleStartFree(); return; }
                if (opt.key === "search") loadAllTasks();
                setMode(opt.key);
              }}
              className="flex flex-col items-center gap-1 p-4 rounded-xl border border-border/40 bg-card hover:border-accent/30 hover:bg-accent/5 transition-all group"
            >
              <div className="h-10 w-10 rounded-full border border-border/60 bg-background flex items-center justify-center group-hover:border-accent/40 transition-colors">
                <opt.icon className="h-4.5 w-4.5 text-foreground-secondary group-hover:text-accent transition-colors" />
              </div>
              <span className="text-xs font-semibold text-foreground">{opt.label}</span>
              <span className="text-[10px] text-foreground-muted leading-tight">{opt.sub}</span>
            </button>
          ))}
        </div>
      ) : mode === "continue" ? (
        /* Recent tasks list */
        <div className="animate-in fade-in-0 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Continuar con...</span>
            <button onClick={() => setMode(null)} className="text-foreground-muted hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {recents.length === 0 ? (
              <p className="text-sm text-foreground-muted text-center py-6">Sin tareas recientes</p>
            ) : recents.map(r => (
              <button
                key={r.id}
                onClick={() => handleStartWithTask(r)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-accent/5 border border-transparent hover:border-accent/20 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Play className="h-3 w-3 text-foreground-muted group-hover:text-accent transition-colors" />
                  <span className="text-sm font-medium text-foreground truncate">{r.title}</span>
                </div>
                {r.client_name && (
                  <div className="flex items-center gap-1.5 ml-5 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getClientColor(r.client_name) }} />
                    <span className="text-[10px] text-foreground-muted">{r.client_name}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : mode === "search" ? (
        /* Search/filter tasks */
        <div className="animate-in fade-in-0 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Escoger tarea</span>
            <button onClick={() => { setMode(null); setSearchQuery(""); setFilterClient(null); }} className="text-foreground-muted hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tarea..."
            className="h-8 text-xs mb-2"
            autoFocus
          />
          {/* Client filter chips */}
          <div className="flex flex-wrap gap-1 mb-2">
            <button
              onClick={() => setFilterClient(null)}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                !filterClient ? "bg-accent/10 border-accent/30 text-accent" : "border-border text-foreground-muted hover:border-accent/20"
              )}
            >
              Todos
            </button>
            {Object.entries(clients).slice(0, 6).map(([id, name]) => (
              <button
                key={id}
                onClick={() => setFilterClient(id === filterClient ? null : id)}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                  filterClient === id ? "bg-accent/10 border-accent/30 text-accent" : "border-border text-foreground-muted hover:border-accent/20"
                )}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="max-h-[250px] overflow-y-auto space-y-1">
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-foreground-muted text-center py-4">Sin resultados</p>
            ) : filteredTasks.map(t => (
              <button
                key={t.id}
                onClick={() => handleStartWithTask(t)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-accent/5 border border-transparent hover:border-accent/20 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Play className="h-3 w-3 text-foreground-muted group-hover:text-accent transition-colors" />
                  <span className="text-sm font-medium text-foreground truncate">{t.title}</span>
                </div>
                {t.client_id && clients[t.client_id] && (
                  <span className="text-[10px] text-foreground-muted ml-5">{clients[t.client_id]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : mode === "create" ? (
        /* Create task */
        <div className="animate-in fade-in-0 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Crear tarea + iniciar</span>
            <button onClick={() => { setMode(null); setNewTaskTitle(""); }} className="text-foreground-muted hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex gap-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateAndStart(); }}
              placeholder="Nombre de la tarea..."
              className="h-9 text-sm"
              autoFocus
              disabled={creating}
            />
            <Button onClick={handleCreateAndStart} disabled={!newTaskTitle.trim() || creating} className="h-9 px-4 text-sm">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-3.5 w-3.5 mr-1" /> Iniciar</>}
            </Button>
          </div>
        </div>
      ) : null}
    </WidgetCard>
  );
}
