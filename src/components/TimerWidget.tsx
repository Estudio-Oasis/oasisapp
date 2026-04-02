import { useState, useEffect, useRef, useCallback } from "react";
import { useTimer } from "@/contexts/TimerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { formatElapsed, getClientColor } from "@/lib/timer-utils";
import { QuickSheet } from "@/components/timer/QuickSheet";
import { InlineEditableText } from "@/components/ui/inline-editable-text";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  ChevronUp,
  X,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import {
  getNormalizedActivityType,
  getActivityConfig,
} from "@/components/timer/ActivityConstants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function TimerWidget() {
  const {
    isRunning,
    isStopping,
    activeClient,
    activeTask,
    activeEntry,
    elapsedSeconds,
    stopTimer,
    updateActiveEntry,
  } = useTimer();
  const { user } = useAuth();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"start" | "switch">("start");
  const [expanded, setExpanded] = useState(false);
  const [quickNote, setQuickNote] = useState("");
  const [ideaText, setIdeaText] = useState("");
  const [showIdeaInput, setShowIdeaInput] = useState(false);
  const [savingIdea, setSavingIdea] = useState(false);
  const [taskCompletionDialog, setTaskCompletionDialog] = useState<{ taskId: string; taskTitle: string } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const noteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isBitacora = location.pathname === "/bitacora";

  const handleOpen = (mode: "start" | "switch") => {
    setModalMode(mode);
    setModalOpen(true);
  };

  // Close expanded panel on click outside
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  // Keyboard shortcut: Cmd+I / Ctrl+I
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || (active as HTMLElement).isContentEditable)) return;
        e.preventDefault();
        if (isRunning) {
          setExpanded(true);
          setTimeout(() => setShowIdeaInput(true), 100);
        } else {
          handleOpen("start");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isRunning]);

  const handleDescriptionSave = useCallback(async (newDesc: string) => {
    if (activeEntry) {
      await updateActiveEntry({ description: newDesc });
    }
  }, [activeEntry, updateActiveEntry]);

  const handleNoteSave = useCallback((value: string) => {
    setQuickNote(value);
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
  }, []);

  const handleStopTimer = useCallback(async () => {
    const taskId = activeEntry?.task_id;
    const taskTitle = activeTask?.title;
    await stopTimer();
    if (taskId && taskTitle) {
      setTaskCompletionDialog({ taskId, taskTitle });
    }
  }, [activeEntry, activeTask, stopTimer]);

  const handleTaskComplete = async (completed: boolean) => {
    if (!taskCompletionDialog) return;
    if (completed) {
      await supabase.from("tasks").update({ status: "done" as const }).eq("id", taskCompletionDialog.taskId);
      toast.success("✅ Tarea marcada como completada");
    }
    setTaskCompletionDialog(null);
  };

  const handleSaveIdea = async () => {
    if (!ideaText.trim() || !user) return;
    setSavingIdea(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        title: ideaText.trim(),
        status: "todo",
        client_id: activeEntry?.client_id || null,
        project_id: activeEntry?.project_id || null,
        assignee_id: user.id,
      });
      if (error) throw error;
      toast.success("💡 Idea guardada en tareas");
      setIdeaText("");
      setShowIdeaInput(false);
    } catch {
      toast.error("No se pudo guardar la idea");
    } finally {
      setSavingIdea(false);
    }
  };

  if (isBitacora && !isRunning) return null;

  const actType = isRunning ? getNormalizedActivityType({ description: activeEntry?.description, client_id: activeEntry?.client_id }) : null;
  const actConfig = actType ? getActivityConfig(actType) : null;

  return (
    <>
      <div className="px-3 mt-auto mb-3 relative" ref={panelRef}>
        {/* Expanded panel */}
        {expanded && isRunning && (
          <div className="absolute bottom-full left-3 right-3 mb-1 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: actConfig?.color }} />
                  <span className="text-[10px] text-accent uppercase tracking-wider font-semibold">En curso</span>
                </div>
                <button onClick={() => setExpanded(false)} className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-background-secondary text-foreground-muted">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Timer */}
              <p className="text-xl font-bold text-accent tabular-nums">{formatElapsed(elapsedSeconds)}</p>

              {/* Editable description */}
              <div>
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Descripción</p>
                <InlineEditableText
                  value={activeEntry?.description || ""}
                  onSave={handleDescriptionSave}
                  placeholder="Añadir descripción..."
                  className="text-sm text-foreground"
                  inputClassName="text-sm"
                />
              </div>

              {/* Client & Type chips */}
              <div className="flex flex-wrap gap-1.5">
                {activeClient && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground-secondary">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getClientColor(activeClient.name) }} />
                    {activeClient.name}
                  </span>
                )}
                {activeTask && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground-secondary">
                    {activeTask.title}
                  </span>
                )}
                {actConfig && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground-secondary">
                    {actConfig.label}
                  </span>
                )}
              </div>

              {/* Quick idea capture */}
              {!showIdeaInput ? (
                <button
                  onClick={() => setShowIdeaInput(true)}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Anotar idea
                </button>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={ideaText}
                      onChange={(e) => setIdeaText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveIdea(); if (e.key === "Escape") { setShowIdeaInput(false); setIdeaText(""); } }}
                      placeholder="¿Qué se te ocurrió?"
                      className="flex-1 h-8 rounded-md border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-accent"
                      autoFocus
                      disabled={savingIdea}
                    />
                    <button
                      onClick={handleSaveIdea}
                      disabled={!ideaText.trim() || savingIdea}
                      className="h-8 px-3 rounded-md bg-accent text-accent-foreground text-[11px] font-semibold hover:bg-accent/90 disabled:opacity-40 transition-colors"
                    >
                      {savingIdea ? "…" : "Guardar"}
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1 border-t border-border">
                <button
                  onClick={() => { setExpanded(false); handleOpen("switch"); }}
                  className="flex-1 h-8 rounded-md border border-border bg-background text-xs font-semibold text-foreground hover:bg-background-tertiary transition-colors"
                >
                  Cambiar
                </button>
                <button
                  onClick={() => { setExpanded(false); void handleStopTimer(); }}
                  disabled={isStopping}
                  className="flex-1 h-8 rounded-md bg-destructive text-xs font-semibold text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-70"
                >
                  {isStopping ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Guardando
                    </span>
                  ) : "Finalizar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!isRunning ? (
          /* Idle state — only shown when NOT on /bitacora */
          <button
            onClick={() => handleOpen("start")}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-background-secondary px-3 py-2.5 transition-colors hover:border-foreground hover:text-foreground group"
          >
            <span className="text-small text-foreground-secondary group-hover:text-foreground transition-colors">
              Iniciar timer
            </span>
          </button>
        ) : (
          /* Running state — clickable to expand */
          <div className="rounded-lg border border-accent bg-accent-light px-3 py-2.5 space-y-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2 w-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: actConfig?.color }} />
                <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                  {activeClient?.name || activeEntry?.description || "Cliente"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-small font-bold text-accent tabular-nums">
                  {formatElapsed(elapsedSeconds)}
                </span>
                <ChevronUp className={`h-3 w-3 text-foreground-muted transition-transform duration-200 ${expanded ? "" : "rotate-180"}`} />
              </div>
            </button>
            {activeTask && (
              <p className="text-[11px] text-foreground-secondary truncate" style={{ lineHeight: "1.4" }}>
                {activeTask.title}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => handleOpen("switch")}
                className="flex-1 h-7 rounded-md border border-border bg-background text-xs font-semibold text-foreground hover:bg-background-tertiary transition-colors"
              >
                Cambiar
              </button>
              <button
                onClick={() => void handleStopTimer()}
                disabled={isStopping}
                className="flex-1 h-7 rounded-md bg-destructive text-xs font-semibold text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isStopping ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Guardando
                  </span>
                ) : (
                  "Detener"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <QuickSheet open={modalOpen} onOpenChange={setModalOpen} mode={modalMode} />

      {/* Task completion dialog */}
      <Dialog open={!!taskCompletionDialog} onOpenChange={(open) => { if (!open) setTaskCompletionDialog(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Completaste esta tarea?</DialogTitle>
            <DialogDescription>
              "{taskCompletionDialog?.taskTitle}"
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleTaskComplete(false)}>
              No, sigue en progreso
            </Button>
            <Button variant="default" onClick={() => handleTaskComplete(true)}>
              Sí, completada ✅
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
