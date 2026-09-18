import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { submitLead } from "@/lib/leads";
import { useLang } from "@/i18n/LanguageContext";

const KEY = "oasis-growth-waitlist";

export function WaitlistForm() {
  const { t, lang } = useLang();
  const [joined, setJoined] = useState(() => localStorage.getItem(KEY) === "joined");
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", business: "", consent: false });
  const [sending, setSending] = useState(false);
  const valid =
    form.name.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.consent;

  const submit = async () => {
    if (!valid || sending) return;
    setSending(true);
    const result = await submitLead({
      source: "sistema",
      lang,
      name: form.name,
      email: form.email,
      contact: form.whatsapp,
      business: form.business,
      marketing_consent: form.consent,
      consented_at: new Date().toISOString(),
      context: "Lista de espera · Sistema de Crecimiento Oasis",
    });
    setSending(false);
    if (!result.ok) {
      toast.error(t("No pudimos guardar tu registro. Intenta de nuevo.", "We could not save your signup. Try again."));
      return;
    }
    localStorage.setItem(KEY, "joined");
    setJoined(true);
    toast.success(t("Estás en la lista", "You are on the list"));
  };

  const input =
    "w-full h-13 px-4 bg-transparent border-2 border-[hsl(var(--ink)/0.2)] focus:border-[hsl(var(--ink))] outline-none text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink)/0.35)]";

  if (joined)
    return (
      <div className="border-2 border-[hsl(var(--ink))] p-6 md:p-8">
        <span className="h-10 w-10 rounded-full bg-[#C5221F] text-[hsl(var(--paper))] flex items-center justify-center">
          <Check className="h-5 w-5" />
        </span>
        <p className="mt-5 font-condensed text-[clamp(24px,3.4vw,38px)] leading-[1.05] text-[hsl(var(--ink))]">
          {t("Estás en la lista. Te avisamos antes que a nadie.", "You are on the list. We will tell you before anyone else.")}
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-[hsl(var(--ink)/0.55)]">
          {t(
            "Cuando abramos las primeras plazas te escribimos con el alcance real, lo que incluye y lo que cuesta. Sin sorpresas.",
            "When we open the first spots we will write with the real scope, what is included, and what it costs. No surprises.",
          )}
        </p>
      </div>
    );

  return (
    <div className="border-t-2 border-[hsl(var(--ink))] pt-6">
      <div className="space-y-3">
        <input
          className={input}
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder={t("Nombre *", "Name *")}
          aria-label={t("Nombre", "Name")}
        />
        <input
          className={input}
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder={t("Correo electrónico *", "Email address *")}
          aria-label={t("Correo electrónico", "Email address")}
        />
        <input
          className={input}
          value={form.whatsapp}
          onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
          placeholder={t("WhatsApp (opcional)", "WhatsApp (optional)")}
          aria-label="WhatsApp"
        />
        <input
          className={input}
          value={form.business}
          onChange={(e) => setForm((p) => ({ ...p, business: e.target.value }))}
          placeholder={t("¿A qué se dedica tu negocio? (opcional)", "What does your business do? (optional)")}
          aria-label={t("Tu negocio", "Your business")}
        />
      </div>
      <label className="mt-4 flex gap-3 text-[12px] leading-relaxed text-[hsl(var(--ink)/0.55)] cursor-pointer">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => setForm((p) => ({ ...p, consent: e.target.checked }))}
          className="mt-1 h-4 w-4 accent-[#C5221F]"
        />
        <span>
          {t(
            "Acepto que me escriban cuando abra el sistema. Puedo darme de baja cuando quiera.",
            "I agree to be contacted when the system opens. I can unsubscribe at any time.",
          )}{" "}
          <Link to="/aviso-de-privacidad" className="underline text-[hsl(var(--ink))]">
            {t("Aviso de privacidad", "Privacy notice")}
          </Link>
          .
        </span>
      </label>
      <button
        type="button"
        onClick={submit}
        disabled={!valid || sending}
        className="mt-6 w-full h-14 flex items-center justify-center gap-2 bg-[hsl(var(--ink))] text-[hsl(var(--paper))] font-condensed text-[21px] disabled:opacity-35"
      >
        {sending ? t("Guardando…", "Saving…") : t("Avísenme primero", "Tell me first")}
        <ArrowRight className="h-5 w-5" />
      </button>
      <p className="mt-4 font-label text-[hsl(var(--ink)/0.4)]">
        {t("Todavía no está abierto y no hay precio final.", "It is not open yet and there is no final price.")}
      </p>
    </div>
  );
}
