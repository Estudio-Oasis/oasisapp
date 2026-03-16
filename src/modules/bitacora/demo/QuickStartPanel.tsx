import { useState, useRef, useEffect } from "react";
import { useBitacora } from "../BitacoraContext";
import {
  Play,
  Video,
  Coffee,
  Utensils,
  ListChecks,
  Mic,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface QuickButton {
  key: string;
  label: string;
  icon: React.ElementType;
  desc: string;
}

const QUICK_BUTTONS: QuickButton[] = [
  { key: "reunion", label: "Reunión", icon: Video, desc: "Junta / llamada" },
  { key: "break", label: "Break", icon: Coffee, desc: "Descanso rápido" },
  { key: "comida", label: "Comida", icon: Utensils, desc: "Hora de comer" },
  { key: "pendientes", label: "Pendientes", icon: ListChecks, desc: "Revisar tareas" },
];

/**
 * Central "control panel" for track_day mode — big, tactile, mobile-first.
 * Replaces the auto-open QuickSheet as the primary entry point.
 */
export function QuickStartPanel() {
  const bita = useBitacora();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await bita.startActivity({ description: text.trim() || null });
      setText("");
    } catch {
      toast.error("No se pudo iniciar");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (key: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await bita.startQuickAction(key);
    } catch {
      toast.error("No se pudo iniciar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Hero input */}
      <div className="p-4 pb-3 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-lg bg-accent/15 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-[13px] font-semibold text-foreground">
            ¿Qué estás haciendo?
          </span>
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleStart();
              }
            }}
            placeholder="Ej: revisando correos, diseñando logo…"
            className="w-full h-14 rounded-xl bg-background-secondary border border-border px-4 pr-14 text-[15px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent/50 transition-colors"
            disabled={loading}
          />
          <button
            onClick={handleStart}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            <Play className="h-5 w-5 ml-0.5" />
          </button>
        </div>

        {/* Removed "Empezar ahora" button — play inside input is the single primary action */}
      </div>

      {/* Quick action grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {QUICK_BUTTONS.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.key}
                onClick={() => handleQuickAction(btn.key)}
                disabled={loading}
                className="flex items-center gap-3 rounded-xl bg-background-secondary border border-border p-3 hover:bg-background-tertiary active:scale-[0.97] transition-all disabled:opacity-50 text-left"
              >
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">{btn.label}</p>
                  <p className="text-[10px] text-foreground-muted">{btn.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
