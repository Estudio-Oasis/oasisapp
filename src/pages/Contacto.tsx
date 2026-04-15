import { useState } from "react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { toast } from "sonner";
import { Send } from "lucide-react";

export default function ContactoPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Completa los campos requeridos");
      return;
    }
    setSending(true);
    // For now, mailto fallback
    const subject = encodeURIComponent(`Contacto desde web: ${form.company || form.name}`);
    const body = encodeURIComponent(`Nombre: ${form.name}\nEmpresa: ${form.company}\nEmail: ${form.email}\n\n${form.message}`);
    window.open(`mailto:joserogelioteran@gmail.com?subject=${subject}&body=${body}`, "_blank");
    toast.success("¡Gracias! Te contactaremos pronto.");
    setSending(false);
  };

  return (
    <div className="min-h-screen font-body bg-[#FAF7F2]">
      <SiteNavbar />

      <section className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-3xl mx-auto px-6">
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">Contacto</p>
          <h1 className="font-serif-display text-[clamp(32px,5vw,52px)] leading-[1.1] text-[#1C1917]">
            Hablemos de tu <span className="italic text-[#C8A96E]">proyecto.</span>
          </h1>
          <p className="mt-4 text-[16px] text-[#57534E] font-body max-w-lg">
            Cuéntanos qué necesitas. Respondemos en menos de 24 horas.
          </p>

          <form onSubmit={handleSubmit} className="mt-12 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-[12px] font-semibold text-[#1C1917] mb-1.5 block">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-sm border border-[#E7E0D8] bg-white text-[14px] text-[#1C1917] focus:outline-none focus:border-[#C8A96E] transition-colors"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#1C1917] mb-1.5 block">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-11 px-4 rounded-sm border border-[#E7E0D8] bg-white text-[14px] text-[#1C1917] focus:outline-none focus:border-[#C8A96E] transition-colors"
                  placeholder="tu@email.com"
                />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#1C1917] mb-1.5 block">Empresa</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full h-11 px-4 rounded-sm border border-[#E7E0D8] bg-white text-[14px] text-[#1C1917] focus:outline-none focus:border-[#C8A96E] transition-colors"
                placeholder="Nombre de tu empresa (opcional)"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#1C1917] mb-1.5 block">Mensaje *</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 rounded-sm border border-[#E7E0D8] bg-white text-[14px] text-[#1C1917] focus:outline-none focus:border-[#C8A96E] transition-colors resize-none"
                placeholder="Cuéntanos sobre tu proyecto..."
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="h-12 px-8 rounded-sm bg-[#1C1917] text-white text-[14px] font-semibold flex items-center gap-2 hover:bg-[#2D2D2D] transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Enviar mensaje
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
