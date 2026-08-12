import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { QuoteBuilder } from "@/components/home/QuoteBuilder";
import { SiteFooter } from "@/components/SiteFooter";
import { PALETTE, STAGES } from "@/components/home/heroContent";
import { useLang, type Bi } from "@/i18n/LanguageContext";

type Need = {
  id: string;
  label: Bi;
  diagnosis: Bi;
  plan: Bi[];
  stages: Bi[];
  color: string;
};

const S = {
  datos: { es: "Datos y estrategia", en: "Data & strategy" },
  adquisicion: { es: "Adquisición", en: "Acquisition" },
  activacion: { es: "Activación", en: "Activation" },
  retencion: { es: "Retención", en: "Retention" },
  escala: { es: "Escala", en: "Scale" },
} satisfies Record<string, Bi>;

const NEEDS: Need[] = [
  {
    id: "vender",
    label: { es: "Necesito vender más", en: "I need to sell more" },
    diagnosis: {
      es: "Casi nunca es el anuncio. Suele ser la oferta, el precio, la medición o el embudo. Antes de gastar más, revisamos de dónde viene cada peso.",
      en: "It's almost never the ad. It's usually the offer, the price, the tracking, or the funnel. Before spending more, we check where every dollar comes from.",
    },
    plan: [
      {
        es: "Auditoría de números, canales y embudo (1–2 semanas)",
        en: "Audit of numbers, channels, and funnel (1–2 weeks)",
      },
      { es: "Arreglo de medición y atribución", en: "Fixing tracking and attribution" },
      { es: "Oferta y precio antes de campaña", en: "Offer and pricing before campaigns" },
      {
        es: "Escalamiento de pauta con lectura semanal",
        en: "Paid media scaling with weekly review",
      },
    ],
    stages: [S.datos, S.adquisicion],
    color: PALETTE[1],
  },
  {
    id: "marca",
    label: { es: "Quiero que me conozcan", en: "I want to be known" },
    diagnosis: {
      es: "No se arregla con un logo nuevo. Se arregla con una posición clara y un sistema que la repita en todos lados.",
      en: "A new logo doesn't fix this. A clear position and a system that repeats it everywhere does.",
    },
    plan: [
      { es: "Posicionamiento y narrativa", en: "Positioning and narrative" },
      { es: "Identidad y sistema visual aplicable", en: "Identity and a usable visual system" },
      { es: "Sistema de contenido y producción", en: "Content system and production" },
      {
        es: "Activaciones y prensa cuando aplica",
        en: "Activations and press when it makes sense",
      },
    ],
    stages: [S.adquisicion],
    color: PALETTE[3],
  },
  {
    id: "retener",
    label: { es: "Mis clientes no regresan", en: "My customers don't come back" },
    diagnosis: {
      es: "Estás pagando dos veces por el mismo cliente. Con análisis RFM vemos quién compra, cada cuánto y cuánto deja, y le hablamos distinto a cada grupo.",
      en: "You're paying twice for the same customer. With RFM analysis we see who buys, how often, and how much they leave, then talk to each group differently.",
    },
    plan: [
      { es: "Segmentación RFM de tu base", en: "RFM segmentation of your customer base" },
      { es: "CRM, WhatsApp y email con flujos", en: "CRM, WhatsApp, and email flows" },
      { es: "Programa de lealtad y recompra", en: "Loyalty and repeat-purchase program" },
      { es: "Calendario de campañas todo el año", en: "Year-round campaign calendar" },
    ],
    stages: [S.activacion, S.retencion],
    color: PALETTE[2],
  },
  {
    id: "sistema",
    label: { es: "Todo está desordenado", en: "Everything is a mess" },
    diagnosis: {
      es: "Cuando todo urge al mismo tiempo, el problema es el sistema, no el canal. Priorizamos por impacto en caja.",
      en: "When everything is urgent at once, the problem is the system, not the channel. We prioritize by cash impact.",
    },
    plan: [
      { es: "Diagnóstico operativo y de datos", en: "Operational and data diagnosis" },
      { es: "Orden de oferta, precio y medición", en: "Order in offer, pricing, and tracking" },
      { es: "Automatizaciones y dashboards", en: "Automations and dashboards" },
      {
        es: "Roadmap de 90 días con dueños claros",
        en: "90-day roadmap with clear owners",
      },
    ],
    stages: [S.datos, S.escala],
    color: PALETTE[0],
  },
  {
    id: "escalar",
    label: { es: "Ya funciona, quiero escalar", en: "It works, I want to scale" },
    diagnosis: {
      es: "Aquí el trabajo es comercial y estructural: alianzas, negociación, nuevos mercados y capacidad para sostener el crecimiento.",
      en: "Here the work is commercial and structural: partnerships, negotiation, new markets, and the capacity to sustain growth.",
    },
    plan: [
      { es: "Modelo de unidad económica y capacidad", en: "Unit economics and capacity model" },
      { es: "Nuevos canales y mercados", en: "New channels and markets" },
      { es: "Negociación y alianzas estratégicas", en: "Negotiation and strategic partnerships" },
      { es: "Preparación para inversión si aplica", en: "Fundraising prep when relevant" },
    ],
    stages: [S.escala],
    color: PALETTE[4],
  },
  {
    id: "agencia",
    label: { es: "Mi agencia me está fallando", en: "My agency is failing me" },
    diagnosis: {
      es: "Reportes bonitos y cero claridad. Revisamos cuentas, contratos y entregables y te decimos qué sirve, qué no y qué estás pagando de más.",
      en: "Pretty reports, zero clarity. We review accounts, contracts, and deliverables and tell you what works, what doesn't, and what you're overpaying for.",
    },
    plan: [
      { es: "Acceso y revisión de cuentas reales", en: "Access and review of the real accounts" },
      { es: "Revisión de contrato y entregables", en: "Contract and deliverables review" },
      { es: "Auditoría de atribución y creativos", en: "Attribution and creative audit" },
      {
        es: "Plan de transición sin apagar ventas",
        en: "Transition plan that doesn't switch off sales",
      },
    ],
    stages: [S.datos],
    color: PALETTE[7],
  },
];

const PRICING: { title: Bi; body: Bi }[] = [
  {
    title: {
      es: "Cotizamos capacidades, no entregables",
      en: "We quote capabilities, not deliverables",
    },
    body: {
      es: "No vendemos “12 posts y 6 reels”. Vendemos el equipo y el resultado: quién trabaja, cuánto tiempo y qué se espera mover. Los entregables salen de ahí.",
      en: "We don't sell “12 posts and 6 reels”. We sell the team and the outcome: who works, for how long, and what we expect to move. Deliverables come out of that.",
    },
  },
  {
    title: { es: "Siempre hay tres rangos", en: "There are always three ranges" },
    body: {
      es: "Cada propuesta trae un rango mínimo, uno recomendado y uno ampliado. Sabes desde el día uno qué compra cada nivel y qué queda fuera.",
      en: "Every proposal has a floor, a target, and a premium range. From day one you know what each level buys and what's out of scope.",
    },
  },
  {
    title: {
      es: "Una célula cuesta menos que piezas sueltas",
      en: "A full cell costs less than loose pieces",
    },
    body: {
      es: "Un servicio aislado siempre es proporcionalmente más caro. Si varias áreas trabajan juntas, el costo por resultado baja.",
      en: "An isolated service is always proportionally more expensive. When several areas work together, cost per outcome drops.",
    },
  },
  {
    title: { es: "Empezamos por diagnóstico", en: "We start with a diagnosis" },
    body: {
      es: "Antes de un contrato largo hay un diagnóstico corto. Si no vemos cómo generar valor, te lo decimos y no seguimos.",
      en: "Before a long contract there's a short diagnosis. If we don't see how to create value, we say so and we stop there.",
    },
  },
];

export default function ServiciosPage() {
  const { t, pick } = useLang();
  const [active, setActive] = useState<Need>(NEEDS[0]);

  return (
    <div className="min-h-screen font-body bg-[hsl(var(--paper))]">
      <div className="grain-overlay" aria-hidden />
      <SiteNavbar />

      <section className="pt-24 md:pt-28 pb-12 md:pb-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <p className="font-label text-[hsl(var(--ink)/0.40)]">
            {t("Servicios", "Services")}
          </p>
          <h1 className="mt-5 font-ultra text-[clamp(38px,10vw,190px)] md:text-[min(8.6vw,14vh)] leading-[0.92] text-[hsl(var(--ink))]">
            {t("Dinos qué te pasa.", "Tell us what's wrong.")}
            <br />
            <span className="text-[#C5221F]">
              {t("Te decimos qué sigue.", "We'll tell you what's next.")}
            </span>
          </h1>
          <p className="mt-6 font-body text-[15px] md:text-[18px] leading-relaxed text-[hsl(var(--ink)/0.55)] max-w-[66ch]">
            {t(
              "Sin promesas infladas. Escoge tu situación y te mostramos el diagnóstico honesto, el plan y qué etapas del sistema tocamos.",
              "No inflated promises. Pick your situation and we'll show you the honest diagnosis, the plan, and which stages of the system we touch.",
            )}
          </p>
        </div>
      </section>

      {/* Selector interactivo */}
      <section className="border-t-2 border-[hsl(var(--ink))] py-8 md:py-16">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
            {NEEDS.map((n) => {
              const on = n.id === active.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setActive(n)}
                  style={{
                    borderColor: on ? n.color : undefined,
                    backgroundColor: on ? n.color : undefined,
                  }}
                  className={`text-left font-condensed text-[clamp(17px,2vw,26px)] leading-none px-4 py-3.5 border-2 transition-colors ${
                    on
                      ? "text-[hsl(var(--paper))]"
                      : "border-[hsl(var(--ink)/0.15)] text-[hsl(var(--ink)/0.55)] hover:border-[hsl(var(--ink))] hover:text-[hsl(var(--ink))]"
                  }`}
                >
                  {pick(n.label)}
                </button>
              );
            })}
          </div>

          <div
            key={active.id}
            className="mt-8 border-t-2 pt-8 grid md:grid-cols-[1.1fr_1fr] gap-8 md:gap-14 animate-rise-in"
            style={{ borderColor: active.color }}
          >
            <div>
              <span className="font-label" style={{ color: active.color }}>
                {t("Diagnóstico honesto", "Honest diagnosis")}
              </span>
              <p className="mt-3 font-condensed text-[clamp(20px,2.8vw,38px)] leading-[1.12] text-[hsl(var(--ink))]">
                {pick(active.diagnosis)}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {active.stages.map((s) => (
                  <span
                    key={s.es}
                    className="font-label px-3 py-2 border-2"
                    style={{ borderColor: active.color, color: active.color }}
                  >
                    {pick(s)}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-label text-[hsl(var(--ink)/0.40)]">
                {t("Cómo lo trabajamos", "How we work it")}
              </span>
              <ol className="mt-4 border-t border-[hsl(var(--ink)/0.15)]">
                {active.plan.map((p, i) => (
                  <li
                    key={p.es}
                    className="py-4 border-b border-[hsl(var(--ink)/0.15)] flex gap-4"
                  >
                    <span
                      className="font-ultra text-[clamp(22px,3vw,38px)] leading-none shrink-0"
                      style={{ color: active.color }}
                    >
                      0{i + 1}
                    </span>
                    <span className="font-body text-[15px] md:text-[17px] leading-relaxed text-[hsl(var(--ink)/0.75)]">
                      {pick(p)}
                    </span>
                  </li>
                ))}
              </ol>
              <a
                href="#cotizador"
                className="mt-7 inline-flex items-center gap-2 h-12 px-6 bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:bg-[#C5221F] transition-colors font-label"
              >
                {t("Ver mi rango", "See my range")} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Las 5 etapas, resumidas */}
      <section className="border-t-2 border-[hsl(var(--ink))] py-12 md:py-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <h2 className="font-ultra text-[clamp(28px,6.4vw,96px)] md:text-[min(5vw,8vh)] leading-[0.95] text-[hsl(var(--ink))]">
            {t("El sistema completo", "The full system")}{" "}
            <span className="text-[hsl(var(--ink)/0.30)]">
              {t("en 5 etapas.", "in 5 stages.")}
            </span>
          </h2>
          <div className="mt-8 grid md:grid-cols-5 border-t-2 border-[hsl(var(--ink))]">
            {STAGES.map((s) => (
              <div
                key={s.id}
                className="py-6 md:py-8 md:px-5 md:first:pl-0 border-b border-[hsl(var(--ink)/0.15)] md:border-b-0 md:border-r md:border-r-[hsl(var(--ink)/0.15)] md:last:border-r-0"
              >
                <span
                  className="font-ultra text-[clamp(30px,7vw,64px)] md:text-[min(3.4vw,6vh)] leading-none"
                  style={{ color: s.color }}
                >
                  {s.n}
                </span>
                <h3 className="mt-2 font-condensed text-[clamp(18px,3.4vw,28px)] leading-none text-[hsl(var(--ink))]">
                  {pick(s.label)}
                </h3>
                <p className="mt-3 font-body text-[14px] md:text-[15px] leading-relaxed text-[hsl(var(--ink)/0.60)]">
                  {pick(s.body)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo cotizamos */}
      <section className="bg-[hsl(var(--ink))] py-14 md:py-24">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <p className="font-label text-[hsl(var(--paper)/0.40)]">
            {t("Cómo cotizamos", "How we quote")}
          </p>
          <h2 className="mt-5 font-ultra text-[clamp(30px,7vw,110px)] md:text-[min(5.6vw,9vh)] leading-[0.95] text-[hsl(var(--paper))]">
            {t("Claro desde la primera junta.", "Clear from the first meeting.")}
          </h2>
          <div className="mt-10 grid md:grid-cols-2 gap-x-14 gap-y-8 border-t border-[hsl(var(--paper)/0.15)] pt-8">
            {PRICING.map((p, i) => (
              <div key={p.title.es}>
                <h3
                  className="font-condensed text-[clamp(19px,2.6vw,32px)] leading-[1.05]"
                  style={{ color: PALETTE[i % PALETTE.length] }}
                >
                  {pick(p.title)}
                </h3>
                <p className="mt-3 font-body text-[15px] md:text-[17px] leading-relaxed text-[hsl(var(--paper)/0.60)] max-w-[58ch]">
                  {pick(p.body)}
                </p>
              </div>
            ))}
          </div>

          <Link
            to="/contacto"
            className="mt-10 inline-flex items-center gap-2 h-12 px-6 bg-[hsl(var(--paper))] text-[hsl(var(--ink))] hover:bg-[#E8453C] hover:text-[hsl(var(--paper))] transition-colors font-label"
          >
            {t("Contar mi caso", "Tell us my case")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <QuoteBuilder />
      <SiteFooter />
    </div>
  );
}
