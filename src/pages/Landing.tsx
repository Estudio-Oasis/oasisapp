import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";

const landingTrackedRef = { current: false };

const CLIENT_NAMES = [
  "Liverpool", "Zoe Water", "BBVA", "Platzi", "Baileys", "Herbalife",
  "SEDENA", "Rocketfy", "Mundo Cuervo", "Indumet", "Miami Ad School",
  "Koena", "Poliuretanos", "Maalob",
];

const PORTFOLIO_ITEMS = [
  { name: "Zoe Water", tags: "BRANDING + MARKETING", bg: "#2D5A3D" },
  { name: "Liverpool Gourmet", tags: "BRANDING + PACKING", bg: "#8B4513" },
  { name: "Indumet Aerospace", tags: "LOGO + WEBSITE", bg: "#1a3a5c" },
];

export default function LandingPage() {
  useEffect(() => {
    if (!landingTrackedRef.current) {
      trackEvent("landing_view");
      landingTrackedRef.current = true;
    }
  }, []);

  return (
    <div className="min-h-screen font-body">
      <SiteNavbar />

      {/* SECTION 1 — HERO */}
      <section className="min-h-screen flex items-center bg-[#FAF7F2] pt-16">
        <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
          <div>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#A8A29E] mb-6">
              ESTUDIO CREATIVO · CIUDAD DE MÉXICO · 10 AÑOS
            </p>
            <h1 className="font-serif-display text-[clamp(36px,5.5vw,64px)] leading-[1.05] text-[#1C1917]">
              Creamos marcas que la
              <br />
              <span className="italic text-[#C8A96E]">competencia teme.</span>
            </h1>
            <p className="mt-6 text-[17px] leading-relaxed text-[#57534E] max-w-xl font-body">
              Branding, marketing y tecnología para negocios que quieren crecer.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/portfolio"
                className="h-12 px-7 rounded-sm bg-[#1C1917] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#2D2D2D] transition-all"
              >
                Ver nuestro trabajo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contacto"
                className="h-12 px-7 rounded-sm border border-[#1C1917] text-[#1C1917] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#1C1917] hover:text-white transition-all"
              >
                Hablemos
              </Link>
            </div>
          </div>
          {/* Editorial image collage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <div className="aspect-[4/3] rounded-sm bg-[#E7E0D8] overflow-hidden">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/oasis_liverpool_46662b18.jpg" alt="Liverpool Gourmet" className="w-full h-full object-cover" loading="eager" />
              </div>
              <div className="aspect-[4/5] rounded-sm bg-[#E7E0D8] overflow-hidden">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/sSnOTstnVAIyYMic.jpg" alt="Zoé Water" className="w-full h-full object-cover" loading="eager" />
              </div>
            </div>
            <div className="space-y-3 pt-8">
              <div className="aspect-[4/5] rounded-sm bg-[#E7E0D8] overflow-hidden">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/mdCAeemnwUZhbqGV.jpg" alt="Indumet" className="w-full h-full object-cover" loading="eager" />
              </div>
              <div className="aspect-[4/3] rounded-sm bg-[#E7E0D8] overflow-hidden">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/oasis_josecuervo_4a462909.jpg" alt="José Cuervo" className="w-full h-full object-cover" loading="eager" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — MÉTRICAS */}
      <section className="py-16 bg-[#1C1917]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: "+200", label: "Clientes" },
              { num: "10", label: "Años" },
              { num: "$42MDD", label: "Ventas generadas" },
              { num: "9x", label: "ROAS promedio" },
            ].map((m) => (
              <div key={m.label}>
                <p className="font-serif-display text-[clamp(28px,4vw,48px)] font-bold text-white leading-none">{m.num}</p>
                <p className="mt-2 text-[13px] text-[#A8A29E] font-mono-label tracking-wider uppercase">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — SERVICIOS */}
      <section className="py-20 md:py-28 bg-[#FAF7F2]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">Nuestros servicios</p>
          <h2 className="font-serif-display text-[clamp(28px,4vw,44px)] leading-tight text-[#1C1917]">Lo que hacemos.</h2>

          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "BRANDING",
                desc: "Logotipos, sistemas de identidad, naming, packaging, señalética y brandbooks. Creamos identidades que la gente recuerda.",
              },
              {
                num: "02",
                title: "MARKETING & PUBLICIDAD",
                desc: "Campañas en Meta, Google, TikTok, OOH y medios tradicionales. Contenido que convierte y publicidad que escala.",
              },
              {
                num: "03",
                title: "TECNOLOGÍA",
                desc: "Websites, apps, e-commerce y sistemas a medida. Plataformas digitales que trabajan para tu negocio.",
              },
            ].map((s) => (
              <div key={s.num} className="group">
                <span className="font-serif-display text-[56px] font-bold text-[#E7E0D8] leading-none block">{s.num}</span>
                <h3 className="mt-3 text-[16px] font-bold tracking-wider text-[#1C1917]">{s.title}</h3>
                <p className="mt-3 text-[14px] text-[#57534E] leading-relaxed font-body">{s.desc}</p>
                <Link
                  to="/servicios"
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#C8A96E] hover:text-[#1C1917] transition-colors"
                >
                  Ver más <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — PORTAFOLIO PREVIEW */}
      <section className="py-20 md:py-28 bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">Portafolio</p>
          <h2 className="font-serif-display text-[clamp(28px,4vw,44px)] leading-tight text-white mb-12">Trabajo seleccionado.</h2>

          <div className="space-y-4">
            {PORTFOLIO_ITEMS.map((item) => (
              <Link
                key={item.name}
                to="/portfolio"
                className="block rounded-sm overflow-hidden group relative"
                style={{ backgroundColor: item.bg }}
              >
                <div className="h-[200px] flex items-end justify-between p-8">
                  <div>
                    <h3 className="text-[24px] font-serif-display font-bold text-white">{item.name}</h3>
                    <p className="text-[12px] font-mono-label tracking-wider text-white/60 mt-1">{item.tags}</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-sm border border-white/20 text-white text-[14px] font-semibold hover:border-white/40 transition-colors"
            >
              Ver todo el portafolio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5 — CLIENTES MARQUEE */}
      <section className="py-16 bg-[#FAF7F2] overflow-hidden">
        <p className="text-center font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#A8A29E] mb-8">
          Marcas que han confiado en nosotros
        </p>
        <MarqueeRow />
      </section>

      {/* SECTION 6 — OASIS OS */}
      <section className="py-20 md:py-28 bg-[#1C1917]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-6">Producto propio</p>
          <h2 className="font-serif-display text-[clamp(28px,4vw,44px)] leading-tight text-white">
            También construimos tecnología para{" "}
            <span className="italic text-[#C8A96E]">creativos.</span>
          </h2>
          <p className="mt-6 text-[16px] text-[#A8A29E] leading-relaxed font-body max-w-2xl mx-auto">
            OasisOS es nuestro sistema operativo para agencias y equipos creativos. Bitácora, tareas, cotizaciones, CRM y finanzas en un solo lugar.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/oasis-os"
              className="h-12 px-8 rounded-sm bg-[#C8A96E] text-[#1C1917] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#D4B87A] transition-all"
            >
              Conocer OasisOS <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="h-12 px-8 rounded-sm border border-white/20 text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:border-white/40 transition-colors"
            >
              Probar gratis
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 7 — CTA FINAL */}
      <section className="py-20 md:py-28 bg-[#FAF7F2]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif-display text-[clamp(32px,5vw,56px)] leading-tight text-[#1C1917]">
            ¿Tienes un proyecto?
          </h2>
          <p className="mt-4 text-[17px] text-[#57534E] font-body">
            Cuéntanoslo. Respondemos en menos de 24 horas.
          </p>
          <Link
            to="/contacto"
            className="mt-8 inline-flex items-center gap-2 h-14 px-10 rounded-sm bg-[#1C1917] text-white text-[16px] font-semibold hover:bg-[#2D2D2D] transition-all"
          >
            Escribirnos <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function MarqueeRow() {
  const tickerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div className="flex animate-marquee whitespace-nowrap" ref={tickerRef}>
        {[...CLIENT_NAMES, ...CLIENT_NAMES].map((name, i) => (
          <span key={i} className="mx-8 text-[18px] font-serif-display text-[#57534E]/40 select-none">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
