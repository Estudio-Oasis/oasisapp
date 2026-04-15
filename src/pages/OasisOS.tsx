import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import productDashboard from "@/assets/product-dashboard.png";
import productTimer from "@/assets/product-timer.png";
import productTasks from "@/assets/product-tasks.png";
import productQuotes from "@/assets/product-quotes.png";

const FEATURES = [
  { title: "Bitácora", desc: "Registra tu trabajo en tiempo real. Ve el timeline de tu día y entiende en qué se fue cada hora.", img: productTimer },
  { title: "Tareas", desc: "Organiza el trabajo con tableros, prioridades y fechas. Conectado a clientes y proyectos.", img: productTasks },
  { title: "Cotizaciones", desc: "Crea propuestas profesionales, envíalas por email y rastrea aprobaciones.", img: productQuotes },
  { title: "Dashboard", desc: "Tu centro de mando. KPIs, progreso del mes, valor hora real y visibilidad total.", img: productDashboard },
];

const PLANS = [
  { name: "Individual", price: "Gratis", desc: "Para freelancers", features: ["Timer ilimitado", "14 días de historial", "Valor hora calculado", "Entrada por voz"] },
  { name: "Estudio", price: "$16/mes", desc: "Hasta 6 miembros", features: ["Todo lo Individual", "Hub de equipo", "Clientes + Proyectos", "Cotizaciones PDF", "Finanzas"], popular: true },
  { name: "Agencia", price: "$20/mes", desc: "Hasta 10 miembros", features: ["Todo lo de Estudio", "Soporte prioritario", "Onboarding personalizado"] },
];

export default function OasisOSPage() {
  return (
    <div className="min-h-screen font-body bg-[#FAF7F2]">
      <SiteNavbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-[#1C1917]">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-6">
              Sistema operativo para creativos
            </p>
            <h1 className="font-serif-display text-[clamp(32px,5vw,56px)] leading-[1.1] text-white">
              Le ponemos proceso y orden a tu{" "}
              <span className="italic text-[#C8A96E]">creatividad</span>
            </h1>
            <p className="mt-6 text-[17px] leading-relaxed text-[#A8A29E] max-w-xl font-body">
              Todo lo que tu equipo necesita para facturar más, operar mejor y crecer sin caos.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/signup" className="h-12 px-7 rounded-sm bg-[#C8A96E] text-[#1C1917] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#D4B87A] transition-all">
                Probar gratis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/bitacora-demo" className="h-12 px-7 rounded-sm border border-white/20 text-white text-[14px] font-semibold flex items-center justify-center hover:border-white/40 transition-all">
                Ver demo
              </Link>
            </div>
          </div>
          <div>
            <img src={productDashboard} alt="OasisOS Dashboard" className="w-full rounded-xl shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-serif-display text-[clamp(28px,4vw,44px)] text-[#1C1917] mb-16">El producto.</h2>
          <div className="space-y-20">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "lg:direction-rtl" : ""}`}>
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <h3 className="font-serif-display text-[28px] text-[#1C1917]">{f.title}</h3>
                  <p className="mt-3 text-[15px] text-[#57534E] leading-relaxed font-body">{f.desc}</p>
                </div>
                <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                  <img src={f.img} alt={f.title} className="w-full rounded-xl shadow-2xl" loading="lazy" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 md:py-28 bg-[#F0E8DD]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-serif-display text-[clamp(28px,4vw,44px)] text-[#1C1917] mb-4">Precios.</h2>
          <p className="text-[16px] text-[#57534E] font-body mb-12">Empieza gratis. Escala cuando tu equipo crezca.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`rounded-sm border-2 p-6 bg-white flex flex-col ${plan.popular ? "border-[#C8A96E] shadow-lg" : "border-[#E7E0D8]"}`}>
                {plan.popular && <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-sm bg-[#C8A96E] text-white w-fit mb-3">Más popular</span>}
                <h3 className="text-[18px] font-bold text-[#1C1917]">{plan.name}</h3>
                <p className="text-[28px] font-bold text-[#1C1917] mt-2">{plan.price}</p>
                <p className="text-[13px] text-[#57534E] mt-1">{plan.desc}</p>
                <ul className="mt-5 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-[#57534E]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A96E] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={`mt-6 h-10 rounded-sm text-[13px] font-semibold flex items-center justify-center transition-colors ${plan.popular ? "bg-[#C8A96E] text-white hover:bg-[#D4B87A]" : "border border-[#E7E0D8] text-[#1C1917] hover:bg-[#F0E8DD]"}`}>
                  {plan.price === "Gratis" ? "Empezar gratis" : "Probar 14 días gratis"}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[13px] text-[#A8A29E] font-body">
            ¿Necesitas más?{" "}
            <Link to="/contacto" className="text-[#C8A96E] font-medium hover:underline">Contáctanos →</Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#1C1917]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif-display text-[clamp(28px,4vw,44px)] text-white">Empieza a registrar tu día.</h2>
          <p className="mt-4 text-[16px] text-[#A8A29E] font-body">Sin tarjeta, sin compromiso.</p>
          <Link to="/signup" className="mt-8 inline-flex items-center gap-2 h-12 px-8 rounded-sm bg-[#C8A96E] text-[#1C1917] text-[14px] font-semibold hover:bg-[#D4B87A] transition-all">
            Probar gratis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
