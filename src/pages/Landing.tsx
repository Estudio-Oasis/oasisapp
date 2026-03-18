import { useState, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  Layers,
  Shield,
  Menu,
  X,
  Play,
  PenLine,
  Eye,
  DollarSign,
  Zap,
  UserCheck,
} from "lucide-react";

// ─── Track landing view once ───
const landingTrackedRef = { current: false };

// ─── Intersection Observer hook for reveal animations ───
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

// ─── 1. Navbar ───
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Funciones", href: "#funciones" },
    { label: "Para quién", href: "#para-quien" },
    { label: "Precios", href: "#precios" },
    { label: "Cómo funciona", href: "#como-funciona" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#FAFAF8]/90 backdrop-blur-xl border-b border-[#E8E8E4]" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-1.5">
          <span className="text-[#1A1A1A] font-bold text-[16px] tracking-tight">Bitácora</span>
          <span className="text-[#999] text-[12px] font-medium">· by Estudio Oasis</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-[13px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
              {l.label}
            </a>
          ))}
          <Link to="/login" className="text-[13px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
            Iniciar sesión
          </Link>
          <Link
            to="/bitacora-demo"
            className="h-9 px-5 rounded-full bg-[#1A1A1A] text-[#FAFAF8] text-[13px] font-semibold flex items-center gap-1.5 hover:bg-[#333] transition-colors"
          >
            Probar gratis
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-[#1A1A1A]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#FAFAF8] border-b border-[#E8E8E4] px-6 pb-4 space-y-3">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block text-sm text-[#6B6B6B] hover:text-[#1A1A1A]">
              {l.label}
            </a>
          ))}
          <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-[#6B6B6B] hover:text-[#1A1A1A]">
            Iniciar sesión
          </Link>
          <Link to="/bitacora-demo" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#1A1A1A]">
            Probar gratis →
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── 2. Hero ───
function Hero() {
  return (
    <section className="relative pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#F0EDE6_0%,_#FAFAF8_60%)]" />

      <div className="relative max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-5">
            Registro de actividad para creativos y equipos de servicio
          </p>
        </RevealSection>

        <RevealSection delay={100}>
          <h1 className="text-[clamp(28px,5vw,56px)] font-bold leading-[1.1] tracking-tight text-[#1A1A1A] max-w-3xl">
            Le ponemos proceso y orden a la creatividad.
          </h1>
        </RevealSection>

        <RevealSection delay={200}>
          <p className="mt-5 text-[16px] md:text-[17px] leading-relaxed text-[#6B6B6B] max-w-xl">
            Registra tu trabajo, entiende cómo se va tu día y empieza a poner orden a tu operación. Bitácora es la puerta de entrada a un sistema para individuos, equipos y líderes.
          </p>
        </RevealSection>

        <RevealSection delay={300}>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/bitacora-demo"
              className="h-12 px-7 rounded-full bg-[#B8956A] text-[#FAFAF8] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#A07D5A] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Probar Bitácora gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#funciones"
              className="h-12 px-7 rounded-full border border-[#D4D4D0] text-[#1A1A1A] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#F0EDE6] transition-all"
            >
              Ver cómo funciona
            </a>
          </div>
        </RevealSection>

        {/* Bitácora mockup */}
        <RevealSection delay={400}>
          <div className="mt-14 md:mt-18 relative">
            <div className="rounded-2xl border border-[#E8E8E4] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden">
              <div className="h-10 bg-[#F5F5F3] border-b border-[#E8E8E4] flex items-center px-4 gap-2">
                <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                <div className="h-3 w-3 rounded-full bg-[#28C840]" />
                <span className="ml-3 text-[11px] text-[#999] font-medium">Bitácora</span>
              </div>
              <div className="p-5 md:p-8 bg-gradient-to-br from-[#FAFAF8] to-[#F5F3EE]">
                {/* Active session */}
                <div className="rounded-xl border-2 border-[#B8956A]/30 bg-[#FFF8F0] p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#28C840] animate-pulse" />
                      <span className="text-[13px] font-semibold text-[#1A1A1A]">En actividad</span>
                    </div>
                    <span className="text-[20px] font-bold text-[#B8956A] tabular-nums">01:23:45</span>
                  </div>
                  <p className="text-[13px] text-[#6B6B6B]">Diseñando propuesta de identidad visual</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#B8956A]/10 text-[#B8956A] font-medium">Cliente: Vertex</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#5B8DEF]/10 text-[#5B8DEF] font-medium">Proyecto: Branding</span>
                  </div>
                </div>
                {/* Timeline entries */}
                <div className="space-y-3">
                  {[
                    { time: "09:00 – 10:30", desc: "Revisión de brief con equipo", client: "Helios", dur: "1h 30m" },
                    { time: "10:45 – 12:15", desc: "Wireframes landing page", client: "Vertex", dur: "1h 30m" },
                    { time: "14:00 – 15:30", desc: "Llamada con cliente + notas", client: "Cosmos", dur: "1h 30m" },
                  ].map((e, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border border-[#E8E8E4] bg-white p-3">
                      <span className="text-[11px] text-[#999] font-medium shrink-0 w-[100px]">{e.time}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[#1A1A1A] font-medium truncate">{e.desc}</p>
                        <span className="text-[11px] text-[#B8956A]">{e.client}</span>
                      </div>
                      <span className="text-[12px] text-[#6B6B6B] font-medium shrink-0">{e.dur}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── 3. Problema ───
function ProblemSection() {
  const pains = [
    "No sabes en qué se fue el tiempo",
    "Las tareas viven separadas del contexto",
    "La operación depende de mensajes sueltos",
    "Los clientes consumen recursos sin visibilidad real",
    "Cobrar bien sigue siendo demasiado manual",
  ];

  return (
    <section className="py-20 md:py-28 bg-[#F5F3EE]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">El problema</p>
            <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A]">
              El problema no es la carga de trabajo. Es no poder verla con claridad.
            </h2>
          </div>
        </RevealSection>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pains.map((pain, i) => (
            <RevealSection key={i} delay={i * 80}>
              <div className="flex items-start gap-3 rounded-xl border border-[#E0DDD6] bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-[#FFF3E0] flex items-center justify-center shrink-0">
                  <span className="text-[#B8956A] text-[11px] font-bold">!</span>
                </div>
                <p className="text-[14px] text-[#1A1A1A] font-medium">{pain}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 4. Para quién es ───
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
    <section id="para-quien" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">Para quién es</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A]">
            Para cualquiera que necesite saber en qué se va su tiempo.
          </h2>
        </RevealSection>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p, i) => (
            <RevealSection key={p.title} delay={i * 80}>
              <div className="rounded-xl border border-[#E8E8E4] p-5 hover:bg-[#FAFAF8] transition-colors duration-300 group">
                <p.icon className="h-5 w-5 text-[#B8956A] mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-1">{p.title}</h3>
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">{p.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 5. Las 3 funciones ───
function FunctionsSection() {
  return (
    <section id="funciones" className="py-20 md:py-28 bg-[#FAFAF8]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">Funciones</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A] max-w-xl">
            Un sistema que crece contigo.
          </h2>
          <p className="mt-3 text-[16px] text-[#6B6B6B] max-w-lg leading-relaxed">
            Empieza con Bitácora. El resto se conecta cuando lo necesites.
          </p>
        </RevealSection>

        {/* Bitácora — dominant card */}
        <RevealSection delay={100}>
          <div className="mt-12 rounded-2xl border-2 border-[#B8956A] bg-white p-6 md:p-8 shadow-[0_8px_30px_-10px_rgba(184,149,106,0.2)]">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                    Disponible hoy
                  </span>
                </div>
                <h3 className="text-[24px] md:text-[28px] font-bold text-[#1A1A1A] mb-3">Bitácora</h3>
                <p className="text-[15px] text-[#6B6B6B] leading-relaxed mb-6 max-w-lg">
                  Registra en qué trabajas, cuánto tiempo le dedicas y con qué contexto. Para ti, para tu equipo, para tu operación. Con timer o con registro manual — tú decides cómo registrar.
                </p>
                <ul className="space-y-2.5 mb-6">
                  {[
                    "Registro con un clic o manual",
                    "Cada entrada se conecta a cliente, proyecto y tarea",
                    "Timeline visual de tu día",
                    "Funciona para individuos y equipos",
                  ].map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#B8956A] mt-0.5 shrink-0" />
                      <span className="text-[13px] text-[#6B6B6B]">{pt}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/bitacora-demo"
                  className="inline-flex h-11 px-6 rounded-full bg-[#B8956A] text-[#FAFAF8] text-[13px] font-semibold items-center gap-2 hover:bg-[#A07D5A] transition-colors"
                >
                  Probar Bitácora <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Mini mockup */}
              <div className="md:w-[320px] shrink-0 rounded-xl border border-[#E8E8E4] bg-[#FAFAF8] p-4 hidden md:block">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-[#28C840]" />
                  <span className="text-[12px] font-semibold text-[#1A1A1A]">01:23:45</span>
                  <span className="text-[11px] text-[#999] ml-auto">Hoy</span>
                </div>
                <div className="space-y-2">
                  {[
                    { t: "09:00–10:30", d: "Brief con equipo", c: "#B8956A" },
                    { t: "10:45–12:15", d: "Wireframes LP", c: "#5B8DEF" },
                    { t: "14:00–15:30", d: "Llamada cliente", c: "#28C840" },
                  ].map((e, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md bg-white border border-[#E8E8E4] p-2">
                      <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: e.c }} />
                      <span className="text-[11px] text-[#999] shrink-0">{e.t}</span>
                      <span className="text-[11px] text-[#1A1A1A] font-medium truncate">{e.d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* Centro de Control + Finanzas — smaller cards */}
        <div className="mt-5 grid md:grid-cols-2 gap-5">
          <RevealSection delay={200}>
            <div className="rounded-2xl border border-[#E8E8E4] bg-[#FAFAF8] p-6 h-full">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FFF8E1] text-[#F57F17]">
                Próximamente
              </span>
              <h3 className="mt-4 text-[18px] font-bold text-[#1A1A1A] mb-2">Centro de Control</h3>
              <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-4">
                Clientes, tareas, proyectos y la información que necesitas para operar con claridad. Todo conectado.
              </p>
              <ul className="space-y-2">
                {["Gestión de clientes y proyectos", "Tareas conectadas al contexto", "Vista de equipo en tiempo real"].map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#D4D4D0] mt-0.5 shrink-0" />
                    <span className="text-[12px] text-[#999]">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </RevealSection>

          <RevealSection delay={280}>
            <div className="rounded-2xl border border-[#E8E8E4] bg-[#FAFAF8] p-6 h-full">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FFF8E1] text-[#F57F17]">
                Próximamente
              </span>
              <h3 className="mt-4 text-[18px] font-bold text-[#1A1A1A] mb-2">Finanzas</h3>
              <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-4">
                Facturas, pagos, gastos y visibilidad financiera. Conectado con el trabajo real de tu equipo.
              </p>
              <ul className="space-y-2">
                {["Facturación y cobranza", "Registro de pagos y gastos", "Reportes financieros claros"].map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#D4D4D0] mt-0.5 shrink-0" />
                    <span className="text-[12px] text-[#999]">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>
  );
}

// ─── 6. Para administradores ───
function ForAdmins() {
  const benefits = [
    { icon: Eye, title: "Ve en qué invierte tiempo tu equipo", desc: "Sin preguntar, sin interrumpir." },
    { icon: Target, title: "Detecta cuellos de botella", desc: "Identifica quién está saturado o dónde hay gaps." },
    { icon: Users, title: "Entiende la carga por cliente", desc: "Cuánto tiempo real consume cada proyecto." },
    { icon: Shield, title: "Opera con más control", desc: "Decisiones basadas en datos, no en suposiciones." },
    { icon: DollarSign, title: "Cobra con más claridad", desc: "Horas reales conectadas a la facturación." },
    { icon: Zap, title: "Conecta trabajo con dinero", desc: "Del registro de actividad al ingreso." },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">Para administradores</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#FAFAF8] max-w-lg">
            Si lideras un equipo, esto te da la visibilidad que necesitas.
          </h2>
        </RevealSection>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((b, i) => (
            <RevealSection key={b.title} delay={i * 80}>
              <div className="rounded-xl border border-[#2A2A2A] bg-[#222] p-5 hover:border-[#444] transition-colors duration-300">
                <b.icon className="h-5 w-5 text-[#B8956A] mb-3" />
                <h4 className="text-[15px] font-semibold text-[#FAFAF8] mb-1">{b.title}</h4>
                <p className="text-[13px] text-[#888] leading-relaxed">{b.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 7. Para individuos ───
function ForIndividuals() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <div className="max-w-xl mx-auto text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">Para individuos</p>
            <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A]">
              No necesitas un equipo para empezar.
            </h2>
            <p className="mt-4 text-[16px] text-[#6B6B6B] leading-relaxed">
              Bitácora funciona igual de bien como herramienta personal. Registra tu día, entiende tus patrones y empieza a trabajar con más claridad — gratis.
            </p>
            <div className="mt-8">
              <Link
                to="/signup"
                className="inline-flex h-11 px-6 rounded-full bg-[#1A1A1A] text-[#FAFAF8] text-[13px] font-semibold items-center gap-2 hover:bg-[#333] transition-colors"
              >
                Crear cuenta gratis <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── 8. Cómo funciona ───
function HowItWorks() {
  const steps = [
    { num: "01", title: "Crea tu cuenta gratis", desc: "En menos de un minuto. Sin tarjeta, sin fricciones." },
    { num: "02", title: "Registra tu primera actividad", desc: "Con timer o manualmente. Tú decides cómo registrar tu trabajo." },
    { num: "03", title: "Tu día toma forma", desc: "Ve el timeline de tu jornada y entiende en qué se va tu tiempo." },
    { num: "04", title: "Escala cuando lo necesites", desc: "Invita a tu equipo, conecta clientes y proyectos. Bitácora crece contigo." },
  ];

  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-[#F5F3EE]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">Cómo funciona</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A]">
            Empieza en menos de un minuto.
          </h2>
        </RevealSection>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <RevealSection key={s.num} delay={i * 120}>
              <div>
                <span className="text-[48px] font-bold text-[#E0DDD6] leading-none">{s.num}</span>
                <h3 className="mt-3 text-[16px] font-semibold text-[#1A1A1A] leading-snug">{s.title}</h3>
                <p className="mt-2 text-[13px] text-[#6B6B6B] leading-relaxed">{s.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 9. Vista del sistema ───
function SystemView() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">El sistema</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A] max-w-lg">
            Bitácora es solo el inicio.
          </h2>
          <p className="mt-3 text-[16px] text-[#6B6B6B] max-w-lg leading-relaxed">
            Estamos construyendo un sistema completo. Empieza con el registro de actividad y expande cuando lo necesites.
          </p>
          <p className="mt-2 text-[13px] text-[#999] italic">
            La experiencia seguirá mejorando con resúmenes inteligentes y automatizaciones.
          </p>
        </RevealSection>

        {/* Bitácora — large detailed mockup */}
        <RevealSection delay={100}>
          <div className="mt-12 rounded-2xl border-2 border-[#B8956A]/40 bg-[#FAFAF8] overflow-hidden">
            <div className="bg-[#1A1A1A] px-5 py-3 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              <span className="text-[12px] text-[#FAFAF8] font-semibold">Bitácora</span>
              <span className="text-[11px] text-[#888] ml-auto">Disponible hoy</span>
            </div>
            <div className="p-5 md:p-8">
              <div className="grid md:grid-cols-3 gap-4 mb-5">
                {[
                  { label: "Horas hoy", value: "6h 15m", color: "#B8956A" },
                  { label: "Actividades", value: "8", color: "#5B8DEF" },
                  { label: "Clientes", value: "3", color: "#28C840" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-[#E8E8E4] bg-white p-3">
                    <p className="text-[11px] uppercase tracking-wider text-[#999] font-medium">{s.label}</p>
                    <p className="text-[22px] font-bold text-[#1A1A1A] mt-0.5">{s.value}</p>
                    <div className="mt-1.5 h-1 rounded-full bg-[#F0EDE6] overflow-hidden">
                      <div className="h-full rounded-full" style={{ backgroundColor: s.color, width: "70%" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { t: "09:00–10:30", d: "Revisión de brief", cl: "Helios" },
                  { t: "10:45–12:15", d: "Diseño de wireframes", cl: "Vertex" },
                  { t: "14:00–15:00", d: "Llamada de seguimiento", cl: "Cosmos" },
                  { t: "15:15–16:30", d: "Ajustes de propuesta", cl: "Helios" },
                ].map((e, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-[#E8E8E4] bg-white p-3">
                    <span className="text-[11px] text-[#999] font-medium shrink-0 w-[95px]">{e.t}</span>
                    <p className="text-[13px] text-[#1A1A1A] font-medium flex-1 truncate">{e.d}</p>
                    <span className="text-[11px] text-[#B8956A] font-medium shrink-0">{e.cl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>

        {/* Centro de Control + Finanzas — small schematic */}
        <div className="mt-5 grid md:grid-cols-2 gap-4">
          <RevealSection delay={200}>
            <div className="rounded-xl border border-[#E8E8E4] bg-[#FAFAF8] p-5 opacity-70">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-[#D4D4D0]" />
                <span className="text-[13px] font-semibold text-[#999]">Centro de Control</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF8E1] text-[#F57F17] font-medium ml-auto">Próximamente</span>
              </div>
              <div className="space-y-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-3 rounded bg-[#E8E8E4]" style={{ width: `${85 - i * 15}%` }} />
                ))}
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={280}>
            <div className="rounded-xl border border-[#E8E8E4] bg-[#FAFAF8] p-5 opacity-70">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-[#D4D4D0]" />
                <span className="text-[13px] font-semibold text-[#999]">Finanzas</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF8E1] text-[#F57F17] font-medium ml-auto">Próximamente</span>
              </div>
              <div className="space-y-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-3 rounded bg-[#E8E8E4]" style={{ width: `${80 - i * 12}%` }} />
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>
  );
}

// ─── 9b. Pricing Section ───
function PricingSection() {
  const plans = [
    {
      name: "Bitácora Personal",
      price: "Gratis",
      period: "",
      desc: "Para individuos que quieren orden",
      features: ["Registro ilimitado", "Historial de 14 días", "5 refinamientos AI/día", "Timer + registro manual"],
      cta: "Empezar gratis",
      link: "/signup",
      popular: false,
      accent: false,
    },
    {
      name: "Equipo 3",
      price: "$9",
      period: "/mes",
      desc: "Para freelancers y equipos pequeños",
      features: ["Hasta 3 miembros", "Historial completo", "AI ilimitado", "Exportación de datos", "Visibilidad de equipo"],
      cta: "Elegir plan",
      link: "/signup",
      popular: false,
      accent: false,
    },
    {
      name: "Equipo 6",
      price: "$16",
      period: "/mes",
      desc: "Para estudios y agencias medianas",
      features: ["Hasta 6 miembros", "Historial completo", "AI ilimitado", "Exportación de datos", "Visibilidad de equipo", "Soporte prioritario"],
      cta: "Elegir plan",
      link: "/signup",
      popular: true,
      accent: true,
    },
    {
      name: "Equipo 10",
      price: "$20",
      period: "/mes",
      desc: "Para agencias y equipos grandes",
      features: ["Hasta 10 miembros", "Historial completo", "AI ilimitado", "Exportación de datos", "Visibilidad de equipo", "Soporte prioritario", "Onboarding personalizado"],
      cta: "Elegir plan",
      link: "/signup",
      popular: false,
      accent: false,
    },
  ];

  return (
    <section id="precios" className="py-20 md:py-28 bg-[#FAFAF8]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">Precios</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A] max-w-lg">
            Simple y transparente.
          </h2>
          <p className="mt-3 text-[16px] text-[#6B6B6B] max-w-lg leading-relaxed">
            Empieza gratis. Escala cuando tu equipo lo necesite.
          </p>
        </RevealSection>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, i) => (
            <RevealSection key={plan.name} delay={i * 80}>
              <div className={`rounded-2xl border-2 p-5 h-full flex flex-col ${plan.accent ? "border-[#B8956A] bg-white shadow-[0_8px_30px_-10px_rgba(184,149,106,0.2)]" : "border-[#E8E8E4] bg-white"}`}>
                {plan.popular && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#B8956A] text-white w-fit mb-3">
                    Más popular
                  </span>
                )}
                <h3 className="text-[16px] font-bold text-[#1A1A1A]">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-[32px] font-bold text-[#1A1A1A] leading-none">{plan.price}</span>
                  {plan.period && <span className="text-[14px] text-[#999]">{plan.period}</span>}
                </div>
                <p className="mt-2 text-[13px] text-[#6B6B6B] leading-relaxed">{plan.desc}</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#B8956A] mt-0.5 shrink-0" />
                      <span className="text-[12px] text-[#6B6B6B]">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.link}
                  className={`mt-5 h-10 rounded-full text-[13px] font-semibold flex items-center justify-center transition-colors ${plan.accent ? "bg-[#B8956A] text-white hover:bg-[#A07D5A]" : "border border-[#D4D4D0] text-[#1A1A1A] hover:bg-[#F0EDE6]"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            </RevealSection>
          ))}
        </div>

        <RevealSection delay={400}>
          <p className="mt-8 text-center text-[13px] text-[#999]">
            ¿Necesitas más de 10 miembros?{" "}
            <a href="https://tally.so/r/wMrqBp" target="_blank" rel="noopener noreferrer" className="text-[#B8956A] font-medium hover:underline">
              Contáctanos →
            </a>
          </p>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── 10. CTA final ───
function CtaSection() {
  return (
    <section className="py-20 md:py-28 bg-[#1A1A1A]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <RevealSection>
          <h2 className="text-[clamp(24px,4vw,44px)] font-bold leading-tight text-[#FAFAF8]">
            Empieza a registrar tu día.
          </h2>
          <p className="mt-4 text-[16px] text-[#888] leading-relaxed max-w-md mx-auto">
            Prueba Bitácora gratis. Sin tarjeta, sin compromiso. Empieza a entender cómo se va tu tiempo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/bitacora-demo"
              className="h-12 px-8 rounded-full bg-[#B8956A] text-[#FAFAF8] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#A07D5A] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Probar Bitácora gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/signup"
              className="h-12 px-8 rounded-full border border-[#444] text-[#FAFAF8] text-[14px] font-semibold flex items-center justify-center gap-2 hover:border-[#666] transition-colors"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── 11. Footer ───
function Footer() {
  return (
    <footer className="py-10 bg-[#111] border-t border-[#222]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[#FAFAF8] font-bold text-[14px] tracking-tight">Bitácora</span>
            <span className="text-[#666] text-[12px] font-medium">· by Estudio Oasis</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://tally.so/r/wMrqBp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-[#666] hover:text-[#FAFAF8] transition-colors"
            >
              ¿Ideas o feedback?
            </a>
            <Link to="/login" className="text-[13px] text-[#666] hover:text-[#FAFAF8] transition-colors">
              Iniciar sesión
            </Link>
            <Link to="/signup" className="text-[13px] text-[#666] hover:text-[#FAFAF8] transition-colors">
              Crear cuenta
            </Link>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-[#222]">
          <p className="text-[12px] text-[#444]">© {new Date().getFullYear()} Estudio Oasis. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Landing Page ───
export default function LandingPage() {
  useEffect(() => {
    if (!landingTrackedRef.current) {
      landingTrackedRef.current = true;
      trackEvent("landing_view");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-sans">
      <Navbar />
      <Hero />
      <ProblemSection />
      <ForWho />
      <FunctionsSection />
      <ForAdmins />
      <ForIndividuals />
      <HowItWorks />
      <SystemView />
      <CtaSection />
      <Footer />
    </div>
  );
}
