import { useState } from "react";
import { PALETTE } from "./heroContent";
import { useLang } from "@/i18n/LanguageContext";

type Case = {
  id: string;
  client: string;
  kicker: { es: string; en: string };
  headline: { es: string; en: string };
  body: { es: string; en: string };
  result: { es: string; en: string };
  color: string;
};

const CASES: Case[] = [
  {
    id: "zoe",
    client: "Zoe Water",
    kicker: { es: "Marca + contenido", en: "Brand + content" },
    headline: {
      es: "Le dimos a una marca de agua una razón para existir",
      en: "We gave a water brand a reason to exist",
    },
    body: {
      es: "Trabajamos identidad, narrativa y el motor de contenido y pauta que la sostiene todo el año.",
      en: "We worked on identity, narrative, and the content and paid-media engine that keeps it alive year-round.",
    },
    result: {
      es: "Marca consistente en canal digital y punto de venta, con un sistema de contenido que el equipo interno puede operar.",
      en: "A consistent brand across digital and retail, with a content system the in-house team can run.",
    },
    color: PALETTE[3],
  },
  {
    id: "rocketfy",
    client: "Rocketfy",
    kicker: { es: "Growth + operación", en: "Growth + ops" },
    headline: {
      es: "Ordenamos el sistema de crecimiento de una startup de e-commerce",
      en: "We rebuilt the growth system of an e-commerce startup",
    },
    body: {
      es: "Armamos señales para saber en qué se atoraba cada usuario, creamos una academia de formación y acompañamos a los vendedores en su propia tienda.",
      en: "We built signals to see where each user got stuck, created a training academy, and worked hands-on inside sellers' stores.",
    },
    result: {
      es: "Crecimiento sostenido de revenue mensual y un equipo de growth, data y producto trabajando con las mismas métricas.",
      en: "Sustained monthly revenue growth and a growth, data, and product team aligned on the same metrics.",
    },
    color: PALETTE[1],
  },
  {
    id: "49ers",
    client: "San Francisco 49ers",
    kicker: { es: "Marca en español", en: "Spanish-language brand" },
    headline: {
      es: "Un equipo de la NFL hablándole de verdad al público hispanohablante",
      en: "An NFL team actually speaking to Spanish-speaking fans",
    },
    body: {
      es: "Estrategia de marca y contenido en español: tono, formatos y calendario propio, no traducciones.",
      en: "Brand and content strategy in Spanish: tone, formats, and its own calendar — not translations.",
    },
    result: {
      es: "Cuenta de referencia en México dentro de la conversación de la NFL en español.",
      en: "A reference account in Mexico within the NFL's Spanish-language conversation.",
    },
    color: PALETTE[7],
  },
  {
    id: "indumet",
    client: "Indumet",
    kicker: { es: "Marca + sitio + comercial", en: "Brand + site + sales" },
    headline: {
      es: "Industria pesada que necesitaba verse del tamaño de sus clientes",
      en: "Heavy industry that needed to look the size of its clients",
    },
    body: {
      es: "Identidad, sitio bilingüe y orden en el proceso comercial B2B: quién contesta, con qué material y en cuánto tiempo.",
      en: "Identity, a bilingual site, and order in the B2B sales process: who replies, with what material, and how fast.",
    },
    result: {
      es: "Material de venta creíble para clientes internacionales y un seguimiento que ya no se cae.",
      en: "Credible sales material for international clients and follow-up that no longer falls through.",
    },
    color: PALETTE[0],
  },
  {
    id: "liverpool",
    client: "Liverpool Gourmet",
    kicker: { es: "Marca + empaque", en: "Brand + packaging" },
    headline: {
      es: "Decenas de productos que tenían que verse como una sola familia",
      en: "Dozens of products that had to look like one family",
    },
    body: {
      es: "Sistema de marca, empaque y lineamientos aplicables por cualquier proveedor sin perder coherencia.",
      en: "A brand system, packaging, and guidelines any supplier can apply without losing coherence.",
    },
    result: {
      es: "Línea reconocible en anaquel dentro del retail más grande de México.",
      en: "A recognizable shelf presence inside Mexico's largest retailer.",
    },
    color: PALETTE[6],
  },
  {
    id: "mundo-cuervo",
    client: "Mundo Cuervo",
    kicker: { es: "Marca + experiencia", en: "Brand + experience" },
    headline: {
      es: "Convertir una visita en algo que la gente quiere contar",
      en: "Turning a visit into something people want to talk about",
    },
    body: {
      es: "Dirección de marca y marketing experiencial para la división turística en Tequila, Jalisco.",
      en: "Brand direction and experiential marketing for the tourism division in Tequila, Jalisco.",
    },
    result: {
      es: "Experiencia y comunicación alineadas: lo que promete la marca es lo que pasa en el lugar.",
      en: "Experience and communication aligned: what the brand promises is what happens on site.",
    },
    color: PALETTE[2],
  },
];

export function CasesSection() {
  const [open, setOpen] = useState<string | null>(CASES[0].id);
  const { lang, t } = useLang();
  const pick = (v: { es: string; en: string }) => (lang === "en" ? v.en : v.es);

  return (
    <section data-reveal className="bg-[hsl(var(--paper))] py-20 md:py-24">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-label text-[hsl(var(--ink)/0.40)]">
          {t("Casos", "Cases")}
        </p>
        <h2 className="mt-4 font-ultra text-[clamp(30px,6.4vw,96px)] md:text-[min(5vw,8vh)] leading-[0.95] text-[hsl(var(--ink))]">
          {t("Trabajo real,", "Real work,")}{" "}
          <span className="text-[hsl(var(--ink)/0.30)]">
            {t("contado sin exagerar.", "told without exaggeration.")}
          </span>
        </h2>

        <div className="mt-8 border-t-2 border-[hsl(var(--ink))]">
          {CASES.map((c) => {
            const isOpen = open === c.id;
            return (
              <div key={c.id} className="border-b border-[hsl(var(--ink)/0.15)]">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  className="w-full text-left py-5 md:py-7 flex flex-wrap items-baseline gap-x-4 gap-y-1 group"
                >
                  <span
                    className="font-ultra leading-[0.85] text-[clamp(30px,7.4vw,90px)] md:text-[min(5.2vw,8.5vh)] transition-colors"
                    style={{ color: isOpen ? c.color : "hsl(var(--ink))" }}
                  >
                    {c.client}
                  </span>
                  <span className="font-label text-[hsl(var(--ink)/0.35)]">{pick(c.kicker)}</span>
                </button>

                {isOpen && (
                  <div className="pb-8 md:pb-10 grid md:grid-cols-[1.4fr_1fr] gap-6 md:gap-12 animate-rise-in">
                    <div>
                      <p className="font-condensed text-[clamp(20px,3.4vw,40px)] md:text-[min(2.5vw,4vh)] leading-[1.08] text-[hsl(var(--ink))]">
                        {pick(c.headline)}
                      </p>
                      <p className="mt-4 text-[15px] md:text-[17px] leading-relaxed text-[hsl(var(--ink)/0.65)] max-w-[62ch]">
                        {pick(c.body)}
                      </p>
                    </div>
                    <div className="border-l-2 pl-5" style={{ borderColor: c.color }}>
                      <p className="font-label text-[hsl(var(--ink)/0.40)]">
                        {t("Qué quedó", "What was left behind")}
                      </p>
                      <p className="mt-2 text-[15px] md:text-[17px] leading-relaxed text-[hsl(var(--ink))]">
                        {pick(c.result)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-8 font-body text-[14px] md:text-[15px] text-[hsl(var(--ink)/0.45)] max-w-[70ch]">
          {t(
            "Parte de este trabajo se hizo desde agencias y equipos internos, con crédito compartido. Si quieres el detalle de cualquiera, lo platicamos y te mostramos material.",
            "Some of this work was done from agencies and in-house teams, with shared credit. If you want detail on any of it, we'll walk you through the material.",
          )}
        </p>

        <a
          href="https://instagram.com/oasistud.io"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block font-ultra text-[clamp(22px,4.6vw,56px)] md:text-[min(3.2vw,5.2vh)] leading-none text-[hsl(var(--ink)/0.30)] hover:text-[hsl(var(--ink))] transition-colors"
        >
          {t("Ver más trabajo en Instagram →", "See more work on Instagram →")}
        </a>
      </div>
    </section>
  );
}
