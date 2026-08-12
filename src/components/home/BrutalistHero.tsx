import { useEffect, useState } from "react";
import { StageSlider } from "./StageSlider";
import { useLang, type Bi } from "@/i18n/LanguageContext";

const TARGETS: Bi[] = [
  { es: "Marcas", en: "Brands" },
  { es: "Negocios", en: "Businesses" },
  { es: "Startups", en: "Startups" },
  { es: "Organizaciones", en: "Organizations" },
  { es: "Gobiernos", en: "Governments" },
  { es: "Fundaciones", en: "Foundations" },
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
  const { t, pick } = useLang();

  return (
    <section className="bg-[hsl(var(--paper))] pt-20 md:pt-16 pb-14 md:pb-20">
      {/* Headline */}
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <h1 className="font-ultra text-[hsl(var(--ink))] leading-[0.9] text-[clamp(42px,11vw,220px)] md:text-[min(9.6vw,15vh)]">
          <span className="block">{t("Somos una empresa", "We are a company")}</span>
          <span className="block">
            {t("dedicada al", "built for")}{" "}
            <span className="text-[#C5221F]">revenue</span>,
          </span>
          <span className="block">{t("al crecimiento de", "business growth")}</span>
          <span className="block">{t("negocio y de marca.", "and brand growth.")}</span>
        </h1>

        <p className="mt-6 md:mt-8 font-condensed text-[clamp(20px,4.4vw,56px)] md:text-[min(3vw,5vh)] leading-[1.05] text-[hsl(var(--ink)/0.35)] flex items-baseline gap-[0.2em] flex-wrap">
          <span>{t("Para", "For")}</span>
          <RotatingWord
            words={TARGETS.map(pick)}
            interval={2600}
            className="text-[#E8453C]"
          />
        </p>
      </div>

      {/* Sistema en 5 etapas — slider */}
      <div className="max-w-[1700px] mx-auto px-4 md:px-6 mt-10 md:mt-16 border-t-2 border-[hsl(var(--ink))] pt-7 md:pt-10">
        <h2 className="font-ultra text-[clamp(28px,6.4vw,96px)] md:text-[min(5vw,8vh)] leading-[0.95] text-[hsl(var(--ink))]">
          {t("Diseñamos crecimiento", "We design growth")}{" "}
          <span className="text-[hsl(var(--ink)/0.30)]">
            {t("en 5 etapas.", "in 5 stages.")}
          </span>
        </h2>
        <p className="mt-3 font-body text-[15px] md:text-[18px] leading-relaxed text-[hsl(var(--ink)/0.55)] max-w-[70ch]">
          {t(
            "Cada etapa la ejecutan los mejores profesionales de la industria, con el mejor software y decisiones basadas en datos. Toca cada una para ver cómo funciona.",
            "Every stage is run by the best professionals in the industry, with the best software and decisions based on data. Tap any one to see how it works.",
          )}
        </p>

        <StageSlider />
      </div>
    </section>
  );
}
