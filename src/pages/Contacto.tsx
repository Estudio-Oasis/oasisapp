import { useState } from "react";
import { Link } from "react-router-dom";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SiteFooter } from "@/components/SiteFooter";
import { toast } from "sonner";
import { ArrowRight, Mail, Phone, Globe, MapPin } from "lucide-react";

const NEED_OPTIONS = [
  "Branding / Identidad de marca",
  "Marketing y publicidad",
  "Sitio web o app",
  "Todo lo anterior",
  "No sé, necesito orientación",
];

const BUDGET_OPTIONS = [
  "Menos de $20,000 MXN",
  "$20,000 – $50,000 MXN",
  "$50,000 – $150,000 MXN",
  "Más de $150,000 MXN",
  "Prefiero no decirlo",
];

interface FormState {
  name: string;
  email: string;
  company: string;
  need: string;
  budget: string;
  message: string;
}

const INITIAL: FormState = {
  name: "",
  email: "",
  company: "",
  need: "",
  budget: "",
  message: "",
};

export default function ContactoPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [sending, setSending] = useState(false);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Completa los campos requeridos");
      return;
    }
    setSending(true);
    const submissionId = crypto.randomUUID();
    try {
      // Send confirmation to the person who submitted
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: form.email,
          idempotencyKey: `contact-confirm-${submissionId}`,
          templateData: { name: form.name, company: form.company, need: form.need },
        },
      });
      // Send internal notification to agency
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-internal",
          recipientEmail: "r@oasistud.io",
          idempotencyKey: `contact-internal-${submissionId}`,
          templateData: {
            name: form.name,
            email: form.email,
            company: form.company,
            need: form.need,
            budget: form.budget,
            message: form.message,
          },
        },
      });
      toast.success("¡Mensaje enviado! Te contactaremos pronto.");
      setForm(INITIAL);
    } catch (err) {
      console.error("Contact form error:", err);
      toast.error("Error al enviar. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const prefillIntern = () => {
    setForm((p) => ({
      ...p,
      need: "No sé, necesito orientación",
      message:
        "Hola, me interesa hacer prácticas profesionales en Estudio Oasis.",
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const inputCls =
    "w-full h-11 px-4 rounded-sm border border-gray-300 bg-white text-[14px] text-gray-900 font-body focus:outline-none focus:border-[#C8A96E] transition-colors";
  const selectCls = `${inputCls} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2378716c%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center] bg-[length:16px]`;

  return (
    <div className="min-h-screen font-body">
      <SiteNavbar />

      <div className="pt-16 min-h-screen flex flex-col lg:flex-row">
        {/* Left — Info */}
        <div className="lg:w-[40%] bg-[#1C1917] text-white px-6 md:px-12 py-10 lg:py-24 lg:sticky lg:top-0 lg:h-screen flex flex-col justify-center">
          <h1 className="font-serif-display text-[clamp(32px,5vw,56px)] leading-[1.05]">
            Hablemos<span className="text-[#C8A96E]">.</span>
          </h1>
          <p className="mt-4 text-[15px] text-[#A8A29E] font-body leading-relaxed max-w-sm">
            Cuéntanos tu proyecto. Respondemos en menos de 24 horas hábiles.
          </p>

          <div className="mt-8 space-y-3 text-[14px] text-[#A8A29E]">
            <a
              href="mailto:r@oasistud.io"
              className="flex items-center gap-3 hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4 text-[#C8A96E] shrink-0" /> r@oasistud.io
            </a>
            <a
              href="tel:+524531090660"
              className="flex items-center gap-3 hover:text-white transition-colors"
            >
              <Phone className="h-4 w-4 text-[#C8A96E] shrink-0" /> +52 453 109 0660
            </a>
            <a
              href="https://www.oasistud.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:text-white transition-colors"
            >
              <Globe className="h-4 w-4 text-[#C8A96E] shrink-0" /> www.oasistud.io
            </a>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-[#C8A96E] shrink-0" /> Ciudad de México
            </div>
          </div>

          <div className="mt-8 flex gap-5 text-[13px] text-[#A8A29E]">
            <a
              href="https://instagram.com/oasistud.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://linkedin.com/company/oasistud"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://behance.net/rogertern"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Behance
            </a>
          </div>
        </div>

        {/* Right — Form */}
        <div className="lg:w-[60%] bg-[#FAF7F2] px-6 md:px-16 py-10 lg:py-24 flex items-start justify-center">
          <div className="w-full max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[12px] font-semibold text-gray-900 mb-1.5 block">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set("name")}
                  className={inputCls}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-gray-900 mb-1.5 block">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  className={inputCls}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-gray-900 mb-1.5 block">
                  Empresa o marca
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={set("company")}
                  className={inputCls}
                  placeholder="Nombre de tu empresa (opcional)"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-gray-900 mb-1.5 block">
                  ¿Qué necesitas?
                </label>
                <select value={form.need} onChange={set("need")} className={selectCls}>
                  <option value="">Selecciona una opción</option>
                  {NEED_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-gray-900 mb-1.5 block">
                  Presupuesto aproximado
                </label>
                <select value={form.budget} onChange={set("budget")} className={selectCls}>
                  <option value="">Selecciona un rango</option>
                  {BUDGET_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-gray-900 mb-1.5 block">
                  Cuéntanos de tu proyecto *
                </label>
                <textarea
                  value={form.message}
                  onChange={set("message")}
                  rows={5}
                  className="w-full px-4 py-3 rounded-sm border border-gray-300 bg-white text-[14px] text-gray-900 font-body focus:outline-none focus:border-[#C8A96E] transition-colors resize-none min-h-[120px]"
                  placeholder="Describe tu proyecto, tus objetivos y tiempos..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full h-12 rounded-sm bg-[#1C1917] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#2D2D2D] transition-colors disabled:opacity-50"
              >
                Enviar mensaje <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-4 text-[12px] text-[#A8A29E]">
              Al enviar este formulario aceptas nuestro{" "}
              <Link
                to="/aviso-de-privacidad"
                className="underline hover:text-[#1C1917] transition-colors"
              >
                aviso de privacidad
              </Link>
              .
            </p>

            {/* Intern CTA */}
            <div className="mt-12 pt-8 border-t border-[#E7E0D8]">
              <p className="text-[14px] text-[#57534E] font-body">
                ¿Eres estudiante y quieres hacer prácticas?
              </p>
              <button
                type="button"
                onClick={prefillIntern}
                className="mt-3 text-[13px] font-semibold text-[#C8A96E] hover:text-[#1C1917] transition-colors flex items-center gap-1"
              >
                Postúlate aquí <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
