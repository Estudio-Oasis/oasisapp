import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, X, ChevronDown } from "lucide-react";

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

// Navbar (same style as Landing but always solid bg)
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--dm-cream)]/95 backdrop-blur-xl border-b border-[var(--dm-sand)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif-display text-[20px] font-bold tracking-tight text-[var(--dm-charcoal)]">OASIS</Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-[13px] font-medium text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)]">Inicio</Link>
          <div className="relative group" onMouseEnter={() => setAboutOpen(true)} onMouseLeave={() => setAboutOpen(false)}>
            <button className="text-[13px] font-medium text-[var(--dm-gold)] flex items-center gap-1">About <ChevronDown className="h-3 w-3" /></button>
            {aboutOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-[var(--dm-sand)] py-2 min-w-[180px]">
                <Link to="/about" className="block px-4 py-2 text-[13px] text-[var(--dm-charcoal)] hover:bg-[var(--dm-sand-light)]">Estudio Oasis</Link>
                <Link to="/about/roger-teran" className="block px-4 py-2 text-[13px] text-[var(--dm-charcoal)] hover:bg-[var(--dm-sand-light)]">Roger Terán</Link>
              </div>
            )}
          </div>
          <Link to="/portfolio" className="text-[13px] font-medium text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)]">Portafolio</Link>
          <Link to="/login" className="text-[13px] font-medium text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)]">Oasis OS</Link>
          <Link to="/signup" className="h-9 px-5 rounded-sm bg-[var(--dm-charcoal)] text-[var(--dm-cream)] text-[13px] font-semibold flex items-center">Probar gratis</Link>
        </div>
        <button className="md:hidden text-[var(--dm-charcoal)]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-[var(--dm-cream)] border-b border-[var(--dm-sand)] px-6 pb-4 space-y-3">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm">Inicio</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block text-sm text-[var(--dm-gold)]">Estudio Oasis</Link>
          <Link to="/about/roger-teran" onClick={() => setMobileOpen(false)} className="block text-sm">Roger Terán</Link>
          <Link to="/portfolio" onClick={() => setMobileOpen(false)} className="block text-sm">Portafolio</Link>
          <Link to="/signup" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[var(--dm-gold)]">Probar gratis →</Link>
        </div>
      )}
    </nav>
  );
}

export default function AboutStudio() {
  return (
    <div className="min-h-screen font-body bg-[var(--dm-cream)]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-[var(--dm-charcoal)]">
        <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/about-roger-XN3CDjsVCtGvdF5hcCG8Sk.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4">Sobre nosotros</p>
            <h1 className="font-serif-display text-[clamp(36px,6vw,64px)] leading-[1.05] text-[var(--dm-cream)]">
              Estudio<br /><span className="italic text-[var(--dm-gold)]">Oasis</span>
            </h1>
            <p className="mt-4 text-[16px] text-[var(--dm-cream)]/60 max-w-lg font-body">
              Un estudio creativo nacido de 15+ años de experiencia en las agencias más grandes del mundo. Creadores de Oasis OS.
            </p>
          </Reveal>
          {/* Tabs */}
          <div className="mt-8 flex gap-6 border-b border-[var(--dm-cream)]/10">
            <Link to="/about" className="pb-3 text-[14px] font-semibold text-[var(--dm-cream)] border-b-2 border-[var(--dm-gold)]">Estudio Oasis</Link>
            <Link to="/about/roger-teran" className="pb-3 text-[14px] text-[var(--dm-cream)]/50 hover:text-[var(--dm-cream)]/70">Roger Terán</Link>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="py-24 md:py-36">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4">La historia</p>
            <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[var(--dm-charcoal)]">
              De la agencia<br /><span className="italic text-[var(--dm-terracotta)]">al sistema propio</span>
            </h2>
            <div className="mt-6 space-y-4 text-[15px] text-[var(--dm-charcoal)]/70 leading-relaxed">
              <p>Estudio Oasis nace de una observación simple pero poderosa: después de trabajar en agencias como Ogilvy, Leo Burnett, Havas, FCB, Media Monks y VML, vimos que el talento creativo se pierde en la operación.</p>
              <p>Los equipos más talentosos del mundo sufren los mismos problemas: no saben en qué se fue el día, no conectan trabajo con facturación, y toman decisiones basadas en intuición en lugar de datos.</p>
              <p>Con esa experiencia, creamos un estudio creativo que entiende ambos mundos — la creatividad y la operación — y construimos Oasis OS, un sistema operativo que le pone proceso y orden a la creatividad sin matarla.</p>
              <p>Nuestro OS conecta tres pilares fundamentales: la Bitácora (captura operativa en tiempo real), la gestión de Clientes y Proyectos, y Money Guard (visibilidad financiera project-to-cash).</p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/agency-experience-Jp9iBMZRco9cYjUAckGW2G.webp" alt="Experiencia" className="rounded-sm w-full object-cover" />
          </Reveal>
        </div>
      </section>

      {/* Agencias */}
      <section className="py-20 bg-[var(--dm-sand-light)]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,3vw,36px)] text-[var(--dm-charcoal)] text-center mb-12">Agencias globales</h2>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10 items-center justify-items-center">
            {AGENCY_LOGOS.map((l, i) => (
              <Reveal key={l.name} delay={i * 80}>
                <div className="text-center">
                  <img src={l.url} alt={l.name} className="h-10 md:h-12 object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500 mx-auto" />
                  <p className="mt-3 text-[11px] text-[var(--dm-charcoal)]/40 font-mono-label tracking-wider">{l.name}</p>
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
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4 text-center">Lo que hacemos</p>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Estudio Creativo", desc: "Branding, estrategia, dirección creativa, contenido y marketing digital. Todo con la experiencia de agencias globales." },
              { num: "02", title: "Oasis OS", desc: "Sistema operativo para agencias y equipos de servicios. Trackeo de horas, gestión de clientes, visibilidad financiera." },
              { num: "03", title: "Educación", desc: "Formación de talento creativo a través de Miami Ad School México. Copywriting, branding, paid media y más." },
            ].map((c, i) => (
              <Reveal key={c.num} delay={i * 100}>
                <div className="border border-[var(--dm-sand)] rounded-sm p-6 bg-white">
                  <span className="font-serif-display text-[40px] text-[var(--dm-sand)] leading-none">{c.num}</span>
                  <h3 className="mt-3 text-[18px] font-semibold text-[var(--dm-charcoal)]">{c.title}</h3>
                  <p className="mt-2 text-[14px] text-[var(--dm-charcoal)]/60 leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Nuestras Áreas — Banner */}
      <section className="py-20 bg-[var(--dm-sand-light)]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4 text-center">Nuestras áreas</p>
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/nyCrluSxBiZsMmym.jpg" alt="Áreas de servicio — Logos, Marketing Digital, Desarrollo Web" className="w-full rounded-sm" loading="lazy" />
          </Reveal>
        </div>
      </section>

      {/* Proceso Creativo */}
      <section className="py-20 bg-[var(--dm-charcoal)]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4 text-center">Nuestro proceso</p>
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/HqoUQNpSiDHWxgYD.jpg" alt="Proceso creativo — Entender, Brainstorming, Refinar, Realizar" className="w-full rounded-sm" loading="lazy" />
          </Reveal>
        </div>
      </section>

      {/* CTA Roger */}
      <section className="py-20 bg-[var(--dm-charcoal)] border-t border-[var(--dm-cream)]/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,4vw,44px)] text-[var(--dm-cream)]">
              Conoce a <span className="italic text-[var(--dm-gold)]">Roger Terán</span>
            </h2>
            <p className="mt-4 text-[16px] text-[var(--dm-cream)]/50 font-body">
              El fundador detrás de Estudio Oasis y su trayectoria de 15+ años.
            </p>
            <Link to="/about/roger-teran" className="mt-8 inline-flex h-12 px-7 rounded-sm bg-[var(--dm-gold)] text-[var(--dm-charcoal)] text-[14px] font-semibold items-center gap-2 hover:bg-[var(--dm-gold-light)] transition-colors">
              Ver perfil de Roger <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-[var(--dm-charcoal)] border-t border-[var(--dm-cream)]/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-4">
          <p className="text-[11px] text-[var(--dm-cream)]/30">© 2026 Estudio Oasis. Todos los derechos reservados.</p>
          <p className="text-[11px] text-[var(--dm-cream)]/30">Ciudad de México, México</p>
        </div>
      </footer>
    </div>
  );
}
