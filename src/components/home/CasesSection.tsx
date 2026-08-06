import { useState } from "react";
import { Link } from "react-router-dom";
import { PALETTE } from "./heroContent";

type Case = {
  id: string;
  client: string;
  kicker: string;
  headline: string;
  body: string;
  result: string;
  color: string;
};

const CASES: Case[] = [
  {
    id: "zoe",
    client: "Zoe Water",
    kicker: "Branding + Marketing",
    headline: "Una marca de agua que la gente pide por nombre",
    body: "Construimos identidad, empaque, narrativa y toda la máquina de contenido y pauta que la sostiene.",
    result: "De marca nueva a presencia nacional en retail.",
    color: PALETTE[3],
  },
  {
    id: "liverpool",
    client: "Liverpool Gourmet",
    kicker: "Branding + Packaging",
    headline: "Sistema de marca para una línea gourmet dentro del retail más grande de México",
    body: "Naming, identidad, packaging y lineamientos para decenas de SKUs que tenían que verse como una sola familia.",
    result: "Sistema aplicado en toda la línea y punto de venta.",
    color: PALETTE[6],
  },
  {
    id: "indumet",
    client: "Indumet Aerospace",
    kicker: "Logo + Website + Revenue",
    headline: "Industria pesada que necesitaba verse del tamaño de sus clientes",
    body: "Rediseño de identidad, sitio en inglés y español, y ordenamiento del proceso comercial B2B.",
    result: "Pipeline internacional con material de venta serio.",
    color: PALETTE[0],
  },
];

export function CasesSection() {
  const [open, setOpen] = useState<string | null>(CASES[0].id);

  return (
    <section data-reveal className="bg-[#FCFCFA] py-20 md:py-24">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#111110]/40">
          Casos
        </p>

        <div className="mt-6 border-t-2 border-[#111110]">
          {CASES.map((c) => {
            const isOpen = open === c.id;
            return (
              <div key={c.id} className="border-b border-[#111110]/15">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  className="w-full text-left py-5 md:py-7 flex items-baseline gap-4 group"
                >
                  <span
                    className="font-ultra leading-[0.85] text-[clamp(34px,8vw,96px)] md:text-[min(5.6vw,9vh)] transition-colors"
                    style={{ color: isOpen ? c.color : "#111110" }}
                  >
                    {c.client}
                  </span>
                  <span className="font-mono-label text-[9px] md:text-[11px] tracking-[0.2em] uppercase text-[#111110]/35 shrink-0">
                    {c.kicker}
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-8 md:pb-10 grid md:grid-cols-[1.4fr_1fr] gap-6 md:gap-12 animate-rise-in">
                    <div>
                      <p className="font-condensed text-[clamp(20px,3.4vw,40px)] md:text-[min(2.5vw,4vh)] leading-[1.08] text-[#111110]">
                        {c.headline}
                      </p>
                      <p className="mt-4 text-[15px] md:text-[17px] leading-relaxed text-[#111110]/65 max-w-[62ch]">
                        {c.body}
                      </p>
                    </div>
                    <div className="border-l-2 pl-5" style={{ borderColor: c.color }}>
                      <p className="font-mono-label text-[10px] tracking-[0.25em] uppercase text-[#111110]/40">
                        Resultado
                      </p>
                      <p className="mt-2 text-[15px] md:text-[17px] leading-relaxed text-[#111110]">
                        {c.result}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Link
          to="/portfolio"
          className="mt-10 inline-block font-ultra text-[clamp(24px,5vw,60px)] md:text-[min(3.4vw,5.5vh)] leading-none text-[#111110]/30 hover:text-[#111110] transition-colors"
        >
          Ver todo el portafolio →
        </Link>
      </div>
    </section>
  );
}
