import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WelcomeModalProps {
  open: boolean;
  name: string;
  onStartTour: () => void;
  onSkip: () => void;
}

export function WelcomeModal({ open, name, onStartTour, onSkip }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[440px] [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="text-center py-4">
          <span className="text-4xl">👋</span>
          <h2 className="text-h1 text-foreground mt-3">
            Bienvenid@, {name}
          </h2>
          <p className="text-sm text-foreground-secondary mt-2 max-w-[320px] mx-auto">
            Estás en el workspace de tu agencia. Aquí registras tu tiempo, ves tus tareas y colaboras con el equipo.
          </p>

          <div className="mt-6 mx-auto max-w-[300px] rounded-lg border border-border bg-background-secondary p-4 text-left">
            <p className="text-sm font-semibold text-foreground mb-3">
              En 3 pasos estarás list@:
            </p>
            <div className="space-y-2">
              {[
                { icon: "①", label: "Completa tu perfil" },
                { icon: "②", label: "Revisa tus tareas" },
                { icon: "③", label: "Registra tu primera hora" },
              ].map((step) => (
                <div key={step.icon} className="flex items-center gap-2.5 text-sm text-foreground-secondary">
                  <span className="text-accent font-bold">{step.icon}</span>
                  <span>{step.label}</span>
                  <span className="ml-auto text-foreground-muted">→</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Button className="w-full" onClick={onStartTour}>
              Empezar tour →
            </Button>
            <button
              onClick={onSkip}
              className="text-sm text-foreground-muted hover:text-foreground-secondary transition-colors"
            >
              Saltar, exploraré solo
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
