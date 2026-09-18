import { useLang } from "@/i18n/LanguageContext";
import { ExpertCTA } from "@/components/ExpertCTA";

export function ClosingCTA() {
  const { t } = useLang();
  return <section data-reveal className="bg-[hsl(var(--ink))] py-24 md:py-28"><div className="mx-auto max-w-[1700px] px-4 md:px-6">
    <p className="font-label text-[hsl(var(--paper)/.4)]">{t("¿No sabes qué necesitas?", "Not sure what you need?")}</p>
    <h2 className="mt-6 font-ultra text-[clamp(54px,13vw,230px)] leading-[.85] text-[hsl(var(--paper))] md:text-[min(10.5vw,16vh)]"><span className="block">{t("Perfecto.", "Perfect.")}</span><span className="block text-destructive">{t("Empecemos por diagnosticar.", "Let's start with a diagnosis.")}</span></h2>
    <p className="mt-8 max-w-[42ch] font-condensed text-[clamp(18px,3.4vw,40px)] leading-[1.06] text-[hsl(var(--paper)/.5)]">{t("No necesitas llegar sabiendo si tu problema es pauta, marca, automatización, CRM, contenido o conversión.", "You do not need to know whether the problem is media, brand, automation, CRM, content, or conversion.")}</p>
    <div className="mt-10"><ExpertCTA source="cierre" inverse /></div>
    <p className="mt-10 max-w-[76ch] font-label leading-loose text-[hsl(var(--paper)/.42)]">{t("Estrategia antes que herramientas. Sistemas antes que campañas. Growth antes que actividad.", "Strategy before tools. Systems before campaigns. Growth before activity.")}</p>
  </div></section>;
}
