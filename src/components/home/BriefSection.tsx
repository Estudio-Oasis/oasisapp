import { useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { submitLead } from "@/lib/leads";
import { useLang, type Bi } from "@/i18n/LanguageContext";

const SIZES: Bi[] = [
  { es: "Solo yo", en: "Just me" },
  { es: "2–10", en: "2–10" },
  { es: "11–50", en: "11–50" },
  { es: "51–200", en: "51–200" },
  { es: "200+", en: "200+" },
];

const REVENUE: Bi[] = [
  { es: "Aún no vendo", en: "Not selling yet" },
  { es: "< $100k MXN / mes", en: "< $5k USD / month" },
  { es: "$100k – $500k MXN", en: "$5k – $25k USD" },
  { es: "$500k – $2M MXN", en: "$25k – $100k USD" },
  { es: "$2M – $10M MXN", en: "$100k – $500k USD" },
  { es: "$10M+ MXN", en: "$500k+ USD" },
];

const CHANNELS: Bi[] = [
  { es: "Tienda online", en: "Online store" },
  { es: "Punto de venta", en: "Physical store" },
  { es: "Meta Ads", en: "Meta Ads" },
  { es: "Google Ads", en: "Google Ads" },
  { es: "TikTok", en: "TikTok" },
  { es: "LinkedIn / B2B", en: "LinkedIn / B2B" },
  { es: "Ventas por WhatsApp", en: "WhatsApp sales" },
  { es: "Equipo comercial", en: "Sales team" },
  { es: "Marketplace", en: "Marketplace" },
  { es: "Email / CRM", en: "Email / CRM" },
];

const GOALS: Bi[] = [
  { es: "Vender más", en: "Sell more" },
  { es: "Bajar costo de adquisición", en: "Lower acquisition cost" },
  { es: "Que me conozcan (marca)", en: "Brand awareness" },
  { es: "Retener clientes", en: "Retain customers" },
  { es: "Ordenar mis datos", en: "Get my data in order" },
  { es: "Escalar / levantar inversión", en: "Scale / raise investment" },
];

const STEPS: Bi[] = [
  { es: "Tu negocio", en: "Your business" },
  { es: "Dónde estás", en: "Where you are" },
  { es: "Qué está pasando", en: "What's going on" },
];

type Form = {
  business: string;
  site: string;
  size: string;
  revenue: string;
  channels: string[];
  goals: string[];
  context: string;
  tried: string;
  name: string;
  contact: string;
};

const EMPTY: Form = {
  business: "",
  site: "",
  size: "",
  revenue: "",
  channels: [],
  goals: [],
  context: "",
  tried: "",
  name: "",
  contact: "",
};

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-label px-3 md:px-4 py-2.5 border-2 transition-colors ${
        on
          ? "border-[#C5221F] bg-[#C5221F] text-[hsl(var(--paper))]"
          : "border-[hsl(var(--ink)/0.15)] text-[hsl(var(--ink)/0.60)] hover:border-[hsl(var(--ink))] hover:text-[hsl(var(--ink))]"
      }`}
    >
      {label}
    </button>
  );
}

const inputClass =
  "w-full bg-transparent border-b-2 border-[hsl(var(--ink)/0.15)] focus:border-[#C5221F] outline-none py-3 font-condensed text-[clamp(19px,3vw,34px)] leading-none text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink)/0.25)] transition-colors";

const labelClass = "font-label text-[hsl(var(--ink)/0.40)]";

const areaClass =
  "mt-2 w-full bg-transparent border-2 border-[hsl(var(--ink)/0.15)] focus:border-[#C5221F] outline-none p-4 font-body text-[15px] md:text-[17px] leading-relaxed text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink)/0.30)] transition-colors";

export function BriefSection() {
  const { t, lang, pick } = useLang();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (k: "channels" | "goals", v: string) =>
    setF((p) => ({
      ...p,
      [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v],
    }));

  const send = async () => {
    if (sending || sent) return;
    if (!f.contact.trim()) {
      toast.error(
        t("Déjanos un correo o WhatsApp.", "Leave us an email or WhatsApp number."),
      );
      return;
    }
    setSending(true);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact.trim());
    const res = await submitLead({
      source: "brief",
      lang,
      name: f.name,
      email: isEmail ? f.contact : undefined,
      contact: f.contact,
      business: f.business,
      website: f.site,
      team_size: f.size,
      revenue_range: f.revenue,
      channels: f.channels,
      goals: f.goals,
      context: f.context,
      tried: f.tried,
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
      toast.success(
        t(
          "Brief recibido. Te respondemos en menos de 24 h.",
          "Brief received. We'll reply within 24 hours.",
        ),
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
    <section
      id="brief"
      className="bg-[hsl(var(--paper))] border-t-2 border-[hsl(var(--ink))] pt-10 md:pt-16 pb-16 md:pb-28 scroll-mt-20"
    >
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <h2 className="font-ultra text-[clamp(34px,8.4vw,150px)] md:text-[min(7.4vw,12vh)] leading-[0.92] text-[hsl(var(--ink))]">
          {t("¿De qué trata", "What's your")}{" "}
          <span className="text-[#C5221F]">{t("tu negocio?", "business about?")}</span>
        </h2>
        <p className="mt-4 font-body text-[15px] md:text-[18px] leading-relaxed text-[hsl(var(--ink)/0.55)] max-w-[68ch]">
          {t(
            "No nos digas sólo “quiero más ventas”. Danos contexto real y te regresamos un diagnóstico y un plan, no una propuesta genérica.",
            "Don't just tell us “I want more sales”. Give us real context and we'll come back with a diagnosis and a plan, not a generic proposal.",
          )}
        </p>

        {/* Progreso */}
        <div className="mt-8 grid grid-cols-3 gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.es}
              type="button"
              onClick={() => setStep(i)}
              className={`text-left border-t-4 pt-2 transition-colors ${
                i <= step ? "border-[#C5221F]" : "border-[hsl(var(--ink)/0.12)]"
              }`}
            >
              <span
                className={`font-label block leading-tight ${
                  i <= step ? "text-[hsl(var(--ink))]" : "text-[hsl(var(--ink)/0.35)]"
                }`}
              >
                0{i + 1} {pick(s)}
              </span>
            </button>
          ))}
        </div>

        <div key={step} className="mt-8 md:mt-10 animate-rise-in">
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-8">
                <label className="block">
                  <span className={labelClass}>{t("A qué se dedica", "What it does")}</span>
                  <input
                    className={inputClass}
                    value={f.business}
                    onChange={(e) => set("business", e.target.value)}
                    placeholder={t(
                      "Ej. Tienda de trajes de baño D2C",
                      "e.g. D2C swimwear store",
                    )}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("Sitio o redes", "Site or socials")}</span>
                  <input
                    className={inputClass}
                    value={f.site}
                    onChange={(e) => set("site", e.target.value)}
                    placeholder="tumarca.com / @tumarca"
                  />
                </label>
              </div>
              <div className="space-y-8">
                <div>
                  <span className={labelClass}>{t("Tamaño del equipo", "Team size")}</span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SIZES.map((s) => (
                      <Chip
                        key={s.es}
                        label={pick(s)}
                        on={f.size === s.es}
                        onClick={() => set("size", s.es)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className={labelClass}>{t("Ventas actuales", "Current sales")}</span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {REVENUE.map((s) => (
                      <Chip
                        key={s.es}
                        label={pick(s)}
                        on={f.revenue === s.es}
                        onClick={() => set("revenue", s.es)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <span className={labelClass}>
                  {t("Canales activos hoy", "Channels active today")}
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CHANNELS.map((s) => (
                    <Chip
                      key={s.es}
                      label={pick(s)}
                      on={f.channels.includes(s.es)}
                      onClick={() => toggle("channels", s.es)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className={labelClass}>
                  {t("Qué necesitas primero", "What you need first")}
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {GOALS.map((s) => (
                    <Chip
                      key={s.es}
                      label={pick(s)}
                      on={f.goals.includes(s.es)}
                      onClick={() => toggle("goals", s.es)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-6">
                <label className="block">
                  <span className={labelClass}>{t("Qué está pasando", "What's going on")}</span>
                  <textarea
                    rows={4}
                    className={areaClass}
                    value={f.context}
                    onChange={(e) => set("context", e.target.value)}
                    placeholder={t(
                      "Cuéntanos sin filtro: qué se cayó, qué te preocupa, qué números no cuadran.",
                      "Tell us straight: what broke, what worries you, which numbers don't add up.",
                    )}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>
                    {t("Qué ya intentaste", "What you've already tried")}
                  </span>
                  <textarea
                    rows={3}
                    className={areaClass}
                    value={f.tried}
                    onChange={(e) => set("tried", e.target.value)}
                    placeholder={t(
                      "Agencias, pauta, rediseños, gente nueva…",
                      "Agencies, ads, redesigns, new hires…",
                    )}
                  />
                </label>
              </div>
              <div className="space-y-8">
                <label className="block">
                  <span className={labelClass}>{t("Tu nombre", "Your name")}</span>
                  <input
                    className={inputClass}
                    value={f.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder={t("Nombre", "Name")}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>
                    {t("Correo o WhatsApp", "Email or WhatsApp")}
                  </span>
                  <input
                    className={inputClass}
                    value={f.contact}
                    onChange={(e) => set("contact", e.target.value)}
                    placeholder="tu@correo.com"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Navegación */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              aria-label={t("Anterior", "Previous")}
              className="h-12 w-12 flex items-center justify-center border-2 border-[hsl(var(--ink)/0.15)] hover:border-[hsl(var(--ink))] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[hsl(var(--ink))]" />
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="h-12 px-5 md:px-6 flex items-center gap-2 bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:bg-[#C5221F] transition-colors font-label"
            >
              {t("Siguiente", "Next")}: {pick(STEPS[step + 1])}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={send}
              disabled={sending || sent}
              className="h-12 px-5 md:px-6 flex items-center gap-2 bg-[#C5221F] text-[hsl(var(--paper))] hover:bg-[hsl(var(--ink))] transition-colors font-label disabled:opacity-40"
            >
              {sent
                ? t("Brief enviado", "Brief sent")
                : sending
                  ? t("Enviando…", "Sending…")
                  : t("Enviar brief", "Send brief")}
              <Check className="h-4 w-4" />
            </button>
          )}
          <span className="font-label text-[hsl(var(--ink)/0.35)]">
            {t("Respondemos en menos de 24 h", "We reply within 24 hours")}
          </span>
        </div>
      </div>
    </section>
  );
}
