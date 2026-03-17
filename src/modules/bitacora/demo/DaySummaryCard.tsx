import { useState, useEffect } from "react";
import { useBitacoraVM } from "../BitacoraContext";
import { Sparkles, Check, Pencil } from "lucide-react";
import { formatDuration } from "@/lib/timer-utils";

interface CategoryGuess {
  label: string;
  emoji: string;
  count: number;
  minutes: number;
}

function categorizeEntries(entries: { description: string | null; duration_min: number | null }[]): CategoryGuess[] {
  const cats: Record<string, CategoryGuess> = {};
  
  const classify = (desc: string): { label: string; emoji: string } => {
    const d = desc.toLowerCase();
    if (d.includes("reunión") || d.includes("reunion") || d.includes("llamada") || d.includes("call") || d.includes("meeting") || d.includes("seguimiento"))
      return { label: "Reuniones", emoji: "📞" };
    if (d.includes("break") || d.includes("descanso") || d.includes("café") || d.includes("coffee") || d.includes("☕"))
      return { label: "Pausas", emoji: "☕" };
    if (d.includes("comida") || d.includes("almuerzo") || d.includes("lunch") || d.includes("🍽"))
      return { label: "Comida", emoji: "🍽️" };
    if (d.includes("correo") || d.includes("email") || d.includes("slack") || d.includes("inbox"))
      return { label: "Comunicación", emoji: "💬" };
    if (d.includes("pendiente") || d.includes("revisión") || d.includes("review") || d.includes("cierre"))
      return { label: "Organización", emoji: "📋" };
    return { label: "Trabajo", emoji: "💻" };
  };

  for (const entry of entries) {
    const { label, emoji } = classify(entry.description || "sin descripción");
    if (!cats[label]) cats[label] = { label, emoji, count: 0, minutes: 0 };
    cats[label].count += 1;
    cats[label].minutes += Number(entry.duration_min) || 0;
  }

  return Object.values(cats).sort((a, b) => b.minutes - a.minutes);
}

export function DaySummaryCard() {
  const vm = useBitacoraVM();
  const [accepted, setAccepted] = useState(false);

  // Only show after 2+ entries
  if (vm.entries.length < 2) return null;

  const categories = categorizeEntries(vm.entries);
  const blockCount = vm.entries.length;

  if (accepted) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-center space-y-1">
        <Check className="h-5 w-5 text-green-500 mx-auto" />
        <p className="text-[12px] font-medium text-green-600">
          Resumen aceptado
        </p>
        <p className="text-[10px] text-foreground-muted">
          {blockCount} bloques · {formatDuration(vm.totalMinutes)} registradas
        </p>
      </div>
    );
  }

  // Edit hint: shown briefly after user taps "Editar", then auto-hides
  if (editHintVisible) {
    return (
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-center space-y-1 animate-in fade-in duration-300">
        <Pencil className="h-4 w-4 text-accent mx-auto" />
        <p className="text-[12px] font-medium text-foreground">
          Toca cualquier bloque para editarlo
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-accent/20 bg-accent/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-accent/10">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-[13px] font-semibold text-foreground">
          Así entendí tu día
        </span>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-[12px] text-foreground-secondary">
          Hoy tuviste <strong>{blockCount} bloques</strong> de actividad con{" "}
          <strong>{formatDuration(vm.totalMinutes)}</strong> registradas.
        </p>

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <span
              key={cat.label}
              className="inline-flex items-center gap-1 text-[11px] font-medium bg-background rounded-full px-2.5 py-1 border border-border"
            >
              <span>{cat.emoji}</span>
              <span className="text-foreground">{cat.label}</span>
              <span className="text-foreground-muted">
                {cat.count}× · {formatDuration(cat.minutes)}
              </span>
            </span>
          ))}
        </div>

        {/* Per-entry breakdown */}
        <div className="space-y-1">
          {vm.entries.slice(0, 6).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between text-[11px]">
              <span className="text-foreground truncate max-w-[70%]">
                {entry.description || "Sin descripción"}
              </span>
              <span className="text-foreground-muted tabular-nums">
                {entry.duration_min ? formatDuration(entry.duration_min) : "—"}
              </span>
            </div>
          ))}
          {vm.entries.length > 6 && (
            <p className="text-[10px] text-foreground-muted">
              +{vm.entries.length - 6} bloques más
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-accent/10 flex items-center gap-2">
        <button
          onClick={() => setAccepted(true)}
          className="h-8 px-4 rounded-full bg-foreground text-background text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <Check className="h-3 w-3" />
          Aceptar
        </button>
        <button
          onClick={() => setEditHintVisible(true)}
          className="h-8 px-4 rounded-full border border-border text-[12px] font-medium text-foreground-secondary flex items-center gap-1.5 hover:bg-background-tertiary transition-colors"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
      </div>
    </div>
  );
}
