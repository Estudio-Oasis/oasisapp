import { useState } from "react";
import { useTimer } from "@/contexts/TimerContext";
import { useLocation } from "react-router-dom";
import { formatElapsed } from "@/lib/timer-utils";
import { QuickSheet } from "@/components/timer/QuickSheet";
import { Loader2 } from "lucide-react";

export function TimerWidget() {
  const {
    isRunning,
    isStopping,
    activeClient,
    activeTask,
    activeEntry,
    elapsedSeconds,
    stopTimer,
  } = useTimer();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"start" | "switch">("start");

  const isBitacora = location.pathname === "/bitacora";

  const handleOpen = (mode: "start" | "switch") => {
    setModalMode(mode);
    setModalOpen(true);
  };

  // On /bitacora, hide the idle widget — the page has its own launcher
  // But still show running state so users can control timer from sidebar
  if (isBitacora && !isRunning) {
    return null;
  }

  return (
    <>
      <div className="px-3 mt-auto mb-3">
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
          /* Running state */
          <div className="rounded-lg border border-accent bg-accent-light px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                {activeClient?.name || activeEntry?.description || "Cliente"}
              </span>
              <span className="text-small font-bold text-accent tabular-nums">
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <p
              className="text-micro text-foreground-secondary truncate !normal-case !tracking-normal !font-normal"
              style={{ fontSize: "11px" }}
            >
              {activeTask?.title || (activeClient ? "Sin tarea" : "")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleOpen("switch")}
                className="flex-1 h-7 rounded-md border border-border bg-background text-xs font-semibold text-foreground hover:bg-background-tertiary transition-colors"
              >
                Cambiar
              </button>
              <button
                onClick={() => void stopTimer()}
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
    </>
  );
}
