import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBitacora } from "@/modules/bitacora/BitacoraContext";
import { Trash2 } from "lucide-react";
import type { EntryInfo } from "@/modules/bitacora/types";

interface EntryEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: EntryInfo | null;
}

function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fromTimeInput(timeStr: string, referenceDate: Date): string {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(referenceDate);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function EntryEditSheet({ open, onOpenChange, entry }: EntryEditSheetProps) {
  const bita = useBitacora();
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setDescription(entry.description || "");
      setStartTime(toTimeInput(entry.started_at));
      setEndTime(entry.ended_at ? toTimeInput(entry.ended_at) : "");
    }
  }, [entry]);

  if (!entry) return null;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const refDate = new Date(entry.started_at);
      await bita.updateEntry(entry.id, {
        description: description.trim() || undefined,
        started_at: fromTimeInput(startTime, refDate),
        ended_at: endTime ? fromTimeInput(endTime, refDate) : undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await bita.deleteEntry(entry.id);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6 pt-4">
        <SheetHeader className="text-left pb-3">
          <SheetTitle className="text-[15px] font-bold text-foreground">
            Editar registro
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          {/* Description */}
          <div>
            <label className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider block mb-1">
              Descripción
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué hiciste?"
              className="w-full h-11 rounded-xl bg-background-secondary border border-border px-3 text-[14px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent/50 transition-colors"
              autoFocus
            />
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider block mb-1">
                Inicio
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-11 rounded-xl bg-background-secondary border border-border px-3 text-[14px] text-foreground tabular-nums focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider block mb-1">
                Fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-11 rounded-xl bg-background-secondary border border-border px-3 text-[14px] text-foreground tabular-nums focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 rounded-xl bg-foreground text-background text-[13px] font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="h-11 w-11 rounded-xl border border-destructive/30 text-destructive flex items-center justify-center hover:bg-destructive/10 active:scale-[0.97] transition-all disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
