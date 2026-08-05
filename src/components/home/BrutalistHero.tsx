import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
    <section className="bg-[#F4F2ED] pt-24 pb-0">
      {/* Meta bar */}
      <div className="max-w-[1500px] mx-auto px-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C1917]/15 pb-3 font-mono-label text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-[#1C1917]/60">
          <span>Estudio Oasis®</span>
          <span className="hidden sm:inline">Ciudad de México · Desde 2015</span>
          <span>[ 30+ expertos ]</span>
        </div>
      </div>

      {/* Headline */}
      <div className="max-w-[1500px] mx-auto px-5 md:px-8 pt-8 md:pt-12">
        <h1 className="font-condensed text-[#1C1917] leading-[0.86] text-[clamp(52px,13.2vw,230px)]">
          <span className="block">
            <RotatingWord words={VERBS} interval={2200} className="text-[#1C1917]" />
          </span>
          <span className="block">Crecimiento</span>
          <span className="block">
            basado en
            <span className="hidden md:inline"> </span>
            <span className="md:hidden"><br /></span>
            sistemas
          </span>
          <span className="block">
            <span className="text-[#1C1917]/25">para</span>{" "}
            <RotatingWord words={TARGETS} interval={2600} offset={700} className="text-[#E8453C]" />
          </span>
        </h1>
      </div>

      {/* Sub row */}
      <div className="max-w-[1500px] mx-auto px-5 md:px-8 mt-10 md:mt-14 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end border-t border-[#1C1917]/15 pt-6">
        <p className="font-body text-[15px] md:text-[17px] leading-[1.45] text-[#1C1917] max-w-3xl">
          Expertos en <strong className="font-semibold">Adquisición</strong>,{" "}
          <strong className="font-semibold">Activación</strong>,{" "}
          <strong className="font-semibold">Retención</strong> y{" "}
          <strong className="font-semibold">Lifetime Value (LTV)</strong>.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/portfolio"
            className="h-11 px-6 rounded-full bg-[#1C1917] text-white font-mono-label text-[11px] tracking-[0.15em] uppercase flex items-center hover:bg-[#000] transition-colors"
          >
            Ver el trabajo
          </Link>
          <Link
            to="/contacto"
            className="h-11 px-6 rounded-full border border-[#1C1917] text-[#1C1917] font-mono-label text-[11px] tracking-[0.15em] uppercase flex items-center hover:bg-[#1C1917] hover:text-white transition-colors"
          >
            Hablemos
          </Link>
        </div>
      </div>

      {/* Expertise block */}
      <div className="max-w-[1500px] mx-auto px-5 md:px-8 mt-14 md:mt-20 pb-16 md:pb-24">
        <p className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#1C1917]/50 mb-5">
          Hasta ahora empleamos a más de 30 expertos en
        </p>
        <p className="font-condensed text-[clamp(20px,3.4vw,46px)] leading-[1.12] tracking-normal">
          {SERVICES.map((s, i) => (
            <span key={s}>
              <span style={{ color: PALETTE[i % PALETTE.length] }}>{s}</span>
              <span className="text-[#1C1917]/20">{i === SERVICES.length - 1 ? ", etc." : ", "}</span>
            </span>
          ))}
        </p>

        <p className="mt-10 md:mt-14 font-condensed text-[clamp(30px,6vw,92px)] leading-[0.95] text-[#1C1917]">
          We're the ultimate{" "}
          <RotatingWord words={FIXERS} interval={1800} offset={400} className="text-[#1A73E8]" />{" "}
          Fixers.
        </p>
      </div>
    </section>
  );
}
