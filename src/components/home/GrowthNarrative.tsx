import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang, type Bi } from "@/i18n/LanguageContext";
import { ExpertCTA } from "@/components/ExpertCTA";
import { whatsappUrl } from "@/lib/contact";

const PAINS: Bi[] = [
  { es: "Necesitas tráfico.", en: "You need traffic." },
  { es: "Tu oferta no se entiende.", en: "Your offer is unclear." },
  { es: "Tu sitio pierde conversiones.", en: "Your site leaks conversions." },
  { es: "Nadie da seguimiento.", en: "Nobody follows up." },
  { es: "Tus clientes no regresan.", en: "Customers do not return." },
  { es: "Tus herramientas no se hablan.", en: "Your tools do not talk." },
];

const FLOW: Bi[] = [
  { es: "Website", en: "Website" }, { es: "Contenido", en: "Content" }, { es: "SEO", en: "SEO" },
  { es: "Leads", en: "Leads" }, { es: "CRM", en: "CRM" }, { es: "Seguimiento", en: "Follow-up" },
  { es: "Ventas", en: "Sales" }, { es: "Clientes", en: "Customers" }, { es: "Reseñas", en: "Reviews" },
  { es: "Referidos", en: "Referrals" },
];

export function GrowthInfrastructureSection() {
  const { t, pick } = useLang();
  return (
    <section data-reveal className="border-t-2 border-[hsl(var(--ink))] bg-[hsl(var(--paper))] py-16 md:py-24">
      <div className="mx-auto max-w-[1700px] px-4 md:px-6">
        <p className="font-label text-[hsl(var(--ink)/0.42)]">Growth infrastructure</p>
        <div className="mt-5 grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
          <h2 className="font-ultra text-[clamp(38px,7vw,110px)] leading-[.92] text-[hsl(var(--ink))]">
            {t("El problema rara vez es solamente", "The problem is rarely just")} <span className="text-destructive">{t("conseguir más leads.", "getting more leads.")}</span>
          </h2>
          <div className="border-t-2 border-[hsl(var(--ink))]">
            {PAINS.map((pain) => <p key={pain.es} className="border-b border-[hsl(var(--ink)/.15)] py-3 text-[15px] text-[hsl(var(--ink)/.68)]">{pick(pain)}</p>)}
          </div>
        </div>
        <p className="mt-14 max-w-[70ch] font-condensed text-[clamp(23px,3vw,40px)] leading-[1.08] text-[hsl(var(--ink)/.62)]">
          {t("Conectamos las piezas para que el crecimiento no dependa de una campaña aislada.", "We connect the pieces so growth does not depend on a standalone campaign.")}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-2">
          {FLOW.map((item, i) => <span key={item.es} className="flex items-center gap-2"><span className="border border-[hsl(var(--ink)/.22)] px-3 py-2 font-label text-[hsl(var(--ink))]">{pick(item)}</span>{i < FLOW.length - 1 && <ArrowRight className="h-4 w-4 text-[hsl(var(--ink)/.3)]" />}</span>)}
        </div>
      </div>
    </section>
  );
}

export function PaidMediaPrinciple() {
  const { t } = useLang();
  return (
    <section data-reveal className="bg-[hsl(var(--ink))] py-20 md:py-28">
      <div className="mx-auto max-w-[1700px] px-4 md:px-6">
        <p className="font-label text-[hsl(var(--paper)/.45)]">{t("Una regla sencilla", "One simple rule")}</p>
        <h2 className="mt-5 max-w-[16ch] font-ultra text-[clamp(42px,9vw,150px)] leading-[.88] text-[hsl(var(--paper))]">
          {t("La pauta no debería ser tu sistema de crecimiento.", "Paid media should not be your growth system.")}
        </h2>
        <p className="mt-8 max-w-[24ch] font-condensed text-[clamp(24px,4vw,54px)] leading-[1.02] text-destructive">
          {t("Debería ser el acelerador de un sistema que ya funciona.", "It should accelerate a system that already works.")}
        </p>
        <div className="mt-12 grid grid-cols-2 border-t border-[hsl(var(--paper)/.2)] md:grid-cols-5">
          {[t("Construimos", "Build"), t("Medimos", "Measure"), t("Automatizamos", "Automate"), t("Corregimos", "Correct"), t("Compramos tráfico", "Buy traffic")].map((step, i) => <div key={step} className="border-b border-r border-[hsl(var(--paper)/.14)] p-4 md:border-b-0 md:p-6"><span className="font-ultra text-[34px] text-[hsl(var(--paper)/.25)]">0{i + 1}</span><p className="mt-2 font-condensed text-[20px] leading-none text-[hsl(var(--paper))]">{step}</p></div>)}
        </div>
      </div>
    </section>
  );
}

export function OasisLabsSection() {
  const { t, lang } = useLang();
  return (
    <section data-reveal className="border-t-2 border-[hsl(var(--ink))] bg-[hsl(var(--paper))] py-16 md:py-24">
      <div className="mx-auto grid max-w-[1700px] gap-10 px-4 md:px-6 lg:grid-cols-[.72fr_1.28fr]">
        <div><p className="font-label text-destructive">Oasis / Labs</p><p className="mt-3 font-label text-[hsl(var(--ink)/.45)]">Early access · 2026</p></div>
        <div>
          <h2 className="font-ultra text-[clamp(40px,7vw,110px)] leading-[.9] text-[hsl(var(--ink))]">Growth Infrastructure</h2>
          <p className="mt-6 max-w-[68ch] text-[15px] leading-relaxed text-[hsl(var(--ink)/.62)] md:text-[18px]">{t("Estamos construyendo una nueva capa de Oasis para que CRM, leads, seguimiento, automatizaciones, reputación, contenido y ventas convivan dentro de un mismo sistema. Todavía la desarrollamos con clientes seleccionados.", "We are building a new layer of Oasis so CRM, leads, follow-up, automations, reputation, content, and sales can live in one system. We are still developing it with selected clients.")}</p>
          <a href={whatsappUrl("Oasis Labs", lang)} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center gap-2 border-2 border-[hsl(var(--ink))] px-5 font-label text-[hsl(var(--ink))] hover:bg-[hsl(var(--ink))] hover:text-[hsl(var(--paper))]">{t("Quiero ser de los primeros", "I want early access")} <ArrowUpRight className="h-4 w-4" /></a>
        </div>
      </div>
    </section>
  );
}

export function HumanContactSection() {
  const { t } = useLang();
  return (
    <section data-reveal className="border-t-2 border-[hsl(var(--ink))] bg-[hsl(var(--paper))] py-16 md:py-24">
      <div className="mx-auto max-w-[1700px] px-4 md:px-6">
        <p className="font-label text-destructive">{t("Contacto humano", "Human contact")}</p>
        <h2 className="mt-5 max-w-[16ch] font-ultra text-[clamp(42px,8vw,130px)] leading-[.9] text-[hsl(var(--ink))]">{t("No te va a contestar un bot.", "A bot will not answer you.")}</h2>
        <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-[hsl(var(--ink)/.62)] md:text-[18px]">{t("Cuando escribes desde esta página, hablas con un experto de Oasis. Cuéntanos qué vendes, qué funciona, qué no y qué quieres conseguir. Si podemos ayudar, te diremos cómo. Si el problema está en otro lado, también.", "When you write from this page, you talk to an Oasis expert. Tell us what you sell, what works, what does not, and what you want to achieve. If we can help, we will tell you how. If the problem is elsewhere, we will say that too.")}</p>
        <div className="mt-8"><ExpertCTA source="home-contacto-humano" /></div>
        <p className="mt-8 max-w-[64ch] font-condensed text-[clamp(20px,3vw,34px)] leading-[1.08] text-[hsl(var(--ink)/.42)]">{t("La automatización existe para quitar trabajo repetitivo, no para esconder personas cuando sí las necesitas.", "Automation exists to remove repetitive work, not to hide people when you actually need them.")}</p>
      </div>
    </section>
  );
}

export function CollectiveBridge() {
  const { t } = useLang();
  return (
    <section data-reveal className="border-t border-[hsl(var(--ink)/.18)] bg-[hsl(var(--paper))] py-12">
      <div className="mx-auto flex max-w-[1700px] flex-col items-start justify-between gap-6 px-4 md:px-6 lg:flex-row lg:items-end">
        <div><p className="font-label text-[hsl(var(--ink)/.42)]">Colectivo Anti-Vendehumo</p><h2 className="mt-3 font-condensed text-[clamp(26px,4vw,52px)] leading-none text-[hsl(var(--ink))]">{t("¿Quieres aprender antes de contratar?", "Want to learn before hiring?")}</h2><p className="mt-3 max-w-[64ch] text-[15px] text-[hsl(var(--ink)/.58)]">{t("Una iniciativa independiente creada por Roger Terán para aprender a distinguir estrategia, herramientas y humo.", "An independent initiative created by Roger Terán to distinguish strategy, tools, and smoke.")}</p></div>
        <Link to="/recursos/colectivo-anti-vendehumo" className="inline-flex min-h-12 shrink-0 items-center gap-2 border-2 border-[hsl(var(--ink))] px-5 font-label text-[hsl(var(--ink))]">{t("Visitar el Colectivo", "Visit the Collective")} <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  );
}
