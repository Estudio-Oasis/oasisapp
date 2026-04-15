import { ReactNode } from "react";

const FEATURES = [
  { icon: "⏱", title: "Timer inteligente", desc: "Registra qué haces y cuánto tiempo te toma" },
  { icon: "💰", title: "Valor hora en vivo", desc: "Sabe cuánto estás ganando mientras trabajas" },
  { icon: "📄", title: "Cotizaciones", desc: "Crea propuestas profesionales en minutos" },
  { icon: "📊", title: "Insights de productividad", desc: "Entiende tus patrones y cobra mejor" },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — value prop (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 text-white flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="h-9 w-9 rounded-lg bg-white text-zinc-900 flex items-center justify-center font-bold text-base">
              O
            </div>
            <span className="text-lg font-bold tracking-tight">OasisOS</span>
          </div>

          <h1 className="text-[2rem] font-bold leading-tight mb-4">
            Organiza tu trabajo.
            <br />
            Entiende tu tiempo.
            <br />
            Cobra lo que vales.
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-md">
            El sistema que convierte tu tiempo en decisiones: cuánto cobrar, a quién priorizar y cómo producir más valor.
          </p>
        </div>

        <div className="space-y-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{f.icon}</span>
              <div>
                <p className="font-medium text-white text-sm">{f.title}</p>
                <p className="text-zinc-400 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-700/60 pt-6">
          <p className="text-zinc-400 text-sm italic leading-relaxed">
            "Antes cobraba por instinto. Ahora sé exactamente cuánto vale cada hora de mi trabajo."
          </p>
          <p className="text-zinc-500 text-xs mt-2">— Diseñador freelance, Ciudad de México</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-[420px]">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
              O
            </div>
            <span className="text-lg font-bold tracking-tight">OasisOS</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
