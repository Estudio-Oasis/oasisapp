import { useState, useRef, useEffect, useCallback } from "react";
import { useBitacora } from "./BitacoraContext";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Play,
  Clock,
  Video,
  Coffee,
  Utensils,
  ListTodo,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getClientColor } from "@/lib/timer-utils";
import { getNormalizedActivityType, getActivityConfig } from "@/components/timer/ActivityConstants";
import { toast } from "sonner";

interface QuickAction {
  key: string;
  label: string;
  icon: React.ElementType;
  isBreak: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: "reunion", label: "Reunión", icon: Video, isBreak: false },
  { key: "break", label: "Descanso", icon: Coffee, isBreak: true },
  { key: "comida", label: "Comida", icon: Utensils, isBreak: true },
  { key: "pendientes", label: "Pendientes", icon: ListTodo, isBreak: false },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "start" | "switch";
}

/**
 * QuickSheet that reads from the abstract BitacoraContext.
 * Works identically in OasisOS and standalone.
 */
export function BitacoraQuickSheet({ open, onOpenChange, mode = "start" }: Props) {
  const bita = useBitacora();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText("");
      setShowContext(false);
      setSelectedClientId(null);
      setSelectedProjectId(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleStart = useCallback(
    async (
      desc?: string | null,
      clientId?: string | null,
      taskId?: string | null,
      projectId?: string | null
    ) => {
      setLoading(true);
      try {
        const input = {
          description: desc || null,
          clientId: clientId || null,
          taskId: taskId || null,
          projectId: projectId || null,
        };
        const fn = mode === "switch" ? bita.switchActivity : bita.startActivity;
        await fn(input);
        onOpenChange(false);
      } catch {
        toast.error("No se pudo iniciar. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    [mode, bita, onOpenChange]
  );

  const handleQuickAction = useCallback(
    async (action: QuickAction) => {
      setLoading(true);
      try {
        await bita.startQuickAction(action.key);
        onOpenChange(false);
      } catch {
        toast.error("No se pudo iniciar.");
      } finally {
        setLoading(false);
      }
    },
    [bita, onOpenChange]
  );

  const handleSubmit = useCallback(() => {
    handleStart(text.trim() || null, selectedClientId, null, selectedProjectId);
  }, [text, selectedClientId, selectedProjectId, handleStart]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = bita.projects.find((p) => p.id === projectId);
    if (project) setSelectedClientId(project.clientId);
  };

  const { projects, clients, recents } = bita;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 pb-6 pt-3 max-h-[85dvh] overflow-y-auto border-t border-border"
      >
        <SheetTitle className="sr-only">
          {mode === "switch" ? "Cambiar actividad" : "Iniciar actividad"}
        </SheetTitle>

        <div className="flex justify-center mb-3">
          <div className="h-1 w-10 rounded-full bg-foreground/15" />
        </div>

        {/* Input */}
        <div className="relative">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe o dicta lo que estás haciendo…"
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

        {/* Quick Actions */}
        <div className="flex gap-1.5 mt-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => handleQuickAction(action)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-background-secondary py-2.5 text-[11px] font-medium text-foreground-secondary hover:text-foreground hover:bg-background-tertiary transition-colors active:scale-[0.97] disabled:opacity-50"
              >
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            );
          })}
        </div>

        {/* Optional context */}
        {(projects.length > 0 || clients.length > 0) && (
          <>
            <button
              onClick={() => setShowContext(!showContext)}
              className="flex items-center gap-1 mt-3 px-1 text-[11px] font-medium text-foreground-muted hover:text-foreground-secondary transition-colors"
            >
              {showContext ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              Añadir detalles
              {(selectedProjectId || selectedClientId) && (
                <span className="text-accent ml-1">·</span>
              )}
              {selectedProjectId && (
                <span className="text-accent text-[10px]">
                  {projects.find((p) => p.id === selectedProjectId)?.name}
                </span>
              )}
            </button>

            {showContext && (
              <div className="mt-2 space-y-3 px-1">
                {projects.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-1.5">
                      Proyecto
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {projects.slice(0, 8).map((p) => (
                        <button
                          key={p.id}
                          onClick={() =>
                            selectedProjectId === p.id
                              ? (setSelectedProjectId(null), setSelectedClientId(null))
                              : handleProjectSelect(p.id)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            selectedProjectId === p.id
                              ? "border-accent bg-accent/15 text-accent"
                              : "border-border text-foreground-secondary hover:text-foreground hover:border-foreground/30"
                          }`}
                        >
                          {p.name}
                          {selectedProjectId === p.id && (
                            <span className="text-accent/60">×</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-1.5">
                    Cliente
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {clients.slice(0, 6).map((c) => (
                      <button
                        key={c.id}
                        onClick={() =>
                          setSelectedClientId(selectedClientId === c.id ? null : c.id)
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          selectedClientId === c.id
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-border text-foreground-secondary hover:text-foreground hover:border-foreground/30"
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: getClientColor(c.name) }}
                        />
                        {c.name}
                        {selectedClientId === c.id && (
                          <span className="text-accent/60 ml-0.5">×</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Recents */}
        {recents.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider px-1 mb-2">
              Recientes
            </p>
            <div className="space-y-0.5">
              {recents.map((item) => {
                const actType = getNormalizedActivityType({
                  description: item.description,
                  client_id: item.clientId,
                });
                const config = getActivityConfig(actType);
                const Icon = config.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleStart(
                        item.description,
                        item.clientId,
                        item.taskId,
                        item.projectId
                      )
                    }
                    disabled={loading}
                    className="flex items-center gap-3 w-full rounded-lg px-2.5 py-2.5 hover:bg-background-secondary transition-colors text-left active:scale-[0.98] disabled:opacity-50"
                  >
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: item.clientId
                          ? `${getClientColor(item.clientName || "")}20`
                          : `${config.color}20`,
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
                        <Icon
                          className="h-3.5 w-3.5"
                          style={{ color: config.color }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {item.taskTitle || item.description || config.label}
                      </p>
                      {(item.clientName || item.description) && (
                        <p className="text-[11px] text-foreground-secondary truncate">
                          {item.clientName || item.description}
                        </p>
                      )}
                    </div>
                    <Clock className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
