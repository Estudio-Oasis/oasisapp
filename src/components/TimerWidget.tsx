import { useState } from "react";
import { useTimer } from "@/contexts/TimerContext";
import { formatElapsed } from "@/lib/timer-utils";
import { StartTimerModal } from "@/components/StartTimerModal";
import { Loader2, Zap } from "lucide-react";

export function TimerWidget() {
  const {
    isRunning,
    isStopping,
    activeClient,
    activeTask,
    elapsedSeconds,
    stopTimer,
  } = useTimer();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"start" | "switch">("start");

  const handleOpen = (mode: "start" | "switch") => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <>
      <div className="px-3 mt-auto mb-3">
        {!isRunning ? (
          /* Idle state */
          <button
            onClick={() => handleOpen("start")}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-background-secondary px-3 py-2.5 transition-colors hover:border-foreground hover:text-foreground group"
          >
            <Zap className="h-3.5 w-3.5 text-foreground-muted group-hover:text-foreground transition-colors" />
            <span className="text-small text-foreground-secondary group-hover:text-foreground transition-colors">
              Iniciar timer
            </span>
          </button>
        ) : (
          /* Running state */
          <div className="rounded-lg border border-accent bg-accent-light px-3 py-2.5 space-y-2">
            {/* Row 1: client + time */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                {activeClient?.name || "Cliente"}
              </span>
              <span className="text-small font-bold text-accent tabular-nums">
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            {/* Row 2: task */}
            <p
              className="text-micro text-foreground-secondary truncate !normal-case !tracking-normal !font-normal"
              style={{ fontSize: "11px" }}
            >
              {activeTask?.title || "Sin tarea"}
            </p>
            {/* Row 3: buttons */}
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
                    Saving
                  </span>
                ) : (
                  "Stop"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <StartTimerModal open={modalOpen} onOpenChange={setModalOpen} mode={modalMode} />
    </>
  );
}

