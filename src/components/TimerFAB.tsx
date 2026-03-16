import { useState } from "react";
import { useTimer } from "@/contexts/TimerContext";
import { formatElapsedShort, formatElapsed } from "@/lib/timer-utils";
import { StartTimerModal } from "@/components/StartTimerModal";
import { Loader2, Zap } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export function TimerFAB() {
  const {
    isRunning,
    isStopping,
    activeClient,
    activeTask,
    activeEntry,
    elapsedSeconds,
    stopTimer,
  } = useTimer();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"start" | "switch">("start");
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!isRunning) {
    return (
      <>
        <button
          onClick={() => {
            setModalMode("start");
            setModalOpen(true);
          }}
          className="fixed bottom-[76px] right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-foreground shadow-none md:hidden"
        >
          <Zap className="h-4 w-4 text-background" />
        </button>
        <StartTimerModal open={modalOpen} onOpenChange={setModalOpen} mode={modalMode} />
      </>
    );
  }

  return (
    <>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <button className="fixed bottom-[76px] right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-accent md:hidden">
            <span className="text-[10px] font-bold text-accent-foreground tabular-nums">
              {formatElapsedShort(elapsedSeconds)}
            </span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="px-6 pb-8">
          <div className="mx-auto mt-3 mb-6 h-1 w-8 rounded-full bg-border" />

          <div className="text-center space-y-2">
            <p className="text-h3 text-foreground">{activeClient?.name || activeEntry?.description || "Client"}</p>
            <p className="text-small text-foreground-secondary">
              {activeTask?.title || (activeClient ? "Sin tarea específica" : "")}
            </p>
            <p className="text-display text-accent tabular-nums pt-2">
              {formatElapsed(elapsedSeconds)}
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => {
                setDrawerOpen(false);
                setModalMode("switch");
                setModalOpen(true);
              }}
            >
              Cambiar tarea
            </Button>
            <Button
              variant="destructive"
              className="w-full h-11"
              disabled={isStopping}
              onClick={() => void stopTimer()}
            >
              {isStopping ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Detener timer"
              )}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <StartTimerModal open={modalOpen} onOpenChange={setModalOpen} mode={modalMode} />
    </>
  );
}
