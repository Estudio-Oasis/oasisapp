import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { Link, useNavigate } from "react-router-dom";
import { LocalBitacoraProvider } from "./LocalBitacoraProvider";
import { BitacoraCore } from "./BitacoraCore";
import { useBitacora, useBitacoraVM } from "./BitacoraContext";
import { ArrowRight, ArrowLeft, RotateCcw, Sparkles, ListChecks, Compass, MessageSquare } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TodoPanel } from "./demo/TodoPanel";
import { DaySummaryCard } from "./demo/DaySummaryCard";
import { QuickStartPanel } from "./demo/QuickStartPanel";
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

const FEEDBACK_URL = "https://tally.so/r/wMrqBp";

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
          Volver al inicio
        </button>

        <div className="text-center space-y-2">
          <span className="text-[18px] font-bold tracking-tight text-foreground">Bitácora</span>
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
                onClick={() => {
                  trackEvent("demo_start", { mode: opt.key });
                  onComplete(opt.key);
                }}
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
          to="/signup?from=demo"
          className="inline-flex h-9 px-5 rounded-full bg-foreground text-background text-[12px] font-semibold items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          Crear cuenta gratis <ArrowRight className="h-3 w-3" />
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

/* ── Standalone Inner ── */
function StandaloneInner({ mode, onReset }: { mode: DemoMode; onReset: () => void }) {
  const [ctaDismissed, setCtaDismissed] = useState(false);
  const navigate = useNavigate();
  const bita = useBitacora();

  const handleReset = () => {
    LS_KEYS_TO_CLEAR.forEach((k) => localStorage.removeItem(k));
    onReset();
  };

  const modeLabels: Record<DemoMode, string> = {
    track_day: "Registro",
    plan_tasks: "Pendientes",
    explore: "Explorar",
  };

  // Show QuickStartPanel when in track_day mode and NOT running
  const showQuickStart = mode === "track_day" && !bita.isRunning;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-foreground/10 transition-colors"
              title="Volver al inicio"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-[14px] font-bold tracking-tight text-foreground">Bitácora</span>
            <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
              {modeLabels[mode]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("feedback_clicked", { source: "demo_header" })}
              className="h-8 px-3 rounded-full border border-border text-[11px] font-medium text-foreground-muted flex items-center gap-1.5 hover:text-foreground hover:bg-foreground/5 transition-colors"
              title="Enviar feedback"
            >
              <MessageSquare className="h-3 w-3" />
              <span className="hidden sm:inline">Feedback</span>
            </a>
            <button
              onClick={handleReset}
              className="h-8 px-3 rounded-full border border-border text-[11px] font-medium text-foreground-muted flex items-center gap-1.5 hover:text-foreground hover:bg-foreground/5 transition-colors"
              title="Reiniciar demo"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>
            <Link
              to="/signup?from=demo"
              className="hidden sm:flex h-8 px-4 rounded-full bg-foreground text-background text-[12px] font-semibold items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              Crear cuenta <ArrowRight className="h-3 w-3" />
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
        {/* Mode-specific top panels */}
        {showQuickStart && <QuickStartPanel />}
        {mode === "plan_tasks" && <TodoPanel />}

        {/* Core Bitácora */}
        <BitacoraCore hideQuickLog={showQuickStart} />

        {/* Day summary */}
        {(mode === "track_day" || mode === "explore") && <DaySummaryCard />}

        {/* CTA */}
        {!ctaDismissed && <DeferredCTA onDismiss={() => setCtaDismissed(true)} />}

        {/* Mobile CTA — always visible on mobile for signed-out users */}
        <div className="sm:hidden mt-4">
          <Link
            to="/signup?from=demo"
            className="flex h-11 w-full rounded-full bg-foreground text-background text-[13px] font-semibold items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            Guardar mi progreso <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
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

  const initialEntries = mode === "explore" ? generateExploreEntries() : undefined;

  return (
    <TooltipProvider>
      <LocalBitacoraProvider initialEntries={initialEntries}>
        <StandaloneInner mode={mode} onReset={handleReset} />
      </LocalBitacoraProvider>
    </TooltipProvider>
  );
}
