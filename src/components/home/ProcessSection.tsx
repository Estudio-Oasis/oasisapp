import { PALETTE } from "./heroContent";
import { useLang, type Bi } from "@/i18n/LanguageContext";

const STEPS: { n: string; title: Bi; body: Bi }[] = [
  {
    n: "01",
    title: { es: "Diagnóstico", en: "Diagnosis" },
    body: {
      es: "Entramos a tus números, tus canales y tu operación. En días, no en meses. Te decimos qué está roto y qué se puede cobrar antes.",
      en: "We get into your numbers, channels, and operation. In days, not months. We tell you what's broken and what can bring cash in sooner.",
    },
  },
  {
    n: "02",
    title: { es: "Sistema", en: "System" },
    body: {
      es: "Ordenamos oferta, precio, medición y seguimiento. Sin sistema, cualquier campaña es una apuesta.",
      en: "We put offer, pricing, tracking, and follow-up in order. Without a system, any campaign is a bet.",
    },
  },
  {
    n: "03",
    title: { es: "Ejecución", en: "Execution" },
    body: {
      es: "Marca, contenido, pauta, tienda, software, automatizaciones. Lo hace el equipo que lo diseñó, no un tercero.",
      en: "Brand, content, paid media, store, software, automations. Done by the team that designed it, not a third party.",
    },
  },
  {
    n: "04",
    title: { es: "Escala", en: "Scale" },
    body: {
      es: "Lo que funciona se repite y se mide. Lo que no, se corta. Cada mes con números a la vista.",
      en: "What works gets repeated and measured. What doesn't gets cut. Every month with the numbers in plain sight.",
    },
  },
];

export function ProcessSection() {
  const { t, pick } = useLang();
  return (
    <section data-reveal className="bg-[hsl(var(--paper))] pb-20 md:pb-24">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--ink)/0.40)]">
          {t("Cómo trabajamos", "How we work")}
        </p>

        <div className="mt-6 grid md:grid-cols-4 border-t-2 border-[hsl(var(--ink))]">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="py-7 md:py-9 md:px-6 md:first:pl-0 border-b border-[hsl(var(--ink)/0.15)] md:border-b-0 md:border-r md:border-r-[hsl(var(--ink)/0.15)] md:last:border-r-0"
            >
              <span
                className="font-ultra text-[clamp(38px,9vw,90px)] md:text-[min(4.6vw,8vh)] leading-none"
                style={{ color: PALETTE[i % PALETTE.length] }}
              >
                {s.n}
              </span>
              <h3 className="mt-2 font-condensed text-[clamp(20px,4vw,34px)] md:text-[min(2vw,3.4vh)] leading-none text-[hsl(var(--ink))]">
                {pick(s.title)}
              </h3>
              <p className="mt-3 text-[14px] md:text-[15px] leading-relaxed text-[hsl(var(--ink)/0.60)]">
                {pick(s.body)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
