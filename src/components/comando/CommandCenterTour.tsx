import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radar, ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommandTour } from "@/hooks/useCommandTour";

/**
 * Mini-tour de primera vez para super-admins explicando dónde está
 * el acceso al Centro de Comando en desktop y móvil.
 */
export function CommandCenterTour() {
  const { shouldShow, dismiss } = useCommandTour();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!shouldShow) return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [shouldShow]);

  if (!shouldShow || !open) return null;

  const steps = [
    {
      title: "Centro de Comando",
      body: "Como super-admin tienes acceso al pulso global de la organización: actividad en vivo, métricas y monitoreo.",
      visual: (
        <div className="flex h-20 items-center justify-center rounded-xl bg-foreground text-background relative overflow-hidden">
          <span className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-accent/40 blur-2xl" />
          <Radar className="h-8 w-8 text-accent relative" />
        </div>
      ),
    },
    {
      title: "En desktop",
      body: "Lo encuentras en la parte superior de la barra lateral, con un chip ámbar y la etiqueta LIVE.",
      visual: (
        <div className="flex items-center gap-2 rounded-lg bg-accent/15 border border-accent/30 px-3 h-10 text-sm font-semibold animate-pulse-halo ring-2 ring-accent/40">
          <Radar className="h-4 w-4 text-accent" />
          <span className="flex-1">Comando</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent">LIVE</span>
        </div>
      ),
    },
    {
      title: "En móvil",
      body: "Está en la pestaña “Más”, como tarjeta destacada en la parte superior.",
      visual: (
        <div className="flex items-center gap-3 rounded-2xl bg-foreground text-background p-3 animate-pulse-halo ring-2 ring-accent/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
            <Radar className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold">Centro de comando</p>
            <p className="text-[10px] text-background/60">Pulso de la organización</p>
          </div>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const current = steps[step];

  const handleSkip = () => {
    dismiss();
    setOpen(false);
  };

  const handleFinish = () => {
    dismiss();
    setOpen(false);
    navigate("/comando");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center bg-background/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl p-5 animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={handleSkip}
          aria-label="Cerrar"
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted hover:bg-background-tertiary"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 mb-3">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? "w-6 bg-accent" : "w-3 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="mb-4">{current.visual}</div>

        <h3 className="text-base font-bold text-foreground">{current.title}</h3>
        <p className="mt-1 text-sm text-foreground-muted">{current.body}</p>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            onClick={handleSkip}
            className="text-xs font-semibold text-foreground-muted hover:text-foreground"
          >
            Omitir
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Atrás
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={handleFinish}>
                Ir a Comando
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Siguiente <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
