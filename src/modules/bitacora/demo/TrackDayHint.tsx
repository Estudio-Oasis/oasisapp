import { useBitacoraVM } from "../BitacoraContext";
import { Zap } from "lucide-react";

/**
 * A strong contextual hint shown in track_day mode when the user has no entries yet.
 * Points directly at the launcher to drive first capture in < 3 seconds.
 */
export function TrackDayHint() {
  const vm = useBitacoraVM();
  if (vm.entries.length > 0 || vm.hasData) return null;

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 flex items-start gap-3">
      <div className="h-7 w-7 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
        <Zap className="h-3.5 w-3.5 text-accent" />
      </div>
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-foreground">
          ¿Qué estás haciendo ahora mismo?
        </p>
        <p className="text-[11px] text-foreground-muted leading-relaxed">
          Toca el launcher de arriba, escribe algo rápido (ej. "revisando correos") y listo.
          Después puedes agregar cliente, proyecto o tarea.
        </p>
      </div>
    </div>
  );
}
