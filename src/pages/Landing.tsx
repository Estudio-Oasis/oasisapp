import { useState, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  Target,
  TrendingUp,
  Palette,
  Globe,
  Briefcase,
  Shield,
  Menu,
  X,
  Zap,
  ChevronDown,
} from "lucide-react";

const landingTrackedRef = { current: false };

// ─── Reveal hook ───
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
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

// ─── Navbar ───
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[var(--dm-cream)]/95 backdrop-blur-xl shadow-sm" : "bg-[var(--dm-cream)]"} border-b border-[var(--dm-sand)]`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif-display text-[20px] font-bold tracking-tight text-[var(--dm-charcoal)]">OASIS</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-[13px] font-medium text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)] transition-colors">Inicio</Link>
          
          <div className="relative group" onMouseEnter={() => setAboutOpen(true)} onMouseLeave={() => setAboutOpen(false)}>
            <button className="text-[13px] font-medium text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)] transition-colors flex items-center gap-1">
              About <ChevronDown className="h-3 w-3" />
            </button>
            {aboutOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-[var(--dm-sand)] py-2 min-w-[180px]">
                <Link to="/about" className="block px-4 py-2 text-[13px] text-[var(--dm-charcoal)] hover:bg-[var(--dm-sand-light)] transition-colors">Estudio Oasis</Link>
                <Link to="/about/roger-teran" className="block px-4 py-2 text-[13px] text-[var(--dm-charcoal)] hover:bg-[var(--dm-sand-light)] transition-colors">Roger Terán</Link>
              </div>
            )}
          </div>

          <Link to="/portfolio" className="text-[13px] font-medium text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)] transition-colors">Portafolio</Link>
          <Link to="/login" className="text-[13px] font-medium text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)] transition-colors">Oasis OS</Link>
          <Link to="/signup" className="h-9 px-5 rounded-sm bg-[var(--dm-charcoal)] text-[var(--dm-cream)] text-[13px] font-semibold flex items-center gap-1.5 hover:bg-[var(--dm-charcoal-light)] transition-colors">
            Probar gratis
          </Link>
        </div>

        <button className="md:hidden text-[var(--dm-charcoal)]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[var(--dm-cream)] border-b border-[var(--dm-sand)] px-6 pb-4 space-y-3">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm text-[var(--dm-charcoal)]">Inicio</Link>
          <p className="text-[11px] font-mono-label uppercase tracking-[0.2em] text-[var(--dm-charcoal)]/40 pt-2">About</p>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block text-sm text-[var(--dm-charcoal)]/70 pl-3">Estudio Oasis</Link>
          <Link to="/about/roger-teran" onClick={() => setMobileOpen(false)} className="block text-sm text-[var(--dm-charcoal)]/70 pl-3">Roger Terán</Link>
          <Link to="/portfolio" onClick={() => setMobileOpen(false)} className="block text-sm text-[var(--dm-charcoal)]">Portafolio</Link>
          <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-[var(--dm-charcoal)]">Oasis OS</Link>
          <Link to="/signup" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[var(--dm-gold)]">Probar gratis →</Link>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ───
function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-[var(--dm-cream)]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-6">
            Estudio creativo — desde 2010
          </p>
        </RevealSection>
        <RevealSection delay={100}>
          <h1 className="font-serif-display text-[clamp(36px,6vw,64px)] leading-[1.1] max-w-3xl text-[var(--dm-charcoal)]">
            Le ponemos proceso y orden a tu creatividad
          </h1>
        </RevealSection>
        <RevealSection delay={200}>
          <p className="mt-6 text-[17px] leading-relaxed text-[var(--dm-charcoal)]/60 max-w-xl font-body">
            15+ años de experiencia en agencias globales, condensados en un sistema operativo para equipos creativos y de servicios.
          </p>
        </RevealSection>
        <RevealSection delay={300}>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/signup" className="h-12 px-7 rounded-sm bg-[var(--dm-charcoal)] text-[var(--dm-cream)] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--dm-charcoal-light)] transition-all">
              Probar gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#como-funciona" className="h-12 px-7 rounded-sm border border-[var(--dm-sand)] text-[var(--dm-charcoal)] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--dm-sand-light)] transition-all">
              Ver cómo funciona
            </a>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── Agency logos (static row) ───
function AgencyLogos() {
  return (
    <section className="py-12 bg-[var(--dm-cream)] border-y border-[var(--dm-sand)]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-charcoal)]/40 mb-8">
          Experiencia forjada en:
        </p>
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-14">
          {AGENCY_LOGOS.map((l) => (
            <img
              key={l.name}
              src={l.url}
              alt={l.name}
              className="h-7 md:h-9 object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-80 transition-all duration-500"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── The Problem ───
function ProblemSection() {
  return (
    <section className="py-20 md:py-28 bg-[var(--dm-cream)]">
      <div className="max-w-3xl mx-auto px-6">
        <RevealSection>
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4">El problema</p>
          <h2 className="font-serif-display text-[clamp(24px,4vw,40px)] leading-tight text-[var(--dm-charcoal)]">
            El problema no es la carga de trabajo.<br />
            <span className="italic text-[var(--dm-terracotta)]">Es no tener control sobre ella.</span>
          </h2>
        </RevealSection>
        <RevealSection delay={150}>
          <div className="mt-8 space-y-5 text-[15px] text-[var(--dm-charcoal)]/70 leading-relaxed font-body">
            <p>
              Equipos creativos talentosos se pierden en la operación todos los días. No saben en qué se fue el día, no conectan trabajo con facturación, y toman decisiones basadas en intuición en lugar de datos.
            </p>
            <p>
              Sin visibilidad real de dónde va el tiempo, es imposible saber qué clientes son rentables, quién tiene capacidad disponible, o por qué el equipo siempre se siente sobrecargado aunque los números no cuadren.
            </p>
            <p>
              Oasis OS nace de ver este patrón repetirse en 6 agencias globales durante 15+ años. La solución no es otro tracker de horas. Es un sistema que conecta actividad, clientes y dinero en un solo lugar.
            </p>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── Oasis OS Section ───
function OasisOSSection() {
  const features = [
    { icon: Clock, title: "Bitácora", desc: "Registra tu trabajo en tiempo real con timer o manualmente" },
    { icon: Users, title: "Hub de equipo", desc: "Ve quién está activo, en qué trabaja y su estado en tiempo real" },
    { icon: BarChart3, title: "Visibilidad financiera", desc: "Conecta horas con clientes, proyectos y facturación" },
    { icon: Zap, title: "IA integrada", desc: "Mejora descripciones, sugiere clientes y optimiza tu operación" },
    { icon: Shield, title: "Perfiles de equipo", desc: "Cada empleado crea su perfil visible en el hub" },
    { icon: Globe, title: "Proyectos y clientes", desc: "Organiza todo por cliente, proyecto y tarea" },
  ];

  return (
    <section className="py-24 md:py-36 bg-[#1C1917]">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <RevealSection>
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4">Oasis OS</p>
          <h2 className="font-serif-display text-[clamp(28px,4vw,44px)] leading-tight text-[var(--dm-cream)]">
            El sistema operativo<br /><span className="italic text-[var(--dm-gold)]">para creativos</span>
          </h2>
          <p className="mt-4 text-[15px] text-[var(--dm-cream)]/60 leading-relaxed font-body">
            Nuestro OS conecta captura de actividad, gestión de clientes y visibilidad financiera en un solo sistema. Diseñado por gente que vivió el problema.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-sm bg-[var(--dm-gold)]/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-[var(--dm-gold)]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-[var(--dm-cream)]">{f.title}</h4>
                  <p className="text-[12px] text-[var(--dm-cream)]/50 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/signup" className="mt-8 inline-flex h-12 px-7 rounded-sm bg-[var(--dm-gold)] text-[var(--dm-charcoal)] text-[14px] font-semibold items-center gap-2 hover:bg-[var(--dm-gold-light)] transition-colors">
            Probar Oasis OS gratis <ArrowRight className="h-4 w-4" />
          </Link>
        </RevealSection>

        <RevealSection delay={200}>
          <div className="relative">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/os-product-UpwfCF6FLaSYDwR3ZBW5Jz.webp"
              alt="Oasis OS" className="rounded-sm w-full object-cover"
            />
            <div className="absolute bottom-4 right-4 bg-[var(--dm-cream)] rounded-sm p-4">
              <span className="text-[11px] text-[var(--dm-charcoal)]/50 block">Desde</span>
              <span className="font-serif-display text-[28px] text-[var(--dm-charcoal)] block leading-none">Gratis</span>
              <span className="text-[11px] text-[var(--dm-charcoal)]/50">Planes desde $9/mes</span>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── This is not... ───
function NotJustSection() {
  return (
    <section className="py-20 md:py-28 bg-[#1C1917]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <RevealSection>
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-6">Filosofía</p>
          <h2 className="font-serif-display text-[clamp(24px,4vw,40px)] leading-tight text-[var(--dm-cream)]">
            Esto <span className="italic text-[var(--dm-gold)]">no es</span> solo un tracker de horas.
          </h2>
        </RevealSection>
        <RevealSection delay={150}>
          <div className="mt-8 space-y-5 text-[15px] text-[var(--dm-cream)]/60 leading-relaxed font-body max-w-2xl mx-auto">
            <p>
              Un tracker te dice cuántas horas trabajaste. Oasis OS te dice en qué las invertiste, para quién, y si valió la pena. Es la diferencia entre medir actividad y entender operación.
            </p>
            <p>
              Conectamos tres capas que normalmente viven separadas: la bitácora operativa (qué hace tu equipo), la gestión de clientes y proyectos (para quién), y la visibilidad financiera (cuánto genera).
            </p>
            <p>
              El resultado: un registro operativo que te devuelve visibilidad. Sabes dónde va el tiempo, qué clientes son rentables, y puedes tomar decisiones con datos reales en lugar de intuición.
            </p>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── For Who ───
function ForWho() {
  const profiles = [
    { icon: Palette, title: "Freelancers", desc: "Registra tu día y entiende a dónde se va tu tiempo." },
    { icon: Users, title: "Equipos creativos", desc: "Visibilidad del equipo sin interrumpir el flujo." },
    { icon: Target, title: "Líderes y admins", desc: "Toma decisiones con datos reales de operación." },
    { icon: Briefcase, title: "Agencias y despachos", desc: "Conecta trabajo, clientes y cobranza." },
    { icon: TrendingUp, title: "Consultores", desc: "Registra horas por proyecto para cobrar mejor." },
    { icon: Globe, title: "Founders", desc: "Pon orden a la operación desde el día uno." },
  ];

  return (
    <section className="py-20 md:py-28 bg-[var(--dm-cream)]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4">Para quién es</p>
          <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[var(--dm-charcoal)]">
            Para cualquiera que necesite saber en qué se va su tiempo.
          </h2>
        </RevealSection>
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p, i) => (
            <RevealSection key={p.title} delay={i * 80}>
              <div className="rounded-sm border border-[var(--dm-sand)] p-5 hover:bg-[var(--dm-sand-light)] transition-colors duration-300 group">
                <p.icon className="h-5 w-5 text-[var(--dm-gold)] mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-[15px] font-semibold text-[var(--dm-charcoal)] mb-1">{p.title}</h3>
                <p className="text-[13px] text-[var(--dm-charcoal)]/60 leading-relaxed font-body">{p.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ───
function PricingSection() {
  const plans = [
    { name: "Bitácora Personal", price: "Gratis", period: "", desc: "Para individuos que quieren orden", features: ["Registro ilimitado", "Historial de 14 días", "5 refinamientos AI/día", "Timer + registro manual"], cta: "Empezar gratis", link: "/signup", popular: false, accent: false },
    { name: "Equipo 3", price: "$9", period: "/mes", desc: "Para freelancers y equipos pequeños", features: ["Hasta 3 miembros", "Historial completo", "AI ilimitado", "Exportación de datos", "Visibilidad de equipo"], cta: "Elegir plan", link: "/signup", popular: false, accent: false },
    { name: "Equipo 6", price: "$16", period: "/mes", desc: "Para estudios y agencias medianas", features: ["Hasta 6 miembros", "Historial completo", "AI ilimitado", "Exportación de datos", "Visibilidad de equipo", "Soporte prioritario"], cta: "Elegir plan", link: "/signup", popular: true, accent: true },
    { name: "Equipo 10", price: "$20", period: "/mes", desc: "Para agencias y equipos grandes", features: ["Hasta 10 miembros", "Historial completo", "AI ilimitado", "Exportación de datos", "Visibilidad de equipo", "Soporte prioritario", "Onboarding personalizado"], cta: "Elegir plan", link: "/signup", popular: false, accent: false },
  ];

  return (
    <section id="precios" className="py-20 md:py-28 bg-[var(--dm-sand-light)]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4">Precios</p>
          <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[var(--dm-charcoal)]">Simple y transparente.</h2>
          <p className="mt-3 text-[16px] text-[var(--dm-charcoal)]/60 font-body">Empieza gratis. Escala cuando tu equipo lo necesite.</p>
        </RevealSection>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, i) => (
            <RevealSection key={plan.name} delay={i * 80}>
              <div className={`rounded-sm border-2 p-5 h-full flex flex-col bg-white ${plan.accent ? "border-[var(--dm-gold)] shadow-[0_8px_30px_-10px_rgba(196,162,101,0.2)]" : "border-[var(--dm-sand)]"}`}>
                {plan.popular && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-sm bg-[var(--dm-gold)] text-white w-fit mb-3">Más popular</span>
                )}
                <h3 className="text-[16px] font-bold text-[var(--dm-charcoal)]">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-[32px] font-bold text-[var(--dm-charcoal)] leading-none">{plan.price}</span>
                  {plan.period && <span className="text-[14px] text-[var(--dm-charcoal)]/50">{plan.period}</span>}
                </div>
                <p className="mt-2 text-[13px] text-[var(--dm-charcoal)]/60 font-body">{plan.desc}</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--dm-gold)] mt-0.5 shrink-0" />
                      <span className="text-[12px] text-[var(--dm-charcoal)]/60">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.link} className={`mt-5 h-10 rounded-sm text-[13px] font-semibold flex items-center justify-center transition-colors ${plan.accent ? "bg-[var(--dm-gold)] text-white hover:bg-[var(--dm-gold-light)]" : "border border-[var(--dm-sand)] text-[var(--dm-charcoal)] hover:bg-[var(--dm-sand-light)]"}`}>
                  {plan.cta}
                </Link>
              </div>
            </RevealSection>
          ))}
        </div>
        <RevealSection delay={400}>
          <p className="mt-8 text-center text-[13px] text-[var(--dm-charcoal)]/40 font-body">
            ¿Necesitas más de 10 miembros?{" "}
            <a href="https://tally.so/r/wMrqBp" target="_blank" rel="noopener noreferrer" className="text-[var(--dm-gold)] font-medium hover:underline">Contáctanos →</a>
          </p>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── How it works ───
function HowItWorks() {
  const steps = [
    { num: "01", title: "Crea tu cuenta gratis", desc: "En menos de un minuto. Sin tarjeta, sin fricciones." },
    { num: "02", title: "Registra tu primera actividad", desc: "Con timer o manualmente. Tú decides cómo registrar tu trabajo." },
    { num: "03", title: "Tu día toma forma", desc: "Ve el timeline de tu jornada y entiende en qué se va tu tiempo." },
    { num: "04", title: "Escala cuando lo necesites", desc: "Invita a tu equipo, conecta clientes y proyectos." },
  ];

  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-[var(--dm-cream)]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4">Cómo funciona</p>
          <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[var(--dm-charcoal)]">Empieza en menos de un minuto.</h2>
        </RevealSection>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <RevealSection key={s.num} delay={i * 120}>
              <div>
                <span className="font-serif-display text-[48px] font-bold text-[var(--dm-sand)] leading-none">{s.num}</span>
                <h3 className="mt-3 text-[16px] font-semibold text-[var(--dm-charcoal)]">{s.title}</h3>
                <p className="mt-2 text-[13px] text-[var(--dm-charcoal)]/60 leading-relaxed font-body">{s.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ───
function CtaSection() {
  return (
    <section className="py-20 md:py-28 bg-[#1C1917]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <RevealSection>
          <h2 className="font-serif-display text-[clamp(24px,4vw,44px)] leading-tight text-[var(--dm-cream)]">
            Empieza a registrar tu día.
          </h2>
          <p className="mt-4 text-[16px] text-[var(--dm-cream)]/50 font-body max-w-md mx-auto">
            Prueba Oasis OS gratis. Sin tarjeta, sin compromiso.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/bitacora-demo" className="h-12 px-8 rounded-sm bg-[var(--dm-gold)] text-[var(--dm-charcoal)] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--dm-gold-light)] transition-all">
              Probar gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/signup" className="h-12 px-8 rounded-sm border border-white/20 text-[var(--dm-cream)] text-[14px] font-semibold flex items-center justify-center gap-2 hover:border-white/40 transition-colors">
              Crear cuenta
            </Link>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── Footer ───
function SiteFooter() {
  return (
    <footer className="py-16 md:py-24 bg-[var(--dm-charcoal)]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <span className="font-serif-display text-[28px] text-[var(--dm-cream)]">OASIS</span>
          <p className="mt-4 text-[14px] text-[var(--dm-cream)]/50 leading-relaxed font-body max-w-sm">
            Estudio creativo con 15+ años de experiencia en agencias globales. Creadores de Oasis OS — el sistema operativo para equipos creativos y de servicios.
          </p>
        </div>
        <div>
          <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[var(--dm-cream)]/40 mb-4">Navegación</h4>
          <div className="space-y-2">
            {[
              { label: "Inicio", to: "/" },
              { label: "About", to: "/about" },
              { label: "Portafolio", to: "/portfolio" },
              { label: "Oasis OS", to: "/login" },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="block text-[13px] text-[var(--dm-cream)]/60 hover:text-[var(--dm-gold)] transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[var(--dm-cream)]/40 mb-4">Contacto</h4>
          <div className="space-y-2">
            <a href="mailto:joserogelioteran@gmail.com" className="block text-[13px] text-[var(--dm-cream)]/60 hover:text-[var(--dm-gold)] transition-colors">joserogelioteran@gmail.com</a>
            <a href="https://linkedin.com/in/rogerteran" target="_blank" rel="noopener noreferrer" className="block text-[13px] text-[var(--dm-cream)]/60 hover:text-[var(--dm-gold)] transition-colors">LinkedIn</a>
            <a href="https://behance.net/rogertern" target="_blank" rel="noopener noreferrer" className="block text-[13px] text-[var(--dm-cream)]/60 hover:text-[var(--dm-gold)] transition-colors">Behance</a>
            <a href="https://instagram.com/rayo_teran" target="_blank" rel="noopener noreferrer" className="block text-[13px] text-[var(--dm-cream)]/60 hover:text-[var(--dm-gold)] transition-colors">Instagram</a>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-12 pt-6 border-t border-[var(--dm-cream)]/10 flex flex-col md:flex-row justify-between gap-2">
        <p className="text-[11px] text-[var(--dm-cream)]/30">© 2026 Estudio Oasis. Todos los derechos reservados.</p>
        <p className="text-[11px] text-[var(--dm-cream)]/30">Ciudad de México, México</p>
      </div>
    </footer>
  );
}

// ─── Main ───
export default function LandingPage() {
  useEffect(() => {
    if (!landingTrackedRef.current) {
      trackEvent("landing_view");
      landingTrackedRef.current = true;
    }
  }, []);

  return (
    <div className="min-h-screen font-body">
      <Navbar />
      <Hero />
      <AgencyLogos />
      <ProblemSection />
      <OasisOSSection />
      <NotJustSection />
      <ForWho />
      <PricingSection />
      <HowItWorks />
      <CtaSection />
      <SiteFooter />
    </div>
  );
}
