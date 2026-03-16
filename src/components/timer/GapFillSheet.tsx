import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBitacora } from "@/modules/bitacora/BitacoraContext";
import { formatTime, formatDuration } from "@/lib/timer-utils";
import { Video, Coffee, Utensils, Clock } from "lucide-react";
import type { GapInfo } from "@/modules/bitacora/types";

interface GapFillSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gap: GapInfo | null;
}

const QUICK_ACTIONS = [
  { key: "reunion", label: "Reunión", icon: Video },
  { key: "break", label: "Break", icon: Coffee },
  { key: "comida", label: "Comida", icon: Utensils },
];

export function GapFillSheet({ open, onOpenChange, gap }: GapFillSheetProps) {
  const bita = useBitacora();
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  if (!gap) return null;

  const handleSave = async (desc: string) => {
    if (saving || !desc.trim()) return;
    setSaving(true);
    try {
      await bita.fillGap({
        description: desc.trim(),
        startedAt: gap.startTime.toISOString(),
        endedAt: gap.endTime.toISOString(),
      });
      setDescription("");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAction = async (label: string) => {
    await handleSave(label);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6 pt-4">
        <SheetHeader className="text-left pb-3">
          <SheetTitle className="text-[15px] font-bold text-foreground">
            ¿Qué pasó aquí?
          </SheetTitle>
        </SheetHeader>

        {/* Gap info */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-background-secondary border border-border">
          <Clock className="h-4 w-4 text-foreground-muted shrink-0" />
          <span className="text-[13px] font-medium text-foreground tabular-nums">
            {formatTime(gap.startTime)} – {formatTime(gap.endTime)}
          </span>
          <span className="text-[11px] text-foreground-muted">
            · {formatDuration(gap.durationMin)}
          </span>
        </div>

        {/* Input */}
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave(description);
            }
          }}
          placeholder="Ej: almorcé, junta con el equipo…"
          className="w-full h-12 rounded-xl bg-background-secondary border border-border px-4 text-[14px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent/50 transition-colors mb-3"
          autoFocus
        />

        {/* Quick actions */}
        <div className="flex gap-2 mb-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => handleQuickAction(action.label)}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-[12px] font-medium text-foreground hover:bg-background-tertiary active:scale-[0.97] transition-all disabled:opacity-50"
              >
                <Icon className="h-3.5 w-3.5 text-foreground-muted" />
                {action.label}
              </button>
            );
          })}
        </div>

        {/* Save */}
        <button
          onClick={() => handleSave(description)}
          disabled={!description.trim() || saving}
          className="w-full h-11 rounded-xl bg-foreground text-background text-[13px] font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </SheetContent>
    </Sheet>
  );
}
