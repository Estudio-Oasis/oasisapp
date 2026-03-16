import { useBitacoraVM } from "../BitacoraContext";
import { Sparkles } from "lucide-react";

/**
 * A small contextual hint shown in track_day mode when the user has no entries yet.
 */
export function TrackDayHint() {
  const vm = useBitacoraVM();
  if (vm.entries.length > 0 || vm.hasData) return null;

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 flex items-start gap-3">
      <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <p className="text-[12px] font-medium text-foreground">
          Empieza registrando lo primero que estás haciendo
        </p>
        <p className="text-[10px] text-foreground-muted">
          Escribe en el launcher arriba y empieza tu timer. Después puedes agregar contexto.
        </p>
      </div>
    </div>
  );
}
