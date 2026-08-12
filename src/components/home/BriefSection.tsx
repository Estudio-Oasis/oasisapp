import { useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";

const EMAIL = "r@oasistud.io";

const SIZES = ["Solo yo", "2–10", "11–50", "51–200", "200+"];
const REVENUE = [
  "Aún no vendo",
  "< $100k MXN / mes",
  "$100k – $500k",
  "$500k – $2M",
  "$2M – $10M",
  "$10M+",
];
const CHANNELS = [
  "Tienda online",
  "Punto de venta",
  "Meta Ads",
  "Google Ads",
  "TikTok",
  "LinkedIn / B2B",
  "Ventas por WhatsApp",
  "Equipo comercial",
  "Marketplace",
  "Email / CRM",
];
const GOALS = [
  "Vender más",
  "Bajar costo de adquisición",
  "Que me conozcan (marca)",
  "Retener clientes",
  "Ordenar mis datos",
  "Escalar / levantar inversión",
];

type Form = {
  business: string;
  site: string;
  size: string;
  revenue: string;
  channels: string[];
  goals: string[];
  context: string;
  tried: string;
  name: string;
  contact: string;
};

const EMPTY: Form = {
  business: "",
  site: "",
  size: "",
  revenue: "",
  channels: [],
  goals: [],
  context: "",
  tried: "",
  name: "",
  contact: "",
};

const STEPS = ["Tu negocio", "Dónde estás", "Qué está pasando"];

function Chip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-label text-[10px] md:text-[11px] tracking-[0.14em] uppercase px-3 md:px-4 py-2.5 border-2 transition-colors ${
        on
          ? "border-[#C5221F] bg-[#C5221F] text-[hsl(var(--paper))]"
          : "border-[hsl(var(--ink)/0.15)] text-[hsl(var(--ink)/0.60)] hover:border-[hsl(var(--ink))] hover:text-[hsl(var(--ink))]"
      }`}
    >
      {label}
    </button>
  );
}

const inputClass =
  "w-full bg-transparent border-b-2 border-[hsl(var(--ink)/0.15)] focus:border-[#C5221F] outline-none py-3 font-condensed text-[clamp(20px,3vw,34px)] leading-none text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink)/0.25)] transition-colors";

export function BriefSection() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(EMPTY);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (k: "channels" | "goals", v: string) =>
    setF((p) => ({
      ...p,
      [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v],
    }));

  const send = () => {
    const subject = encodeURIComponent(`Brief: ${f.business || f.name || "nuevo negocio"}`);
    const body = encodeURIComponent(
      [
        `Negocio: ${f.business}`,
        `Sitio / redes: ${f.site}`,
        `Tamaño de equipo: ${f.size}`,
        `Ventas actuales: ${f.revenue}`,
        `Canales activos: ${f.channels.join(", ")}`,
        `Objetivo: ${f.goals.join(", ")}`,
        "",
        `Qué está pasando:`,
        f.context,
        "",
        `Qué ya intentó:`,
        f.tried,
        "",
        `Contacto: ${f.name} — ${f.contact}`,
      ].join("\n"),
    );
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <section
      id="brief"
      className="bg-[hsl(var(--paper))] border-t-2 border-[hsl(var(--ink))] pt-10 md:pt-16 pb-20 md:pb-28"
    >
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <h2 className="font-ultra text-[clamp(38px,8.4vw,150px)] md:text-[min(7.4vw,12vh)] leading-[0.92] text-[hsl(var(--ink))]">
          ¿De qué trata <span className="text-[#C5221F]">tu negocio?</span>
        </h2>
        <p className="mt-4 font-body text-[15px] md:text-[18px] leading-relaxed text-[hsl(var(--ink)/0.55)] max-w-[68ch]">
          No nos digas sólo “quiero más ventas”. Danos contexto real y te regresamos un diagnóstico y
          un plan, no una propuesta genérica.
        </p>

        {/* Progreso */}
        <div className="mt-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(i)}
              className={`flex-1 text-left border-t-4 pt-2 transition-colors ${
                i <= step ? "border-[#C5221F]" : "border-[hsl(var(--ink)/0.12)]"
              }`}
            >
              <span
                className={`font-label text-[9px] md:text-[11px] tracking-[0.2em] uppercase ${
                  i <= step ? "text-[hsl(var(--ink))]" : "text-[hsl(var(--ink)/0.35)]"
                }`}
              >
                0{i + 1} {s}
              </span>
            </button>
          ))}
        </div>

        <div key={step} className="mt-8 md:mt-10 animate-rise-in">
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-8">
                <label className="block">
                  <span className="font-label text-[10px] tracking-[0.24em] uppercase text-[hsl(var(--ink)/0.40)]">
                    A qué se dedica
                  </span>
                  <input
                    className={inputClass}
                    value={f.business}
                    onChange={(e) => set("business", e.target.value)}
                    placeholder="Ej. Tienda de trajes de baño D2C"
                  />
                </label>
                <label className="block">
                  <span className="font-label text-[10px] tracking-[0.24em] uppercase text-[hsl(var(--ink)/0.40)]">
                    Sitio o redes
                  </span>
                  <input
                    className={inputClass}
                    value={f.site}
                    onChange={(e) => set("site", e.target.value)}
                    placeholder="tumarca.com / @tumarca"
                  />
                </label>
              </div>
              <div className="space-y-8">
                <div>
                  <span className="font-label text-[10px] tracking-[0.24em] uppercase text-[hsl(var(--ink)/0.40)]">
                    Tamaño del equipo
                  </span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SIZES.map((s) => (
                      <Chip key={s} label={s} on={f.size === s} onClick={() => set("size", s)} />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-label text-[10px] tracking-[0.24em] uppercase text-[hsl(var(--ink)/0.40)]">
                    Ventas actuales
                  </span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {REVENUE.map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        on={f.revenue === s}
                        onClick={() => set("revenue", s)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <span className="font-label text-[10px] tracking-[0.24em] uppercase text-[hsl(var(--ink)/0.40)]">
                  Canales activos hoy
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CHANNELS.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      on={f.channels.includes(s)}
                      onClick={() => toggle("channels", s)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="font-label text-[10px] tracking-[0.24em] uppercase text-[hsl(var(--ink)/0.40)]">
                  Qué necesitas primero
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {GOALS.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      on={f.goals.includes(s)}
                      onClick={() => toggle("goals", s)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-6">
                <label className="block">
                  <span className="font-label text-[10px] tracking-[0.24em] uppercase text-[hsl(var(--ink)/0.40)]">
                    Qué está pasando
                  </span>
                  <textarea
                    rows={4}
                    className="mt-2 w-full bg-transparent border-2 border-[hsl(var(--ink)/0.15)] focus:border-[#C5221F] outline-none p-4 font-body text-[15px] md:text-[17px] leading-relaxed text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink)/0.30)] transition-colors"
                    value={f.context}
                    onChange={(e) => set("context", e.target.value)}
                    placeholder="Cuéntanos sin filtro: qué se cayó, qué te preocupa, qué números no cuadran."
                  />
                </label>
                <label className="block">
                  <span className="font-label text-[10px] tracking-[0.24em] uppercase text-[hsl(var(--ink)/0.40)]">
                    Qué ya intentaste
                  </span>
                  <textarea
                    rows={3}
                    className="mt-2 w-full bg-transparent border-2 border-[hsl(var(--ink)/0.15)] focus:border-[#C5221F] outline-none p-4 font-body text-[15px] md:text-[17px] leading-relaxed text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink)/0.30)] transition-colors"
                    value={f.tried}
                    onChange={(e) => set("tried", e.target.value)}
                    placeholder="Agencias, pauta, rediseños, gente nueva…"
                  />
                </label>
              </div>
              <div className="space-y-8">
                <label className="block">
                  <span className="font-label text-[10px] tracking-[0.24em] uppercase text-[hsl(var(--ink)/0.40)]">
                    Tu nombre
                  </span>
                  <input
                    className={inputClass}
                    value={f.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Nombre"
                  />
                </label>
                <label className="block">
                  <span className="font-label text-[10px] tracking-[0.24em] uppercase text-[hsl(var(--ink)/0.40)]">
                    Correo o WhatsApp
                  </span>
                  <input
                    className={inputClass}
                    value={f.contact}
                    onChange={(e) => set("contact", e.target.value)}
                    placeholder="tu@correo.com"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Navegación */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              aria-label="Anterior"
              className="h-12 w-12 flex items-center justify-center border-2 border-[hsl(var(--ink)/0.15)] hover:border-[hsl(var(--ink))] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[hsl(var(--ink))]" />
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="h-12 px-6 flex items-center gap-2 bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:bg-[#C5221F] transition-colors font-label text-[10px] tracking-[0.2em] uppercase"
            >
              Siguiente: {STEPS[step + 1]}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={send}
              className="h-12 px-6 flex items-center gap-2 bg-[#C5221F] text-[hsl(var(--paper))] hover:bg-[hsl(var(--ink))] transition-colors font-label text-[10px] tracking-[0.2em] uppercase"
            >
              Enviar brief
              <Check className="h-4 w-4" />
            </button>
          )}
          <span className="font-label text-[10px] tracking-[0.2em] uppercase text-[hsl(var(--ink)/0.35)]">
            Respondemos en menos de 24 h
          </span>
        </div>
      </div>
    </section>
  );
}
