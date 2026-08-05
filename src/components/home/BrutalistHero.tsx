import { useEffect, useState } from "react";

const VERBS = ["Creamos", "Detonamos", "Arreglamos", "Diseñamos", "Auditamos", "Reparamos"];
const TARGETS = ["Marcas", "Negocios", "Personas", "Organizaciones", "Gobiernos", "Startups", "Fundaciones"];
const FIXERS = ["Brand", "Marketing", "Business", "Startups"];

const PALETTE = [
  "#1A73E8", // blue
  "#E8453C", // red
  "#F9AB00", // yellow
  "#1E8E3E", // green
  "#9334E6", // purple
  "#00897B", // teal
  "#E8710A", // orange
  "#C5221F", // deep red
];

const SERVICES = [
  "Estrategia de Marca (Branding)",
  "Planeación Estratégica (Planning)",
  "Dirección Comercial (Revenue y Ventas)",
  "E-commerce (100m+ USD)",
  "Relaciones Públicas (Alianzas & Sponsorships)",
  "Compra de Medios (Digital Paid Media & Offline)",
  "Activaciones de Marca (Real-time on-site)",
  "Producción Audiovisual (Full-cycle)",
  "DevOps & Infra",
  "Product Design & Frontend",
  "Desarrollo de Software",
  "Data & Computer Science",
  "CRM & Lifecycle",
  "Sistemas de Atribución y Señales",
  "Dashboards",
  "IA",
  "Agentes",
  "Automatizaciones",
  "Eventos",
];

const PILLARS = ["Adquisición", "Activación", "Retención", "Lifetime Value (LTV)"];

function useRotator(length: number, interval: number, offset = 0) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const start = setTimeout(() => {
      setI((p) => (p + 1) % length);
    }, offset);
    const id = setInterval(() => setI((p) => (p + 1) % length), interval);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [length, interval, offset]);
  return i;
}

function RotatingWord({
  words,
  interval,
  offset = 0,
  className = "",
}: {
  words: string[];
  interval: number;
  offset?: number;
  className?: string;
}) {
  const i = useRotator(words.length, interval, offset);
  return (
    <span className="relative inline-grid align-top overflow-hidden">
      {/* Ghost sizer keeps layout stable at the widest word */}
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {words.reduce((a, b) => (a.length >= b.length ? a : b))}
      </span>
      <span key={i} className={`col-start-1 row-start-1 animate-word-in ${className}`}>
        {words[i]}
      </span>
    </span>
  );
}

export function BrutalistHero() {
  return (
    <section className="bg-[#FCFCFA] pt-20 md:pt-24 pb-0">
      {/* Headline — ultra condensed, edge to edge */}
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <h1 className="font-ultra text-[#111110] leading-[0.85] text-[clamp(64px,15.5vw,300px)]">
          <span className="block">
            <RotatingWord words={VERBS} interval={2200} className="text-[#111110]" />
          </span>
          <span className="block">Crecimiento</span>
          <span className="block">basado en sistemas</span>
          <span className="flex items-baseline gap-[0.12em] flex-wrap">
            <span className="text-[#111110]/25">Para</span>
            <RotatingWord words={TARGETS} interval={2600} offset={700} className="text-[#E8453C]" />
          </span>
        </h1>
      </div>

      {/* Pillars — prominent statement */}
      <div className="max-w-[1700px] mx-auto px-4 md:px-6 mt-12 md:mt-20 border-t-2 border-[#111110] pt-8 md:pt-12">
        <p className="font-ultra text-[clamp(34px,7.6vw,124px)] leading-[0.92] text-[#111110]">
          Expertos en{" "}
          {PILLARS.map((p, i) => (
            <span key={p}>
              <span style={{ color: PALETTE[i % PALETTE.length] }}>{p}</span>
              {i < PILLARS.length - 2 ? <span className="text-[#111110]/20">, </span> : null}
              {i === PILLARS.length - 2 ? <span className="text-[#111110]/30"> y </span> : null}
              {i === PILLARS.length - 1 ? <span className="text-[#111110]/20">.</span> : null}
            </span>
          ))}
        </p>
      </div>

      {/* Expertise block */}
      <div className="max-w-[1700px] mx-auto px-4 md:px-6 mt-16 md:mt-24 pb-20 md:pb-28">
        <p className="font-ultra text-[clamp(22px,3.6vw,58px)] leading-[1] text-[#111110]/45 mb-6 md:mb-8">
          Hasta ahora empleamos a más de 30 expertos en
        </p>
        <p className="font-condensed text-[clamp(20px,3.4vw,46px)] leading-[1.12] tracking-normal">
          {SERVICES.map((s, i) => (
            <span key={s} className="animate-rise-in" style={{ animationDelay: `${i * 55}ms` }}>
              <span
                className="transition-colors duration-300 hover:text-[#111110]"
                style={{ color: PALETTE[i % PALETTE.length] }}
              >
                {s}
              </span>
              <span className="text-[#111110]/20">{i === SERVICES.length - 1 ? ", etc." : ", "}</span>
            </span>
          ))}
        </p>

        <p className="mt-12 md:mt-20 font-ultra text-[clamp(36px,8vw,140px)] leading-[0.9] text-[#111110]">
          We're the ultimate{" "}
          <RotatingWord
            words={FIXERS}
            interval={1800}
            offset={400}
            className="text-[#1A73E8] animate-hue-drift"
          />{" "}
          Fixers.
        </p>
      </div>
    </section>
  );
}
