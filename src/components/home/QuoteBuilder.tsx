import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { PALETTE } from "./heroContent";
import { submitLead } from "@/lib/leads";
import { useLang, type Bi } from "@/i18n/LanguageContext";

type Need = {
  id: string;
  label: Bi;
  /** Plain-language outcome: what the client gets */
  benefit: Bi;
  /** What we actually do */
  work: Bi;
  /** Reference range in USD */
  min: number;
  max: number;
  basis: "mes" | "proyecto";
  time: Bi;
  color: string;
};

const NEEDS: Need[] = [
  {
    id: "diagnostico",
    label: { es: "No sé por dónde empezar", en: "I don't know where to start" },
    benefit: {
      es: "Sales con un mapa: dónde estás, qué está frenando las ventas, qué se arregla primero y cuánto cuesta.",
      en: "You leave with a map: where you stand, what's blocking sales, what to fix first, and what it costs.",
    },
    work: {
      es: "Auditoría de números, canales, embudo y medición. Te entregamos un plan priorizado por impacto.",
      en: "Audit of numbers, channels, funnel, and tracking. You get a plan prioritized by impact.",
    },
    min: 1500,
    max: 4000,
    basis: "proyecto",
    time: { es: "1 a 3 semanas", en: "1 to 3 weeks" },
    color: PALETTE[0],
  },
  {
    id: "marca",
    label: { es: "Mi marca no se ve seria", en: "My brand doesn't look serious" },
    benefit: {
      es: "Tu negocio se ve del tamaño que es y deja de competir sólo por precio.",
      en: "Your business looks its real size and stops competing only on price.",
    },
    work: {
      es: "Posicionamiento, identidad, aplicaciones y lineamientos que cualquiera en tu equipo puede usar.",
      en: "Positioning, identity, applications, and guidelines anyone on your team can use.",
    },
    min: 6000,
    max: 25000,
    basis: "proyecto",
    time: { es: "4 a 10 semanas", en: "4 to 10 weeks" },
    color: PALETTE[3],
  },
  {
    id: "clientes",
    label: { es: "Necesito más clientes", en: "I need more customers" },
    benefit: {
      es: "Un flujo constante de gente interesada, con costo por cliente medido y no adivinado.",
      en: "A steady flow of interested people, with a measured cost per customer instead of a guess.",
    },
    work: {
      es: "Pauta en Meta, Google, TikTok o LinkedIn, según dónde esté tu cliente. Creatividad, medición y lectura semanal.",
      en: "Paid media on Meta, Google, TikTok, or LinkedIn — wherever your customer is. Creative, tracking, and weekly review.",
    },
    min: 2000,
    max: 6000,
    basis: "mes",
    time: { es: "Primeras señales en 2–4 semanas", en: "First signals in 2–4 weeks" },
    color: PALETTE[1],
  },
  {
    id: "contenido",
    label: { es: "Nadie ve mi contenido", en: "Nobody sees my content" },
    benefit: {
      es: "Presencia constante que construye confianza sin que tú tengas que estar improvisando cada semana.",
      en: "Consistent presence that builds trust without you improvising every week.",
    },
    work: {
      es: "Estrategia, producción y calendario: piezas, video corto y comunidad, con un mismo hilo de marca.",
      en: "Strategy, production, and calendar: posts, short video, and community, all on one brand thread.",
    },
    min: 2500,
    max: 7000,
    basis: "mes",
    time: { es: "Arranque en 2 semanas", en: "Kick-off in 2 weeks" },
    color: PALETTE[2],
  },
  {
    id: "tienda",
    label: { es: "Mi tienda online no convierte", en: "My online store doesn't convert" },
    benefit: {
      es: "Más ventas con el mismo tráfico: menos fugas en el checkout y una oferta que sí se entiende.",
      en: "More sales from the same traffic: fewer checkout leaks and an offer people understand.",
    },
    work: {
      es: "Revisión de tienda y checkout, medición limpia, pruebas de oferta y precio, y escalamiento de pauta.",
      en: "Store and checkout review, clean tracking, offer and price testing, and paid scaling.",
    },
    min: 3500,
    max: 12000,
    basis: "mes",
    time: { es: "Primeros arreglos en 2 semanas", en: "First fixes in 2 weeks" },
    color: PALETTE[6],
  },
  {
    id: "retencion",
    label: { es: "Mis clientes no regresan", en: "My customers don't come back" },
    benefit: {
      es: "Vendes más veces al mismo cliente, que es lo más barato que puedes hacer.",
      en: "You sell more times to the same customer — the cheapest growth there is.",
    },
    work: {
      es: "CRM, WhatsApp, email y lealtad. Vemos cuánto gasta cada quién y cada cuándo, y actuamos antes de perderlo.",
      en: "CRM, WhatsApp, email, and loyalty. We look at who spends how much and how often, and act before they leave.",
    },
    min: 2000,
    max: 6000,
    basis: "mes",
    time: { es: "Setup 3–4 semanas", en: "Setup 3–4 weeks" },
    color: PALETTE[5],
  },
  {
    id: "web",
    label: { es: "Necesito sitio o producto digital", en: "I need a site or digital product" },
    benefit: {
      es: "Una pieza que vende sola: rápida, clara y hecha para que la gente haga lo que quieres.",
      en: "A piece that sells on its own: fast, clear, and built for the action you want.",
    },
    work: {
      es: "Diseño y desarrollo de sitio, landings, e-commerce o herramientas internas, con medición desde el día uno.",
      en: "Design and development of sites, landings, e-commerce, or internal tools, measured from day one.",
    },
    min: 4000,
    max: 20000,
    basis: "proyecto",
    time: { es: "3 a 8 semanas", en: "3 to 8 weeks" },
    color: PALETTE[4],
  },
  {
    id: "escala",
    label: { es: "Ya funciona, quiero escalar", en: "It works, I want to scale" },
    benefit: {
      es: "Crecimiento que no depende sólo de la pauta: alianzas, contratos y nuevos canales.",
      en: "Growth that doesn't depend only on ads: partnerships, contracts, and new channels.",
    },
    work: {
      es: "Equipo comercial y de negociación, estructura de alianzas y acompañamiento en decisiones de precio y margen.",
      en: "Sales and negotiation team, partnership structure, and support on pricing and margin decisions.",
    },
    min: 3000,
    max: 9000,
    basis: "mes",
    time: { es: "Trimestre por trimestre", en: "Quarter by quarter" },
    color: PALETTE[7],
  },
];

const STAGES: { id: string; label: Bi; factor: number }[] = [
  { id: "arranque", label: { es: "Estoy arrancando", en: "Just starting" }, factor: 0.85 },
  { id: "marcha", label: { es: "Ya vendo, quiero orden", en: "Selling, need order" }, factor: 1 },
  { id: "escala", label: { es: "Operación grande", en: "Large operation" }, factor: 1.35 },
];

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export function QuoteBuilder() {
  const { lang, t, pick } = useLang();

  const [selected, setSelected] = useState<string[]>([]);
  const [stage, setStage] = useState<string>("marcha");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [context, setContext] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const chosen = NEEDS.filter((n) => selected.includes(n.id));
  const factor = STAGES.find((s) => s.id === stage)?.factor ?? 1;

  const totals = useMemo(() => {
    const monthly = chosen.filter((c) => c.basis === "mes");
    const project = chosen.filter((c) => c.basis === "proyecto");
    const sum = (arr: Need[], k: "min" | "max") =>
      Math.round(arr.reduce((a, c) => a + c[k], 0) * factor);
    return {
      monthlyMin: sum(monthly, "min"),
      monthlyMax: sum(monthly, "max"),
      projectMin: sum(project, "min"),
      projectMax: sum(project, "max"),
      hasMonthly: monthly.length > 0,
      hasProject: project.length > 0,
    };
  }, [chosen, factor]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSend = selected.length > 0 && emailValid;

  const submit = async () => {
    if (!canSend || sending) return;
    setSending(true);
    const res = await submitLead({
      source: "cotizador",
      lang,
      name,
      company,
      email,
      stage: STAGES.find((s) => s.id === stage)?.id,
      needs: chosen.map((c) => c.id),
      context,
      monthly_min: totals.hasMonthly ? totals.monthlyMin : null,
      monthly_max: totals.hasMonthly ? totals.monthlyMax : null,
      project_min: totals.hasProject ? totals.projectMin : null,
      project_max: totals.hasProject ? totals.projectMax : null,
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
      toast.success(
        t("Recibido. Te escribimos pronto.", "Got it. We'll write to you soon."),
      );
    } else {
      toast.error(
        t(
          "No pudimos enviarlo. Escríbenos a r@oasistud.io.",
          "We couldn't send it. Email us at r@oasistud.io.",
        ),
      );
    }
  };

  return (
    <section id="cotizador" className="scroll-mt-20 bg-[hsl(var(--paper))] border-t-2 border-[hsl(var(--ink))] py-16 md:py-24">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-label text-[hsl(var(--ink)/0.40)]">
          {t("Cotizador", "Estimate builder")}
        </p>
        <h2 className="mt-4 font-ultra text-[clamp(34px,7.4vw,120px)] md:text-[min(6vw,10vh)] leading-[0.94] text-[hsl(var(--ink))]">
          {t("Dinos qué necesitas.", "Tell us what you need.")}{" "}
          <span className="text-[hsl(var(--ink)/0.30)]">
            {t("Te decimos cuánto cuesta.", "We'll tell you what it costs.")}
          </span>
        </h2>
        <p className="mt-5 font-body text-[15px] md:text-[18px] leading-relaxed text-[hsl(var(--ink)/0.60)] max-w-[70ch]">
          {t(
            "Sin juntas de descubrimiento eternas ni precios escondidos. Escoge lo que te suene a tu problema y verás de una vez el rango real de inversión y qué ganas con cada cosa.",
            "No endless discovery calls, no hidden pricing. Pick what sounds like your problem and you'll see the real investment range and what you get from each item.",
          )}
        </p>

        {/* Step 1 */}
        <div className="mt-12">
          <h3 className="font-condensed text-[clamp(22px,3.4vw,40px)] leading-none text-[hsl(var(--ink))]">
            {t("1. ¿Qué te está pasando?", "1. What's going on?")}{" "}
            <span className="text-[hsl(var(--ink)/0.35)]">
              {t("(escoge una o varias)", "(pick one or more)")}
            </span>
          </h3>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {NEEDS.map((n) => {
              const on = selected.includes(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() =>
                    setSelected((p) => (on ? p.filter((x) => x !== n.id) : [...p, n.id]))
                  }
                  className="text-left p-4 md:p-5 border-2 transition-colors"
                  style={{
                    borderColor: on ? n.color : "hsl(var(--ink)/0.15)",
                    backgroundColor: on ? `${n.color}12` : "transparent",
                  }}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span
                      className="font-condensed text-[clamp(18px,2.2vw,26px)] leading-[1.05]"
                      style={{ color: on ? n.color : "hsl(var(--ink))" }}
                    >
                      {pick(n.label)}
                    </span>
                    {on && <Check className="h-5 w-5 shrink-0" style={{ color: n.color }} />}
                  </span>
                  <span className="mt-3 block font-body text-[14px] leading-relaxed text-[hsl(var(--ink)/0.60)]">
                    {pick(n.benefit)}
                  </span>
                  <span className="mt-3 block font-label text-[hsl(var(--ink)/0.45)]">
                    {money(n.min)}–{money(n.max)} USD /{" "}
                    {n.basis === "mes" ? t("mes", "month") : t("proyecto", "project")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 */}
        <div className="mt-14">
          <h3 className="font-condensed text-[clamp(22px,3.4vw,40px)] leading-none text-[hsl(var(--ink))]">
            {t("2. ¿En qué momento estás?", "2. Where are you today?")}
          </h3>
          <div className="mt-6 flex flex-wrap gap-3">
            {STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStage(s.id)}
                className={`h-12 px-5 border-2 font-condensed text-[19px] transition-colors ${
                  stage === s.id
                    ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--paper))]"
                    : "border-[hsl(var(--ink)/0.15)] text-[hsl(var(--ink)/0.60)] hover:border-[hsl(var(--ink))] hover:text-[hsl(var(--ink))]"
                }`}
              >
                {pick(s.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3 — summary + capture */}
        <div className="mt-14 border-t-2 border-[hsl(var(--ink))] pt-8 grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <h3 className="font-condensed text-[clamp(22px,3.4vw,40px)] leading-none text-[hsl(var(--ink))]">
              {t("3. Tu rango estimado", "3. Your estimated range")}
            </h3>

            {selected.length === 0 ? (
              <p className="mt-6 font-body text-[15px] md:text-[17px] text-[hsl(var(--ink)/0.50)] max-w-[54ch]">
                {t(
                  "Escoge arriba lo que te está pasando y aquí aparece el rango.",
                  "Pick what's going on above and the range shows up here.",
                )}
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                {totals.hasMonthly && (
                  <div>
                    <p className="font-label text-[hsl(var(--ink)/0.40)]">
                      {t("Trabajo continuo", "Ongoing work")}
                    </p>
                    <p className="font-ultra text-[clamp(34px,7vw,92px)] md:text-[min(4.4vw,7.5vh)] leading-[0.9] text-[hsl(var(--ink))]">
                      {money(totals.monthlyMin)}–{money(totals.monthlyMax)}
                      <span className="block text-[0.42em] text-[hsl(var(--ink)/0.35)]">
                        USD / {t("mes", "month")}
                      </span>
                    </p>
                    <p className="mt-1 font-body text-[13px] text-[hsl(var(--ink)/0.45)]">
                      {t("No incluye inversión en medios.", "Media spend not included.")}
                    </p>
                  </div>
                )}
                {totals.hasProject && (
                  <div>
                    <p className="font-label text-[hsl(var(--ink)/0.40)]">
                      {t("Proyecto de arranque", "Kick-off project")}
                    </p>
                    <p className="font-ultra text-[clamp(34px,7vw,92px)] md:text-[min(4.4vw,7.5vh)] leading-[0.9] text-[hsl(var(--ink))]">
                      {money(totals.projectMin)}–{money(totals.projectMax)}
                      <span className="block text-[0.42em] text-[hsl(var(--ink)/0.35)]">USD</span>
                    </p>
                  </div>
                )}

                <ul className="space-y-4 border-t border-[hsl(var(--ink)/0.15)] pt-6">
                  {chosen.map((c) => (
                    <li key={c.id} className="border-l-2 pl-4" style={{ borderColor: c.color }}>
                      <p className="font-condensed text-[clamp(17px,2vw,24px)] leading-none" style={{ color: c.color }}>
                        {pick(c.label)}
                      </p>
                      <p className="mt-2 font-body text-[14px] md:text-[15px] leading-relaxed text-[hsl(var(--ink)/0.65)]">
                        {pick(c.work)}
                      </p>
                      <p className="mt-1 font-label text-[hsl(var(--ink)/0.40)]">{pick(c.time)}</p>
                    </li>
                  ))}
                </ul>

                <p className="font-body text-[13px] md:text-[14px] leading-relaxed text-[hsl(var(--ink)/0.45)] max-w-[62ch]">
                  {t(
                    "Es un rango de referencia, no una cotización cerrada. El precio final depende del alcance, la urgencia y qué tanto ya tienes armado. Si sale más barato, te lo decimos.",
                    "This is a reference range, not a closed quote. Final pricing depends on scope, urgency, and how much you already have in place. If it can be cheaper, we'll say so.",
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Capture */}
          <div className="bg-[hsl(var(--ink))] p-6 md:p-10 self-start w-full">
            <p className="font-label text-[hsl(var(--paper)/0.45)]">
              {t("Recibe tu propuesta", "Get your proposal")}
            </p>
            <p className="mt-3 font-ultra text-[clamp(26px,5vw,56px)] leading-[0.95] text-[hsl(var(--paper))]">
              {t("Te la mandamos por correo", "We'll send it to your inbox")}
            </p>
            <p className="mt-3 font-body text-[14px] md:text-[15px] leading-relaxed text-[hsl(var(--paper)/0.55)]">
              {t(
                "Con el detalle de lo que harías, en qué orden y el rango cerrado para tu caso. Sin llamada obligatoria.",
                "With the detail of what we'd do, in what order, and a firm range for your case. No mandatory call.",
              )}
            </p>

            <div className="mt-6 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("Tu nombre", "Your name")}
                className="w-full h-12 px-4 bg-transparent border-2 border-[hsl(var(--paper)/0.20)] text-[hsl(var(--paper))] placeholder:text-[hsl(var(--paper)/0.35)] focus:border-[hsl(var(--paper))] outline-none font-body text-[15px]"
              />
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t("Empresa o marca", "Company or brand")}
                className="w-full h-12 px-4 bg-transparent border-2 border-[hsl(var(--paper)/0.20)] text-[hsl(var(--paper))] placeholder:text-[hsl(var(--paper)/0.35)] focus:border-[hsl(var(--paper))] outline-none font-body text-[15px]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("Correo electrónico *", "Email address *")}
                className="w-full h-12 px-4 bg-transparent border-2 border-[hsl(var(--paper)/0.20)] text-[hsl(var(--paper))] placeholder:text-[hsl(var(--paper)/0.35)] focus:border-[hsl(var(--paper))] outline-none font-body text-[15px]"
              />
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
                placeholder={t(
                  "Cuéntanos en tus palabras qué está pasando (opcional pero ayuda mucho)",
                  "Tell us in your own words what's happening (optional, but it helps a lot)",
                )}
                className="w-full p-4 bg-transparent border-2 border-[hsl(var(--paper)/0.20)] text-[hsl(var(--paper))] placeholder:text-[hsl(var(--paper)/0.35)] focus:border-[hsl(var(--paper))] outline-none font-body text-[15px] resize-none"
              />
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!canSend || sending || sent}
              className="mt-5 w-full h-14 flex items-center justify-center gap-2 bg-[hsl(var(--paper))] text-[hsl(var(--ink))] font-condensed text-[21px] hover:bg-[#E8453C] hover:text-[hsl(var(--paper))] transition-colors disabled:opacity-35 disabled:hover:bg-[hsl(var(--paper))] disabled:hover:text-[hsl(var(--ink))]"
            >
              {sent
                ? t("¡Listo, ya viene!", "Done, it's on its way!")
                : sending
                  ? t("Enviando…", "Sending…")
                  : t("Quiero mi propuesta", "Send me my proposal")}
              <ArrowRight className="h-5 w-5" />
            </button>

            <p className="mt-4 font-body text-[12px] leading-relaxed text-[hsl(var(--paper)/0.40)]">
              {t(
                "Usamos tu correo sólo para mandarte la propuesta y darle seguimiento. Nada de listas raras.",
                "We use your email only to send the proposal and follow up. No weird lists.",
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
