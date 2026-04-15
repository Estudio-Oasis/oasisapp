import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const AGENCY_LOGOS = [
  { name: "Ogilvy", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/ogilvy_d7381671.png" },
  { name: "Leo Burnett", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/leo-burnett_c24e284a.png" },
  { name: "Havas", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/havas_304fe49c.jpg" },
  { name: "FCB", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/fcb_968bc1ba.png" },
  { name: "Media.Monks", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/media-monks_10b229d3.png" },
  { name: "VML", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/vml_a9ed372a.png" },
];

export default function AboutStudio() {
  return (
    <div className="min-h-screen font-body bg-[#FAF7F2]">
      <SiteNavbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-[#1C1917]">
        <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/about-roger-XN3CDjsVCtGvdF5hcCG8Sk.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">Sobre nosotros</p>
            <h1 className="font-serif-display text-[clamp(36px,6vw,64px)] leading-[1.05] text-white">
              Estudio<br /><span className="italic text-[#C8A96E]">Oasis</span>
            </h1>
            <p className="mt-4 text-[16px] text-white/60 max-w-lg font-body">
              Un estudio creativo nacido de 15+ años de experiencia en las agencias más grandes del mundo.
            </p>
          </Reveal>
          <div className="mt-8 flex gap-6 border-b border-white/10">
            <Link to="/about" className="pb-3 text-[14px] font-semibold text-white border-b-2 border-[#C8A96E]">Estudio Oasis</Link>
            <Link to="/about/roger-teran" className="pb-3 text-[14px] text-white/50 hover:text-white/70">Roger Terán</Link>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="py-24 md:py-36">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">La historia</p>
            <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[#1C1917]">
              De la agencia<br /><span className="italic text-[#B85C38]">al sistema propio</span>
            </h2>
            <div className="mt-6 space-y-4 text-[15px] text-[#57534E] leading-relaxed">
              <p>Estudio Oasis nace de una observación simple pero poderosa: después de trabajar en agencias como Ogilvy, Leo Burnett, Havas, FCB, Media Monks y VML, vimos que el talento creativo se pierde en la operación.</p>
              <p>Los equipos más talentosos del mundo sufren los mismos problemas: no saben en qué se fue el día, no conectan trabajo con facturación, y toman decisiones basadas en intuición en lugar de datos.</p>
              <p>Con esa experiencia, creamos un estudio creativo que entiende ambos mundos — la creatividad y la operación — y construimos OasisOS, un sistema operativo que le pone proceso y orden a la creatividad sin matarla.</p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/agency-experience-Jp9iBMZRco9cYjUAckGW2G.webp" alt="Experiencia" className="rounded-sm w-full object-cover" />
          </Reveal>
        </div>
      </section>

      {/* Agencias */}
      <section className="py-20 bg-[#F0E8DD]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,3vw,36px)] text-[#1C1917] text-center mb-12">Agencias globales</h2>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10 items-center justify-items-center">
            {AGENCY_LOGOS.map((l, i) => (
              <Reveal key={l.name} delay={i * 80}>
                <div className="text-center">
                  <img src={l.url} alt={l.name} className="h-10 md:h-12 object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500 mx-auto" />
                  <p className="mt-3 text-[11px] text-[#1C1917]/40 font-mono-label tracking-wider">{l.name}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Lo que hacemos */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4 text-center">Lo que hacemos</p>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Estudio Creativo", desc: "Branding, estrategia, dirección creativa, contenido y marketing digital. Todo con la experiencia de agencias globales." },
              { num: "02", title: "OasisOS", desc: "Sistema operativo para agencias y equipos de servicios. Trackeo de horas, gestión de clientes, visibilidad financiera." },
              { num: "03", title: "Educación", desc: "Formación de talento creativo a través de Miami Ad School México. Copywriting, branding, paid media y más." },
            ].map((c, i) => (
              <Reveal key={c.num} delay={i * 100}>
                <div className="border border-[#E7E0D8] rounded-sm p-6 bg-white">
                  <span className="font-serif-display text-[40px] text-[#E7E0D8] leading-none">{c.num}</span>
                  <h3 className="mt-3 text-[18px] font-semibold text-[#1C1917]">{c.title}</h3>
                  <p className="mt-2 text-[14px] text-[#57534E] leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Nuestras Áreas */}
      <section className="py-20 bg-[#F0E8DD]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4 text-center">Nuestras áreas</p>
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/nyCrluSxBiZsMmym.jpg" alt="Áreas de servicio" className="w-full rounded-sm" loading="lazy" />
          </Reveal>
        </div>
      </section>

      {/* Proceso */}
      <section className="py-20 bg-[#1C1917]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4 text-center">Nuestro proceso</p>
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/HqoUQNpSiDHWxgYD.jpg" alt="Proceso creativo" className="w-full rounded-sm" loading="lazy" />
          </Reveal>
        </div>
      </section>

      {/* CTA Roger */}
      <section className="py-20 bg-[#1C1917] border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,4vw,44px)] text-white">
              Conoce a <span className="italic text-[#C8A96E]">Roger Terán</span>
            </h2>
            <p className="mt-4 text-[16px] text-white/50 font-body">
              El fundador detrás de Estudio Oasis y su trayectoria de 15+ años.
            </p>
            <Link to="/about/roger-teran" className="mt-8 inline-flex h-12 px-7 rounded-sm bg-[#C8A96E] text-[#1C1917] text-[14px] font-semibold items-center gap-2 hover:bg-[#D4B87A] transition-colors">
              Ver perfil de Roger <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
