import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string; // CSS selector
  icon: string;
  title: string;
  description: string;
}

const STEPS: TourStep[] = [
  {
    target: '[data-tour="profile"]',
    icon: "📸",
    title: "Tu perfil",
    description:
      "Agrega una foto y confirma tu nombre. Tu avatar aparece en tareas y registros de tiempo.",
  },
  {
    target: '[data-tour="tasks"]',
    icon: "✅",
    title: "Tus tareas",
    description:
      "Aquí están todas las tareas activas. Las que tienen tu avatar son las tuyas. Puedes crear nuevas o actualizar el estado.",
  },
  {
    target: '[data-tour="timer"]',
    icon: "⚡",
    title: "Registra tu tiempo",
    description:
      "Cada vez que trabajes en algo, inicia el timer aquí. Selecciona el cliente y la tarea — así el tiempo queda correctamente vinculado.",
  },
];

interface OnboardingTourProps {
  active: boolean;
  onComplete: () => void;
}

export function OnboardingTour({ active, onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number; placement: "right" | "bottom" }>({
    top: 0,
    left: 0,
    placement: "right",
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const updatePosition = () => {
      const target = document.querySelector(STEPS[step].target);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      // Position to the right of sidebar items
      setPosition({
        top: rect.top + rect.height / 2 - 80,
        left: rect.right + 16,
        placement: "right",
      });

      // Highlight target
      target.classList.add("ring-2", "ring-accent", "ring-offset-2", "rounded-md", "z-50", "relative");
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => {
      // Clean up highlights
      const target = document.querySelector(STEPS[step].target);
      if (target) {
        target.classList.remove("ring-2", "ring-accent", "ring-offset-2", "rounded-md", "z-50", "relative");
      }
      window.removeEventListener("resize", updatePosition);
    };
  }, [active, step]);

  if (!active) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-foreground/20 z-40" />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 w-[300px] rounded-xl border border-border bg-card p-5 shadow-lg"
        style={{ top: position.top, left: position.left }}
      >
        {/* Arrow */}
        <div
          className="absolute -left-2 top-[80px] h-4 w-4 rotate-45 border-l border-b border-border bg-card"
        />

        <div className="relative">
          <span className="text-2xl">{currentStep.icon}</span>
          <h3 className="text-h3 text-foreground mt-2">{currentStep.title}</h3>
          <p className="text-sm text-foreground-secondary mt-1.5 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="flex items-center justify-between mt-5">
            <span className="text-micro text-foreground-muted">
              {step + 1} de {STEPS.length}
            </span>
            <div className="flex gap-2">
              {!isFirst && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Atrás
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  if (isLast) {
                    onComplete();
                  } else {
                    setStep((s) => s + 1);
                  }
                }}
              >
                {isLast ? "Listo ✓" : "Siguiente →"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
