import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PALETTE, STAGES } from "@/components/home/heroContent";

type Need = {
  id: string;
  label: string;
  diagnosis: string;
  plan: string[];
  stages: string[];
  color: string;
};

const NEEDS: Need[] = [
  {
    id: "vender",
    label: "Necesito vender más",
    diagnosis:
      "Casi nunca es el anuncio. Suele ser la oferta, el precio, la medición o el embudo. Antes de gastar más, revisamos de dónde viene cada peso.",
    plan: [
      "Auditoría de números, canales y embudo (1–2 semanas)",
      "Arreglo de medición y atribución",
      "Oferta y precio antes de campaña",
      "Escalamiento de pauta con lectura semanal",
    ],
    stages: ["Datos y estrategia", "Adquisición"],
    color: PALETTE[1],
  },
  {
    id: "marca",
    label: "Quiero que me conozcan",
    diagnosis:
      "No se arregla con un logo nuevo. Se arregla con una posición clara y un sistema que la repita en todos lados.",
    plan: [
      "Posicionamiento y narrativa",
      "Identidad y sistema visual aplicable",
      "Sistema de contenido y producción",
      "Activaciones y prensa cuando aplica",
    ],
    stages: ["Adquisición"],
    color: PALETTE[3],
  },
  {
    id: "retener",
    label: "Mis clientes no regresan",
    diagnosis:
      "Estás pagando dos veces por el mismo cliente. Con análisis RFM vemos quién compra, cada cuánto y cuánto deja, y le hablamos distinto a cada grupo.",
    plan: [
      "Segmentación RFM de tu base",
      "CRM, WhatsApp y email con flujos",
      "Programa de lealtad y recompra",
      "Calendario de campañas todo el año",
    ],
    stages: ["Activación", "Retención"],
    color: PALETTE[2],
  },
  {
    id: "sistema",
    label: "Todo está desordenado",
    diagnosis:
      "Cuando todo urge al mismo tiempo, el problema es el sistema, no el canal. Priorizamos por impacto en caja.",
    plan: [
      "Diagnóstico operativo y de datos",
      "Orden de oferta, precio y medición",
      "Automatizaciones y dashboards",
      "Roadmap de 90 días con dueños claros",
    ],
    stages: ["Datos y estrategia", "Escala"],
    color: PALETTE[0],
  },
  {
    id: "escalar",
    label: "Ya funciona, quiero escalar",
    diagnosis:
      "Aquí el trabajo es comercial y estructural: alianzas, negociación, nuevos mercados y capacidad para sostener el crecimiento.",
    plan: [
      "Modelo de unidad económica y capacidad",
      "Nuevos canales y mercados",
      "Negociación y alianzas estratégicas",
      "Preparación para inversión si aplica",
    ],
    stages: ["Escala"],
    color: PALETTE[4],
  },
  {
    id: "agencia",
    label: "Mi agencia me está fallando",
    diagnosis:
      "Reportes bonitos y cero claridad. Revisamos cuentas, contratos y entregables y te decimos qué sirve, qué no y qué estás pagando de más.",
    plan: [
      "Acceso y revisión de cuentas reales",
      "Revisión de contrato y entregables",
      "Auditoría de atribución y creativos",
      "Plan de transición sin apagar ventas",
    ],
    stages: ["Datos y estrategia"],
    color: PALETTE[7],
  },
];

const PRICING = [
  {
    title: "Cotizamos capacidades, no entregables",
    body: "No vendemos “12 posts y 6 reels”. Vendemos el equipo y el resultado: quién trabaja, cuánto tiempo y qué se espera mover. Los entregables salen de ahí.",
  },
  {
    title: "Siempre hay tres rangos",
    body: "Cada propuesta trae un rango mínimo, uno recomendado y uno ampliado. Sabes desde el día uno qué compra cada nivel y qué queda fuera.",
  },
  {
    title: "Una célula cuesta menos que piezas sueltas",
    body: "Un servicio aislado siempre es proporcionalmente más caro. Si varias áreas trabajan juntas, el costo por resultado baja.",
  },
  {
    title: "Empezamos por diagnóstico",
    body: "Antes de un contrato largo hay un diagnóstico corto. Si no vemos cómo generar valor, te lo decimos y no seguimos.",
  },
];

export default function ServiciosPage() {
  const [active, setActive] = useState<Need>(NEEDS[0]);

  return (
    <div className="min-h-screen font-body bg-[#FCFCFA]">
      <div className="grain-overlay" aria-hidden />
      <SiteNavbar />

      <section className="pt-24 md:pt-28 pb-14 md:pb-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#111110]/40">
            Servicios
          </p>
          <h1 className="mt-5 font-ultra text-[clamp(40px,10vw,190px)] md:text-[min(8.6vw,14vh)] leading-[0.92] text-[#111110]">
            Dinos qué te pasa.
            <br />
            <span className="text-[#C5221F]">Te decimos qué sigue.</span>
          </h1>
          <p className="mt-6 font-body text-[15px] md:text-[18px] leading-relaxed text-[#111110]/55 max-w-[66ch]">
            Sin promesas infladas. Escoge tu situación y te mostramos el diagnóstico honesto, el
            plan y qué etapas del sistema tocamos.
          </p>
        </div>
      </section>

      {/* Selector interactivo */}
      <section className="border-t-2 border-[#111110] py-10 md:py-16">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <div className="flex flex-wrap gap-2">
            {NEEDS.map((n) => {
              const on = n.id === active.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setActive(n)}
                  style={{ borderColor: on ? n.color : undefined, backgroundColor: on ? n.color : undefined }}
                  className={`font-condensed text-[clamp(16px,2vw,26px)] leading-none px-4 py-3 border-2 transition-colors ${
                    on
                      ? "text-[#FCFCFA]"
                      : "border-[#111110]/15 text-[#111110]/55 hover:border-[#111110] hover:text-[#111110]"
                  }`}
                >
                  {n.label}
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
              <span className="font-mono-label text-[10px] tracking-[0.28em] uppercase" style={{ color: active.color }}>
                Diagnóstico honesto
              </span>
              <p className="mt-3 font-condensed text-[clamp(21px,2.8vw,38px)] leading-[1.12] text-[#111110]">
                {active.diagnosis}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {active.stages.map((s) => (
                  <span
                    key={s}
                    className="font-mono-label text-[10px] tracking-[0.18em] uppercase px-3 py-2 border-2"
                    style={{ borderColor: active.color, color: active.color }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-mono-label text-[10px] tracking-[0.28em] uppercase text-[#111110]/40">
                Cómo lo trabajamos
              </span>
              <ol className="mt-4 border-t border-[#111110]/15">
                {active.plan.map((p, i) => (
                  <li key={p} className="py-4 border-b border-[#111110]/15 flex gap-4">
                    <span
                      className="font-ultra text-[clamp(22px,3vw,38px)] leading-none shrink-0"
                      style={{ color: active.color }}
                    >
                      0{i + 1}
                    </span>
                    <span className="font-body text-[15px] md:text-[17px] leading-relaxed text-[#111110]/75">
                      {p}
                    </span>
                  </li>
                ))}
              </ol>
              <Link
                to="/#brief"
                className="mt-7 inline-flex items-center gap-2 h-12 px-6 bg-[#111110] text-[#FCFCFA] hover:bg-[#C5221F] transition-colors font-mono-label text-[10px] tracking-[0.2em] uppercase"
              >
                Contar mi caso <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Las 5 etapas, resumidas */}
      <section className="border-t-2 border-[#111110] py-14 md:py-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <h2 className="font-ultra text-[clamp(30px,6.4vw,96px)] md:text-[min(5vw,8vh)] leading-[0.95] text-[#111110]">
            El sistema completo <span className="text-[#111110]/30">en 5 etapas.</span>
          </h2>
          <div className="mt-8 grid md:grid-cols-5 border-t-2 border-[#111110]">
            {STAGES.map((s) => (
              <div
                key={s.id}
                className="py-6 md:py-8 md:px-5 md:first:pl-0 border-b border-[#111110]/15 md:border-b-0 md:border-r md:border-r-[#111110]/15 md:last:border-r-0"
              >
                <span
                  className="font-ultra text-[clamp(30px,7vw,64px)] md:text-[min(3.4vw,6vh)] leading-none"
                  style={{ color: s.color }}
                >
                  {s.n}
                </span>
                <h3 className="mt-2 font-condensed text-[clamp(18px,3.4vw,28px)] leading-none text-[#111110]">
                  {s.label}
                </h3>
                <p className="mt-3 font-body text-[14px] md:text-[15px] leading-relaxed text-[#111110]/60">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo cotizamos */}
      <section className="bg-[#111110] py-16 md:py-24">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#FCFCFA]/40">
            Cómo cotizamos
          </p>
          <h2 className="mt-5 font-ultra text-[clamp(32px,7vw,110px)] md:text-[min(5.6vw,9vh)] leading-[0.95] text-[#FCFCFA]">
            Claro desde la primera junta.
          </h2>
          <div className="mt-10 grid md:grid-cols-2 gap-x-14 gap-y-8 border-t border-[#FCFCFA]/15 pt-8">
            {PRICING.map((p, i) => (
              <div key={p.title}>
                <h3
                  className="font-condensed text-[clamp(19px,2.6vw,32px)] leading-[1.05]"
                  style={{ color: PALETTE[i % PALETTE.length] }}
                >
                  {p.title}
                </h3>
                <p className="mt-3 font-body text-[15px] md:text-[17px] leading-relaxed text-[#FCFCFA]/60 max-w-[58ch]">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
