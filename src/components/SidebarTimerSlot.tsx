import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useTimer } from "@/contexts/TimerContext";
import { formatElapsed, getClientColor } from "@/lib/timer-utils";
import { getNormalizedActivityType, getActivityConfig } from "@/components/timer/ActivityConstants";
import { QuickSheet } from "@/components/timer/QuickSheet";
import { Loader2, Square, ArrowRightLeft, ChevronUp, X, Zap } from "lucide-react";
import { InlineEditableText } from "@/components/ui/inline-editable-text";

/**
 * SidebarTimerSlot — bold v2 unified launcher in the sidebar.
 * Idle: a single hero CTA with the same Zap/amber identity as the new
 * TimerLauncherWidget. Running: compact "now playing" card with the
 * Apple-style circular controls (Cambiar / Detener) and an expandable
 * detail panel that uses the same QuickSheet for switch flows.
 */
export function SidebarTimerSlot() {
  const {
    isRunning, isStopping, activeClient, activeTask, activeEntry,
    elapsedSeconds, stopTimer, updateActiveEntry,
  } = useTimer();
  const location = useLocation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"start" | "switch">("start");
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Hide on /bitacora — that page already owns the launcher.
  const isBitacora = location.pathname === "/bitacora";

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setExpanded(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  if (isBitacora) return null;

  const open = (mode: "start" | "switch") => { setSheetMode(mode); setSheetOpen(true); };

  const actType = isRunning
    ? getNormalizedActivityType({ description: activeEntry?.description, client_id: activeEntry?.client_id })
    : null;
  const actConfig = actType ? getActivityConfig(actType) : null;

  return (
    <>
      <div className="px-3 mt-auto mb-3 relative" ref={panelRef}>
        {/* Expanded panel for running state */}
        {expanded && isRunning && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: actConfig?.color }} />
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-accent">En curso</span>
                </div>
                <button onClick={() => setExpanded(false)} className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-background-secondary text-foreground-muted">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-2xl font-bold text-accent tabular-nums leading-none">{formatElapsed(elapsedSeconds)}</p>
              <InlineEditableText
                value={activeEntry?.description || ""}
                onSave={async (v) => { if (activeEntry) await updateActiveEntry({ description: v }); }}
                placeholder="¿Cómo llamas a esto?"
                className="text-sm text-foreground"
                inputClassName="text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {activeClient && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground-secondary">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getClientColor(activeClient.name) }} />
                    {activeClient.name}
                  </span>
                )}
                {activeTask && (
                  <span className="inline-flex items-center rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground-secondary">
                    {activeTask.title}
                  </span>
                )}
                {actConfig && (
                  <span className="inline-flex items-center rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground-secondary">
                    {actConfig.label}
                  </span>
                )}
              </div>
              <div className="flex gap-2 pt-1 border-t border-border">
                <button
                  onClick={() => { setExpanded(false); open("switch"); }}
                  className="flex-1 h-8 rounded-md border border-border bg-background text-xs font-semibold text-foreground hover:bg-background-tertiary transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <ArrowRightLeft className="h-3 w-3" /> Cambiar
                </button>
                <button
                  onClick={() => { setExpanded(false); void stopTimer(); }}
                  disabled={isStopping}
                  className="flex-1 h-8 rounded-md bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-70 inline-flex items-center justify-center gap-1.5"
                >
                  {isStopping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />}
                  Detener registro
                </button>
              </div>
              <Link to="/bitacora" className="block text-center text-[11px] text-foreground-muted hover:text-foreground underline-offset-2 hover:underline">
                Abrir Bitácora →
              </Link>
            </div>
          </div>
        )}

        {!isRunning ? (
          /* Bold idle CTA — matches new launcher identity */
          <button
            onClick={() => open("start")}
            data-tour="start-timer-btn"
            className="group relative w-full overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/8 to-transparent px-3 py-3 text-left transition-all hover:border-accent/60 hover:from-accent/25"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm shrink-0">
                <Zap className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight">Empezar a registrar</p>
                <p className="text-[10px] text-foreground-muted leading-tight mt-0.5">⌘K · tarea, reunión o pausa</p>
              </div>
            </div>
          </button>
        ) : (
          /* Running compact card */
          <div className="rounded-xl border border-accent bg-accent-light overflow-hidden">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2 w-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: actConfig?.color }} />
                <span className="text-xs font-semibold text-foreground truncate max-w-[110px]">
                  {activeClient?.name || activeEntry?.description || "Registro activo"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-accent tabular-nums">{formatElapsed(elapsedSeconds)}</span>
                <ChevronUp className={`h-3 w-3 text-foreground-muted transition-transform ${expanded ? "" : "rotate-180"}`} />
              </div>
            </button>
            <div className="flex items-center gap-1 border-t border-accent/30 bg-card/60 px-2 py-1.5">
              <button
                onClick={() => open("switch")}
                className="flex-1 h-7 rounded-md text-[11px] font-semibold text-foreground-secondary hover:bg-background-tertiary inline-flex items-center justify-center gap-1"
                title="Cambiar actividad"
              >
                <ArrowRightLeft className="h-3 w-3" /> Cambiar
              </button>
              <button
                onClick={() => void stopTimer()}
                disabled={isStopping}
                className="flex-1 h-7 rounded-md bg-primary text-[11px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-70 inline-flex items-center justify-center gap-1"
              >
                {isStopping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />} Detener
              </button>
            </div>
          </div>
        )}
      </div>

      <QuickSheet open={sheetOpen} onOpenChange={setSheetOpen} mode={sheetMode} />
    </>
  );
}
