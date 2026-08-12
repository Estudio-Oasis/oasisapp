import { useEffect, useState } from "react";
import { StageSlider } from "./StageSlider";

const TARGETS = ["Marcas", "Negocios", "Startups", "Organizaciones", "Gobiernos", "Fundaciones"];

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

export function RotatingWord({
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
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b));
  return (
    <span className="relative inline-grid align-top max-w-full leading-[1]">
      {/* Ghost sizer keeps layout stable at the widest word */}
      <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
        {longest}
      </span>
      <span
        key={i}
        className={`col-start-1 row-start-1 whitespace-nowrap animate-word-in ${className}`}
      >
        {words[i]}
      </span>
    </span>
  );
}

export function BrutalistHero() {
  return (
    <section className="bg-[#FCFCFA] pt-20 md:pt-16 pb-16 md:pb-20">
      {/* Headline */}
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#111110]/40">
          Estudio Oasis · 12 años
        </p>

        <h1 className="mt-5 font-ultra text-[#111110] leading-[0.9] text-[clamp(46px,11.5vw,220px)] md:text-[min(9.6vw,15vh)]">
          <span className="block">Somos una empresa</span>
          <span className="block">dedicada al <span className="text-[#C5221F]">revenue</span>,</span>
          <span className="block">al crecimiento de</span>
          <span className="block">negocio y de marca.</span>
        </h1>

        <p className="mt-6 md:mt-8 font-condensed text-[clamp(22px,4.6vw,56px)] md:text-[min(3vw,5vh)] leading-[1.05] text-[#111110]/35 flex items-baseline gap-[0.2em] flex-wrap">
          <span>Para</span>
          <RotatingWord words={TARGETS} interval={2600} className="text-[#E8453C]" />
        </p>
      </div>

      {/* Sistema en 5 etapas — slider */}
      <div className="max-w-[1700px] mx-auto px-4 md:px-6 mt-12 md:mt-16 border-t-2 border-[#111110] pt-8 md:pt-10">
        <h2 className="font-ultra text-[clamp(30px,6.4vw,96px)] md:text-[min(5vw,8vh)] leading-[0.95] text-[#111110]">
          Diseñamos crecimiento{" "}
          <span className="text-[#111110]/30">en 5 etapas.</span>
        </h2>
        <p className="mt-3 font-body text-[15px] md:text-[18px] leading-relaxed text-[#111110]/55 max-w-[70ch]">
          Cada etapa la ejecutan los mejores profesionales de la industria, con el mejor software y
          decisiones basadas en datos. Toca cada una para ver cómo funciona.
        </p>

        <StageSlider />
      </div>
    </section>
  );
}
