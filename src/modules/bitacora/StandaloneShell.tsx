import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LocalBitacoraProvider } from "./LocalBitacoraProvider";
import { BitacoraCore } from "./BitacoraCore";
import { useBitacoraVM } from "./BitacoraContext";
import { ArrowRight, ArrowLeft, RotateCcw, Sparkles, ListChecks, Compass } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TodoPanel } from "./demo/TodoPanel";
import { DaySummaryCard } from "./demo/DaySummaryCard";
import { TrackDayHint } from "./demo/TrackDayHint";
import { generateExploreEntries } from "./demo/mockExploreData";
import type { DemoMode } from "./demo/types";
import { LS_DEMO_MODE, LS_DEMO_TODOS } from "./demo/types";

const LS_ONBOARDED = "bitacora_demo_onboarded";
const LS_KEYS_TO_CLEAR = [
  "bitacora_demo_onboarded",
  "bitacora_local_entries",
  "bitacora_local_active",
  "bitacora_local_recents",
  LS_DEMO_MODE,
  LS_DEMO_TODOS,
];

/* ── Mini onboarding ── */
function MiniOnboarding({ onComplete }: { onComplete: (mode: DemoMode) => void }) {
  const navigate = useNavigate();
  const options: { key: DemoMode; label: string; icon: typeof Sparkles; desc: string }[] = [
    { key: "track_day", label: "Registrar mi día", icon: Sparkles, desc: "Captura en qué trabajas y ve tu timeline" },
    { key: "plan_tasks", label: "Organizar pendientes", icon: ListChecks, desc: "Lista tus pendientes y empieza uno" },
    { key: "explore", label: "Solo explorar", icon: Compass, desc: "Ve un día de ejemplo ya lleno" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-[12px] text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Oasis
        </button>

        <div className="text-center space-y-2">
          <div className="h-10 w-10 rounded-xl bg-foreground flex items-center justify-center mx-auto">
            <span className="text-[9px] font-bold tracking-widest text-background">OS</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Bitácora</h1>
          <p className="text-sm text-foreground-secondary">
            ¿Cómo quieres probar Bitácora hoy?
          </p>
        </div>

        <div className="space-y-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                onClick={() => onComplete(opt.key)}
                className="flex items-center gap-3 w-full rounded-xl border border-border bg-card p-4 hover:bg-background-secondary transition-colors text-left active:scale-[0.98]"
              >
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">{opt.label}</p>
                  <p className="text-[11px] text-foreground-muted">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center space-y-2">
          <button
            onClick={() => onComplete("track_day")}
            className="text-[12px] font-medium text-foreground-muted hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Saltar e ir directo al demo
          </button>
          <p className="text-[10px] text-foreground-muted">
            No necesitas cuenta. Tu progreso se guarda solo en este dispositivo.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Deferred CTA ── */
function DeferredCTA({ onDismiss }: { onDismiss: () => void }) {
  const vm = useBitacoraVM();
  if (vm.entries.length < 2) return null;

  return (
    <div className="rounded-xl border border-border bg-background-secondary p-4 text-center space-y-2.5 mt-4">
      <p className="text-[13px] font-semibold text-foreground">
        ¿Quieres guardar tu día?
      </p>
      <p className="text-[11px] text-foreground-muted max-w-xs mx-auto">
        Crea una cuenta para conservar tus registros, recibir un resumen diario y probar con tu equipo.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          to="/signup"
          className="inline-flex h-9 px-5 rounded-full bg-foreground text-background text-[12px] font-semibold items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          Crear cuenta <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={onDismiss}
          className="inline-flex h-9 px-4 rounded-full border border-border text-[12px] font-medium text-foreground-secondary items-center hover:bg-background-tertiary transition-colors"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}

/* ── Standalone Shell ── */
function StandaloneInner({ mode, onReset }: { mode: DemoMode; onReset: () => void }) {
  const [ctaDismissed, setCtaDismissed] = useState(false);
  const navigate = useNavigate();

  const handleReset = () => {
    LS_KEYS_TO_CLEAR.forEach((k) => localStorage.removeItem(k));
    onReset();
  };

  const modeLabels: Record<DemoMode, string> = {
    track_day: "Registro",
    plan_tasks: "Pendientes",
    explore: "Explorar",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-foreground/10 transition-colors"
              title="Volver a Oasis"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-6 w-6 rounded-md bg-foreground flex items-center justify-center">
              <span className="text-[8px] font-bold tracking-widest text-background">OS</span>
            </div>
            <span className="text-[13px] font-semibold text-foreground">Bitácora</span>
            <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
              {modeLabels[mode]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="h-8 px-3 rounded-full border border-border text-[11px] font-medium text-foreground-muted flex items-center gap-1.5 hover:text-foreground hover:bg-foreground/5 transition-colors"
              title="Reiniciar demo"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>
            <Link
              to="/signup"
              className="h-8 px-4 rounded-full bg-foreground text-background text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              Probar gratis <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-2">
        <p className="text-[10px] text-foreground-muted text-center">
          Tus cambios se guardan solo en este dispositivo · Puedes reiniciar cuando quieras
        </p>
      </div>

      <main className="max-w-2xl mx-auto px-3 py-3 space-y-3">
        {/* Mode-specific panels */}
        {mode === "track_day" && <TrackDayHint />}
        {mode === "plan_tasks" && <TodoPanel />}

        {/* Core Bitácora */}
        <BitacoraCore />

        {/* Day summary (track_day and explore) */}
        {(mode === "track_day" || mode === "explore") && <DaySummaryCard />}

        {/* CTA */}
        {!ctaDismissed && <DeferredCTA onDismiss={() => setCtaDismissed(true)} />}
      </main>
    </div>
  );
}

/* ── Exported page component ── */
export function BitacoraStandalone() {
  const [onboarded, setOnboarded] = useState(() => {
    return localStorage.getItem(LS_ONBOARDED) === "true";
  });
  const [mode, setMode] = useState<DemoMode>(() => {
    return (localStorage.getItem(LS_DEMO_MODE) as DemoMode) || "track_day";
  });

  const handleOnboardingComplete = (selectedMode: DemoMode) => {
    localStorage.setItem(LS_ONBOARDED, "true");
    localStorage.setItem(LS_DEMO_MODE, selectedMode);
    setMode(selectedMode);
    setOnboarded(true);
  };

  const handleReset = () => {
    setOnboarded(false);
    setMode("track_day");
  };

  if (!onboarded) {
    return <MiniOnboarding onComplete={handleOnboardingComplete} />;
  }

  // For "explore" mode, pre-load mock data
  const initialEntries = mode === "explore" ? generateExploreEntries() : undefined;

  return (
    <TooltipProvider>
      <LocalBitacoraProvider initialEntries={initialEntries}>
        <StandaloneInner mode={mode} onReset={handleReset} />
      </LocalBitacoraProvider>
    </TooltipProvider>
  );
}
