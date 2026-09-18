import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { submitLead } from "@/lib/leads";
import { useLang } from "@/i18n/LanguageContext";

export function CollectiveGate({ onUnlock }: { onUnlock: () => void }) {
  const { t, lang } = useLang();
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", consent: false });
  const [sending, setSending] = useState(false);
  const valid = form.name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && form.consent;
  const submit = async () => {
    if (!valid || sending) return;
    setSending(true);
    const result = await submitLead({ source: "colectivo", lang, name: form.name, email: form.email, contact: form.whatsapp, marketing_consent: form.consent, consented_at: new Date().toISOString(), context: "Acceso al Colectivo Anti-Vendehumo" });
    setSending(false);
    if (!result.ok) { toast.error(t("No pudimos guardar tu acceso. Intenta de nuevo.", "We could not save your access. Try again.")); return; }
    localStorage.setItem("anti-vendehumo-access", "granted");
    toast.success(t("Acceso desbloqueado", "Access unlocked"));
    onUnlock();
  };
  const input = "w-full h-13 px-4 bg-transparent border-2 border-[hsl(var(--paper)/0.22)] focus:border-[hsl(var(--paper))] outline-none text-[hsl(var(--paper))] placeholder:text-[hsl(var(--paper)/0.35)]";
  return <section id="entrar" className="bg-[hsl(var(--ink))] text-[hsl(var(--paper))] py-16 md:py-24 scroll-mt-16"><div className="max-w-[1100px] mx-auto px-4 md:px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-20"><div><p className="font-label text-[#F28B82]">02 / 05 · {t("Punto de compromiso", "Commitment point")}</p><h2 className="mt-5 font-ultra text-[clamp(38px,7vw,96px)] leading-[0.92]">{t("No queremos otra comunidad coleccionando frameworks.", "We do not want another community collecting frameworks.")}</h2><p className="mt-6 max-w-[58ch] text-[15px] md:text-[18px] leading-relaxed text-[hsl(var(--paper)/0.62)]">{t("Queremos empresarios que compartan experiencias, comparen números y aprendan a distinguir actividad de estrategia. Entra para desbloquear el diagnóstico, las herramientas y el playbook.", "We want business owners who share experiences, compare numbers, and learn to distinguish activity from strategy. Join to unlock the diagnosis, tools, and playbook.")}</p></div><div className="border-t-2 border-[hsl(var(--paper))] pt-6"><div className="space-y-3"><input className={input} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder={t("Nombre *", "Name *")}/><input className={input} type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder={t("Correo electrónico *", "Email address *")}/><input className={input} value={form.whatsapp} onChange={e=>setForm(p=>({...p,whatsapp:e.target.value}))} placeholder={t("WhatsApp (opcional)", "WhatsApp (optional)")}/></div><label className="mt-4 flex gap-3 text-[12px] leading-relaxed text-[hsl(var(--paper)/0.55)] cursor-pointer"><input type="checkbox" checked={form.consent} onChange={e=>setForm(p=>({...p,consent:e.target.checked}))} className="mt-1 h-4 w-4 accent-[#C5221F]"/><span>{t("Acepto recibir el playbook y comunicaciones del Colectivo. Puedo darme de baja cuando quiera.", "I agree to receive the playbook and Collective updates. I can unsubscribe at any time.")} <Link to="/aviso-de-privacidad" className="underline text-[hsl(var(--paper))]">{t("Aviso de privacidad", "Privacy notice")}</Link>.</span></label><button type="button" onClick={submit} disabled={!valid||sending} className="mt-6 w-full h-14 flex items-center justify-center gap-2 bg-[hsl(var(--paper))] text-[hsl(var(--ink))] font-condensed text-[21px] disabled:opacity-35">{sending?t("Guardando…","Saving…"):t("Entrar al colectivo","Join the collective")}<ArrowRight className="h-5 w-5"/></button><p className="mt-4 flex items-center gap-2 font-label text-[hsl(var(--paper)/0.4)]"><Check className="h-4 w-4"/>{t("Sin spam. Sin fórmulas secretas.", "No spam. No secret formulas.")}</p></div></div></section>;
}
