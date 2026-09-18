import { useEffect, useState } from "react";
import { StageSlider } from "./StageSlider";
import { useLang, type Bi } from "@/i18n/LanguageContext";
import { ExpertCTA } from "@/components/ExpertCTA";

const TARGETS: Bi[] = [
  { es: "Marcas", en: "Brands" }, { es: "Negocios", en: "Businesses" },
  { es: "Startups", en: "Startups" }, { es: "Organizaciones", en: "Organizations" },
  { es: "Gobiernos", en: "Governments" }, { es: "Fundaciones", en: "Foundations" },
];

function useRotator(length: number, interval: number) {
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((p) => (p + 1) % length), interval); return () => clearInterval(id); }, [length, interval]);
  return i;
}

function RotatingWord({ words }: { words: string[] }) {
  const i = useRotator(words.length, 2600);
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b));
  return <span className="relative inline-grid max-w-full align-top leading-[1]"><span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">{longest}</span><span key={i} className="col-start-1 row-start-1 whitespace-nowrap text-destructive animate-word-in">{words[i]}</span></span>;
}

export function BrutalistHero() {
  const { t, pick } = useLang();
  return <section className="overflow-x-clip bg-[hsl(var(--paper))] pb-14 pt-32 md:pb-20 md:pt-28">
    <div className="mx-auto min-w-0 max-w-[1700px] px-4 md:px-6">
      <h1 className="font-ultra text-[clamp(42px,11vw,220px)] leading-[.88] text-[hsl(var(--ink))] md:text-[min(9.6vw,15vh)]">
        <span className="block">{t("No necesitas", "You do not need")}</span>
        <span className="block text-destructive">{t("más marketing.", "more marketing.")}</span>
        <span className="mt-3 block max-w-[18ch] text-[.62em] leading-[.94] text-[hsl(var(--ink)/.42)]">{t("Necesitas un sistema que convierta atención en crecimiento.", "You need a system that turns attention into growth.")}</span>
      </h1>
      <p className="mt-7 max-w-[72ch] text-[15px] leading-relaxed text-[hsl(var(--ink)/.58)] md:text-[18px]">{t("Conectamos estrategia, creatividad, adquisición, tecnología, automatización y ventas para construir sistemas de crecimiento medibles.", "We connect strategy, creative, acquisition, technology, automation, and sales to build measurable growth systems.")}</p>
      <p className="mt-4 font-label text-[hsl(var(--ink)/.42)]">Strategy · Brand · Content · Acquisition · Automation · Sales Infrastructure</p>
      <div className="mt-7"><ExpertCTA source="home-hero" /></div>
      <p className="mt-8 flex flex-wrap items-baseline gap-[.2em] font-condensed text-[clamp(20px,4.4vw,56px)] leading-[1.05] text-[hsl(var(--ink)/.35)] md:text-[min(3vw,5vh)]"><span>{t("Para", "For")}</span><RotatingWord words={TARGETS.map(pick)} /></p>
    </div>
    <div className="mx-auto mt-10 min-w-0 max-w-[1700px] overflow-hidden border-t-2 border-[hsl(var(--ink))] px-4 pt-7 md:mt-16 md:px-6 md:pt-10">
      <h2 className="font-ultra text-[clamp(28px,6.4vw,96px)] leading-[.95] text-[hsl(var(--ink))] md:text-[min(5vw,8vh)]">{t("Diseñamos crecimiento", "We design growth")} <span className="text-[hsl(var(--ink)/.3)]">{t("en 5 etapas.", "in 5 stages.")}</span></h2>
      <p className="mt-3 max-w-[70ch] text-[15px] leading-relaxed text-[hsl(var(--ink)/.55)] md:text-[18px]">{t("Cada etapa conecta criterio, especialistas, tecnología y datos. Toca cada una para ver cómo funciona.", "Each stage connects judgment, specialists, technology, and data. Tap any one to see how it works.")}</p>
      <StageSlider />
    </div>
  </section>;
}
