import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X } from "lucide-react";

/* ─── Step definitions ─── */

interface TourStepDef {
  target: string;
  icon: string;
  title: string;
  body: string;
  type: "profile" | "task" | "timer";
}

const STEPS: TourStepDef[] = [
  {
    target: "profile-btn",
    icon: "📸",
    title: "Tu perfil",
    body: "Agrega tu foto y confirma tu nombre. Tu avatar aparece en tareas y registros de tiempo para que el equipo sepa quién está trabajando en qué.",
    type: "profile",
  },
  {
    target: "new-task-btn",
    icon: "✅",
    title: "Crea tu primera tarea",
    body: "Las tareas son la base de todo. Cada hora que registres irá vinculada a una tarea. Puedes crearla de 3 formas:",
    type: "task",
  },
  {
    target: "start-timer-btn",
    icon: "⚡",
    title: "Registra tu tiempo",
    body: "Cada vez que trabajes en algo, activa el timer. Selecciona el cliente y la tarea — tu tiempo quedará vinculado automáticamente.\n\nAl final del día verás exactamente cuántas horas invertiste y en qué.",
    type: "timer",
  },
];

/* ─── Smart positioning ─── */

function getTooltipPosition(rect: DOMRect, tooltipH = 300, tooltipW = 340) {
  const padding = 16;
  const spaceRight = window.innerWidth - rect.right;
  const spaceAbove = rect.top;

  // Prefer right
  if (spaceRight >= tooltipW + padding) {
    // Vertically center on target, but clamp to viewport
    const idealTop = rect.top + rect.height / 2 - tooltipH / 2;
    const clampedTop = Math.max(padding, Math.min(idealTop, window.innerHeight - tooltipH - padding));
    return {
      top: clampedTop,
      left: rect.right + padding,
      placement: "right" as const,
    };
  }
  // Then above
  if (spaceAbove >= tooltipH + padding) {
    return {
      top: rect.top - tooltipH - padding,
      left: Math.max(padding, Math.min(rect.left, window.innerWidth - tooltipW - padding)),
      placement: "top" as const,
    };
  }
  // Fallback: center in viewport
  return {
    top: Math.max(padding, window.innerHeight / 2 - tooltipH / 2),
    left: Math.max(padding, window.innerWidth / 2 - tooltipW / 2),
    placement: "center" as const,
  };
}

/* ─── Mobile check ─── */
function isMobile() {
  return window.innerWidth < 640;
}

/* ─── Props ─── */

interface OnboardingTourProps {
  active: boolean;
  onComplete: () => void;
  onOpenProfile: () => void;
  onOpenNewTask: () => void;
  onOpenTimer: () => void;
}

export function OnboardingTour({
  active,
  onComplete,
  onOpenProfile,
  onOpenNewTask,
  onOpenTimer,
}: OnboardingTourProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);

  // Fade in
  useEffect(() => {
    if (active && !paused) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [active, paused]);

  // Track target element position
  const updateRect = useCallback(() => {
    const currentStep = STEPS[step];
    if (!currentStep || !active || paused) return;
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect(r);
    }
    rafRef.current = requestAnimationFrame(updateRect);
  }, [step, active, paused]);

  useEffect(() => {
    if (active && !paused) {
      rafRef.current = requestAnimationFrame(updateRect);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, paused, updateRect]);

  // Navigate to /tasks on step 2
  useEffect(() => {
    if (active && step === 1 && !paused) {
      navigate("/tasks");
    }
  }, [active, step, paused, navigate]);

  const handleSkip = async () => {
    if (user) {
      await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
    }
    onComplete();
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  const handleFinish = async () => {
    if (user) {
      await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
    }
    toast.success("¡Todo listo! Ya puedes usar OasisOS 🎉");
    onComplete();
  };

  const handlePauseForAction = () => {
    setPaused(true);
  };

  const handleResume = () => {
    setPaused(false);
  };

  if (!active) return null;

  // Paused state: show floating "continue tour" button
  if (paused) {
    return (
      <button
        onClick={handleResume}
        className="fixed bottom-6 right-6 z-[10001] rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary-hover transition-colors"
      >
        Continuar tour →
      </button>
    );
  }

  const currentStep = STEPS[step];
  const mobile = isMobile();

  // Calculate tooltip position
  const tooltipPos = rect
    ? getTooltipPosition(rect, mobile ? 400 : 300, mobile ? window.innerWidth - 32 : 340)
    : { top: 100, left: 100, placement: "right" as const };

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 z-[9998] transition-opacity duration-200"
        style={{
          background: "rgba(0,0,0,0.75)",
          opacity: visible ? 1 : 0,
        }}
        onClick={handleSkip}
      />

      {/* Spotlight cutout */}
      {rect && (
        <div
          className="fixed z-[9999] transition-all duration-300 ease-out pointer-events-none"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)",
            borderRadius: "10px",
            background: "transparent",
          }}
        />
      )}

      {/* Tooltip card */}
      {mobile ? (
        /* Mobile: bottom sheet */
        <div
          className="fixed bottom-0 left-0 right-0 z-[10000] rounded-t-2xl bg-card border-t border-border p-6 pb-8 transition-transform duration-300"
          style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
        >
          <MobileTooltipContent
            step={step}
            stepDef={currentStep}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            onFinish={handleFinish}
            onPause={handlePauseForAction}
            onOpenProfile={onOpenProfile}
            onOpenNewTask={onOpenNewTask}
            onOpenTimer={onOpenTimer}
          />
        </div>
      ) : (
        /* Desktop: floating card */
        <div
          className="fixed z-[10000] w-[340px] rounded-xl border border-border bg-card p-5 shadow-2xl transition-all duration-300 ease-out"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            opacity: visible ? 1 : 0,
          }}
        >
          <TooltipContent
            step={step}
            stepDef={currentStep}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            onFinish={handleFinish}
            onPause={handlePauseForAction}
            onOpenProfile={onOpenProfile}
            onOpenNewTask={onOpenNewTask}
            onOpenTimer={onOpenTimer}
          />
        </div>
      )}
    </>
  );
}

/* ─── Tooltip content (shared logic) ─── */

interface TooltipContentProps {
  step: number;
  stepDef: TourStepDef;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onFinish: () => void;
  onPause: () => void;
  onOpenProfile: () => void;
  onOpenNewTask: () => void;
  onOpenTimer: () => void;
}

function TooltipContent(props: TooltipContentProps) {
  const { step, stepDef, onNext, onBack, onSkip, onFinish, onPause } = props;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div>
      <span className="text-2xl">{stepDef.icon}</span>
      <h3 className="text-h3 text-foreground mt-2">{stepDef.title}</h3>
      <p className="text-sm text-foreground-secondary mt-1.5 leading-relaxed whitespace-pre-line">
        {stepDef.body}
      </p>

      {/* Step-specific content */}
      {stepDef.type === "profile" && (
        <div className="mt-4 space-y-2">
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onPause();
              props.onOpenProfile();
            }}
          >
            Completar perfil →
          </Button>
          <button
            onClick={onNext}
            className="w-full text-xs text-foreground-muted hover:text-foreground-secondary transition-colors py-1"
          >
            Siguiente →
          </button>
        </div>
      )}

      {stepDef.type === "task" && (
        <div className="mt-4 space-y-2">
          {/* Option cards */}
          <TaskOptionCard
            icon="✏️"
            title="Llenar el formulario"
            desc="Título, cliente, prioridad, fecha"
            cta="Abrir →"
            onClick={() => {
              onPause();
              props.onOpenNewTask();
            }}
          />
          <TaskOptionCard
            icon="⚡"
            title="Iniciar timer ahora"
            desc="Empieza a trabajar y completa los detalles después"
            cta="Iniciar →"
            onClick={() => {
              onPause();
              props.onOpenTimer();
            }}
          />
          <button
            onClick={onNext}
            className="w-full text-xs text-foreground-muted hover:text-foreground-secondary transition-colors py-1 mt-1"
          >
            Siguiente, ya tengo tareas →
          </button>
        </div>
      )}

      {stepDef.type === "timer" && (
        <div className="mt-4 space-y-2">
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onPause();
              props.onOpenTimer();
            }}
          >
            Iniciar mi primer timer →
          </Button>
          <Button size="sm" variant="outline" className="w-full" onClick={onFinish}>
            Listo, ya entendí ✓
          </Button>
        </div>
      )}

      {/* Navigation row */}
      <div className="flex items-center justify-between mt-5 pt-3 border-t border-border">
        <button
          onClick={onSkip}
          className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground-secondary transition-colors"
        >
          <X className="h-3 w-3" />
          Saltar tour
        </button>
        <div className="flex items-center gap-3">
          {/* Dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i <= step ? "bg-accent" : "bg-foreground-muted/30"
                }`}
              />
            ))}
          </div>
          {!isFirst && stepDef.type !== "profile" && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onBack}>
              ← Atrás
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileTooltipContent(props: TooltipContentProps) {
  return <TooltipContent {...props} />;
}

/* ─── Task option card ─── */

interface TaskOptionCardProps {
  icon: string;
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
}

function TaskOptionCard({ icon, title, desc, cta, onClick }: TaskOptionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-lg border border-border bg-background-secondary p-3 text-left hover:border-foreground/20 transition-colors"
    >
      <span className="text-lg shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-foreground-muted mt-0.5">{desc}</p>
      </div>
      <span className="text-xs font-semibold text-accent shrink-0">{cta}</span>
    </button>
  );
}
