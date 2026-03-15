import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Eye,
  Layers,
  Wrench,
  Clock,
  Users,
  BarChart3,
  CheckCircle2,
  Zap,
  Shield,
  Target,
  MessageSquare,
  TrendingUp,
  Palette,
  Globe,
  Briefcase,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

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

// ─── Navbar ───
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Productos", href: "#productos" },
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Casos de uso", href: "#casos-de-uso" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#FAFAF8]/90 backdrop-blur-xl border-b border-[#E8E8E4]" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
            <span className="text-[#FAFAF8] text-sm font-bold">O</span>
          </div>
          <span className="text-[#1A1A1A] font-semibold text-[15px] tracking-tight">Estudio Oasis</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-[13px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
              {l.label}
            </a>
          ))}
          <a href="/login" className="text-[13px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
            Iniciar sesión
          </a>
          <a
            href="#contacto"
            className="h-9 px-5 rounded-full bg-[#1A1A1A] text-[#FAFAF8] text-[13px] font-semibold flex items-center gap-1.5 hover:bg-[#333] transition-colors"
          >
            Agendar llamada
          </a>
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
          <a href="#contacto" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#1A1A1A]">
            Agendar llamada →
          </a>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ───
function Hero() {
  return (
    <section className="relative pt-32 pb-24 md:pt-44 md:pb-32 overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#F0EDE6_0%,_#FAFAF8_60%)]" />
      
      <div className="relative max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-6">
            Sistemas operativos para empresas de servicio
          </p>
        </RevealSection>

        <RevealSection delay={100}>
          <h1 className="text-[clamp(32px,5.5vw,64px)] font-bold leading-[1.08] tracking-tight text-[#1A1A1A] max-w-3xl">
            Diseñamos sistemas que hacen el trabajo más claro, más fácil y mejor.
          </h1>
        </RevealSection>

        <RevealSection delay={200}>
          <p className="mt-6 text-[17px] leading-relaxed text-[#6B6B6B] max-w-xl">
            Creamos herramientas digitales para equipos de trabajo modernos. Nuestro ecosistema conecta seguimiento, visibilidad, tareas, clientes, finanzas y operación — para que trabajes con más orden y mejores decisiones.
          </p>
        </RevealSection>

        <RevealSection delay={300}>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#contacto"
              className="h-12 px-7 rounded-full bg-[#1A1A1A] text-[#FAFAF8] text-[14px] font-semibold flex items-center gap-2 hover:bg-[#333] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Ver demo <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#productos"
              className="h-12 px-7 rounded-full border border-[#D4D4D0] text-[#1A1A1A] text-[14px] font-semibold flex items-center gap-2 hover:bg-[#F0EDE6] transition-all"
            >
              Explorar herramientas
            </a>
          </div>
        </RevealSection>

        {/* Dashboard mockup */}
        <RevealSection delay={400}>
          <div className="mt-16 md:mt-20 relative">
            <div className="rounded-2xl border border-[#E8E8E4] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden">
              {/* Title bar */}
              <div className="h-10 bg-[#F5F5F3] border-b border-[#E8E8E4] flex items-center px-4 gap-2">
                <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                <div className="h-3 w-3 rounded-full bg-[#28C840]" />
                <span className="ml-3 text-[11px] text-[#999]">Oasis OS — Performance Manager</span>
              </div>
              {/* Mockup content */}
              <div className="p-6 md:p-10 bg-gradient-to-br from-[#FAFAF8] to-[#F5F3EE]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Equipo activo", value: "8/12", color: "#28C840" },
                    { label: "Horas hoy", value: "47.5h", color: "#B8956A" },
                    { label: "Tareas en progreso", value: "23", color: "#5B8DEF" },
                    { label: "Clientes activos", value: "14", color: "#FF9F43" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-[#E8E8E4] bg-white p-4">
                      <p className="text-[11px] uppercase tracking-wider text-[#999] font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{stat.value}</p>
                      <div className="mt-2 h-1.5 rounded-full bg-[#F0EDE6] overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: stat.color, width: "65%" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 rounded-xl border border-[#E8E8E4] bg-white p-5">
                    <p className="text-[12px] uppercase tracking-wider text-[#999] font-medium mb-4">Actividad del equipo</p>
                    <div className="space-y-3">
                      {["Ana — Diseñando propuesta para Vertex", "Carlos — Sprint review con Helios", "María — QA del dashboard financiero"].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ["#28C840", "#B8956A", "#5B8DEF"][i] }} />
                          <span className="text-[13px] text-[#6B6B6B]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E8E8E4] bg-white p-5">
                    <p className="text-[12px] uppercase tracking-wider text-[#999] font-medium mb-4">Finanzas</p>
                    <p className="text-xl font-bold text-[#1A1A1A]">$48,200</p>
                    <p className="text-[12px] text-[#28C840] font-medium mt-1">+12% vs mes anterior</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── What we do ───
function WhatWeDo() {
  const pillars = [
    {
      icon: Eye,
      title: "Visibilidad operativa",
      desc: "Entiende qué está pasando en tu equipo en tiempo real, sin depender de reportes manuales o mensajes sueltos.",
    },
    {
      icon: Layers,
      title: "Organización conectada",
      desc: "Tareas, clientes, tiempo y contexto viven juntos. Todo se conecta para que nada se pierda entre herramientas.",
    },
    {
      icon: Wrench,
      title: "Herramientas hechas para la realidad",
      desc: "Software diseñado desde la operación real de equipos de servicio. No plantillas genéricas.",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">Qué hacemos</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A] max-w-xl">
            No hacemos software por hacer software.
          </h2>
          <p className="mt-4 text-[16px] text-[#6B6B6B] max-w-lg leading-relaxed">
            Diseñamos sistemas y apps para resolver problemas operativos reales. Herramientas que ayudan a equipos de servicio a organizarse mejor, entender qué está pasando y trabajar con más claridad día a día.
          </p>
        </RevealSection>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {pillars.map((p, i) => (
            <RevealSection key={p.title} delay={i * 120}>
              <div className="group p-6 rounded-2xl border border-[#E8E8E4] hover:border-[#D4D0C8] bg-[#FAFAF8] hover:bg-[#F5F3EE] transition-all duration-300">
                <div className="h-11 w-11 rounded-xl bg-[#1A1A1A] flex items-center justify-center mb-5">
                  <p.icon className="h-5 w-5 text-[#FAFAF8]" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#1A1A1A] mb-2">{p.title}</h3>
                <p className="text-[14px] text-[#6B6B6B] leading-relaxed">{p.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Why Visibility Matters ───
function WhyVisibility() {
  const pains = [
    "No sabes en qué se fue el tiempo",
    "Las tareas viven separadas del contexto",
    "La operación depende de mensajes sueltos",
    "Los clientes consumen recursos sin visibilidad real",
    "Cobrar bien sigue siendo demasiado manual",
  ];

  return (
    <section className="py-24 md:py-32 bg-[#F5F3EE]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">El problema</p>
            <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A]">
              El problema no es solo la carga de trabajo. Es no poder verla con claridad.
            </h2>
            <p className="mt-4 text-[16px] text-[#6B6B6B] leading-relaxed">
              Muchos equipos trabajan entre tareas dispersas, comunicación fragmentada, seguimiento manual y poca visibilidad real. Eso genera retrasos, mala priorización y decisiones tomadas a ciegas.
            </p>
          </div>
        </RevealSection>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pains.map((pain, i) => (
            <RevealSection key={i} delay={i * 80}>
              <div className="flex items-start gap-3 rounded-xl border border-[#E0DDD6] bg-white p-5 hover:shadow-sm transition-shadow">
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

// ─── Product Ecosystem ───
function ProductEcosystem() {
  const products = [
    {
      name: "2026 Performance Manager",
      badge: "Ya lanzado",
      badgeColor: "bg-[#E8F5E9] text-[#2E7D32]",
      desc: "La herramienta que convierte actividad en visibilidad. Da seguimiento al trabajo del equipo, conecta registros con contexto y te ayuda a entender mejor qué está pasando en tu operación.",
      points: ["Seguimiento del trabajo", "Visibilidad del equipo", "Registro con contexto", "Comunicación interna", "Análisis operativo", "Conexión con tareas y clientes"],
      cta: "Ver producto",
      ctaHref: "/login",
      active: true,
    },
    {
      name: "Money Guard",
      badge: "Próximamente",
      badgeColor: "bg-[#FFF8E1] text-[#F57F17]",
      desc: "Control financiero con más claridad y menos fricción. Registra movimientos, detecta insights útiles y automatiza seguimiento de cobranza para ayudar a mantener un flujo de caja más saludable.",
      points: ["Registro financiero rápido", "Insights y visibilidad financiera", "Seguimiento de pagos", "Automatización de cobranza vía WhatsApp, email y SMS"],
      cta: "Próximamente",
      ctaHref: "#",
      active: false,
    },
    {
      name: "Projects",
      badge: "Próximamente",
      badgeColor: "bg-[#FFF8E1] text-[#F57F17]",
      desc: "Todo lo importante de tu operación, mejor conectado. Proyectos, clientes, pagos, tareas e información clave en un solo lugar para trabajar con más orden y menos ruido.",
      points: ["Proyectos y clientes conectados", "Contexto operativo centralizado", "Información importante accesible", "Mejor organización interna"],
      cta: "Próximamente",
      ctaHref: "#",
      active: false,
    },
  ];

  return (
    <section id="productos" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">Ecosistema</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A] max-w-xl">
            Un ecosistema operativo en construcción.
          </h2>
          <p className="mt-4 text-[16px] text-[#6B6B6B] max-w-lg leading-relaxed">
            Estamos construyendo una suite de herramientas pensada para mejorar cómo trabajan las empresas de servicio.
          </p>
        </RevealSection>

        <div className="mt-16 grid lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <RevealSection key={p.name} delay={i * 120}>
              <div className={`rounded-2xl border ${p.active ? "border-[#1A1A1A]" : "border-[#E8E8E4]"} bg-[#FAFAF8] p-7 flex flex-col h-full hover:shadow-md transition-shadow duration-300`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>
                <h3 className="text-[20px] font-bold text-[#1A1A1A] mb-3">{p.name}</h3>
                <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-6">{p.desc}</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#B8956A] mt-0.5 shrink-0" />
                      <span className="text-[13px] text-[#6B6B6B]">{pt}</span>
                    </li>
                  ))}
                </ul>
                {p.active ? (
                  <a
                    href={p.ctaHref}
                    className="h-11 rounded-full bg-[#1A1A1A] text-[#FAFAF8] text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#333] transition-colors"
                  >
                    {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <div className="h-11 rounded-full border border-[#E8E8E4] text-[#999] text-[13px] font-semibold flex items-center justify-center cursor-default">
                    {p.cta}
                  </div>
                )}
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Featured Product ───
function FeaturedProduct() {
  const features = [
    { icon: Users, title: "Seguimiento de actividad del equipo", desc: "Visualiza quién está trabajando en qué, en tiempo real." },
    { icon: MessageSquare, title: "Registros con contexto", desc: "Cada entrada de tiempo se conecta con el cliente, la tarea y el proyecto." },
    { icon: Target, title: "Integración con tareas y clientes", desc: "Trabajo y operación viven conectados, no en silos separados." },
    { icon: Eye, title: "Visibilidad para líderes", desc: "Dashboards y vistas diseñadas para que managers tomen mejores decisiones." },
    { icon: BarChart3, title: "Base para reportes", desc: "Datos reales de operación para construir reportes más útiles." },
    { icon: Zap, title: "Operación más clara para todos", desc: "Menos preguntas, menos desorden, más foco en lo que importa." },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] px-3 py-1 rounded-full bg-[#2A2A2A] text-[#B8956A]">
            Producto principal
          </span>
          <h2 className="mt-6 text-[clamp(28px,4vw,48px)] font-bold leading-tight text-[#FAFAF8]">
            2026 Performance Manager
          </h2>
          <p className="mt-2 text-[18px] text-[#888] font-medium">Nuestra primera herramienta ya está en marcha.</p>
        </RevealSection>

        <RevealSection delay={100}>
          <p className="mt-8 text-[16px] text-[#AAA] leading-relaxed max-w-2xl">
            Nace de una necesidad real: entender mejor cómo se mueve el trabajo dentro de un equipo. Más que medir horas, ayuda a dar seguimiento, registrar contexto, detectar gaps, mejorar la comunicación y generar una visibilidad operativa mucho más útil para gestionar mejor.
          </p>
        </RevealSection>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <RevealSection key={f.title} delay={i * 80}>
              <div className="rounded-xl border border-[#2A2A2A] bg-[#222] p-6 hover:border-[#444] transition-colors duration-300">
                <f.icon className="h-5 w-5 text-[#B8956A] mb-4" />
                <h4 className="text-[15px] font-semibold text-[#FAFAF8] mb-1.5">{f.title}</h4>
                <p className="text-[13px] text-[#888] leading-relaxed">{f.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>

        <RevealSection delay={500}>
          <div className="mt-14 rounded-xl border border-[#2A2A2A] bg-[#222] p-6 md:p-8">
            <p className="text-[15px] text-[#AAA] leading-relaxed italic">
              "No se trata solo de registrar tiempo. Se trata de entender mejor la operación detrás del trabajo."
            </p>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── Why Different ───
function WhyDifferent() {
  const points = [
    { left: "Tiempo", right: "Tiempo + contexto" },
    { left: "Actividad", right: "Actividad + visibilidad" },
    { left: "Tareas aisladas", right: "Tareas + clientes + operación" },
    { left: "Datos sueltos", right: "Seguimiento + comunicación" },
    { left: "Más datos", right: "Más claridad" },
  ];

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">La diferencia</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A] max-w-lg">
            No es otro time tracker.
          </h2>
          <p className="mt-4 text-[16px] text-[#6B6B6B] max-w-lg leading-relaxed">
            Mientras otras herramientas solo registran horas, nuestro enfoque busca conectar el trabajo con contexto real: qué se está haciendo, para quién, con qué carga y dentro de qué operación.
          </p>
        </RevealSection>

        <div className="mt-14 max-w-xl space-y-4">
          {points.map((p, i) => (
            <RevealSection key={i} delay={i * 80}>
              <div className="flex items-center gap-4">
                <span className="text-[14px] text-[#CCC] line-through flex-1 text-right">{p.left}</span>
                <ChevronRight className="h-4 w-4 text-[#B8956A] shrink-0" />
                <span className="text-[14px] text-[#1A1A1A] font-semibold flex-1">{p.right}</span>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ───
function HowItWorks() {
  const steps = [
    { num: "01", title: "El equipo registra en qué está trabajando", desc: "Con un clic. Sin formularios complejos. La actividad queda conectada al contexto." },
    { num: "02", title: "Se conecta con tareas, clientes y contexto", desc: "Cada registro se vincula automáticamente con el proyecto y cliente correspondiente." },
    { num: "03", title: "Managers obtienen visibilidad clara", desc: "Dashboards en tiempo real que muestran qué está pasando sin preguntar ni interrumpir." },
    { num: "04", title: "Mejores decisiones, mejor información", desc: "La empresa opera con datos reales, no con suposiciones." },
  ];

  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-[#F5F3EE]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">Proceso</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A]">
            Cómo funciona.
          </h2>
        </RevealSection>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <RevealSection key={s.num} delay={i * 120}>
              <div>
                <span className="text-[48px] font-bold text-[#E0DDD6] leading-none">{s.num}</span>
                <h3 className="mt-4 text-[16px] font-semibold text-[#1A1A1A] leading-snug">{s.title}</h3>
                <p className="mt-2 text-[13px] text-[#6B6B6B] leading-relaxed">{s.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Use Cases ───
function UseCases() {
  const cases = [
    { icon: Palette, title: "Agencias creativas", desc: "Conecta el trabajo creativo con clientes y deadlines para entregar con más claridad." },
    { icon: TrendingUp, title: "Equipos de marketing", desc: "Visibilidad sobre campañas, carga de trabajo y priorización del equipo." },
    { icon: Briefcase, title: "Consultoras", desc: "Seguimiento de horas por proyecto y cliente para facturación más precisa." },
    { icon: Layers, title: "Estudios de diseño", desc: "Organiza proyectos, feedback y entregas en un solo flujo." },
    { icon: Globe, title: "Equipos remotos", desc: "Presencia y actividad del equipo sin depender de estar conectados al mismo tiempo." },
    { icon: Shield, title: "Empresas de servicios", desc: "Control operativo de principio a fin: desde la propuesta hasta el cobro." },
  ];

  return (
    <section id="casos-de-uso" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">Para quién</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A]">
            Hecho para equipos que operan en movimiento.
          </h2>
        </RevealSection>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c, i) => (
            <RevealSection key={c.title} delay={i * 80}>
              <div className="rounded-2xl border border-[#E8E8E4] p-6 hover:bg-[#FAFAF8] transition-colors duration-300 group">
                <c.icon className="h-5 w-5 text-[#B8956A] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-1.5">{c.title}</h3>
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">{c.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Showcase ───
function Showcase() {
  const modules = [
    { label: "Timer / Seguimiento", color: "#B8956A" },
    { label: "Actividad del equipo", color: "#28C840" },
    { label: "Gestión de clientes", color: "#5B8DEF" },
    { label: "Tareas y proyectos", color: "#FF9F43" },
    { label: "Finanzas", color: "#9C27B0" },
    { label: "Dashboard admin", color: "#1A1A1A" },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#F5F3EE]">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#B8956A] mb-4">Producto</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold leading-tight text-[#1A1A1A]">
            Un vistazo al ecosistema.
          </h2>
        </RevealSection>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m, i) => (
            <RevealSection key={m.label} delay={i * 80}>
              <div className="rounded-2xl border border-[#E0DDD6] bg-white overflow-hidden group hover:shadow-md transition-shadow duration-300">
                <div className="h-40 bg-gradient-to-br from-[#FAFAF8] to-[#F0EDE6] flex items-center justify-center relative">
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${m.color} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.color + "18" }}>
                    <div className="h-5 w-5 rounded" style={{ backgroundColor: m.color }} />
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[14px] font-semibold text-[#1A1A1A]">{m.label}</p>
                </div>
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
    <section id="contacto" className="py-24 md:py-32 bg-[#1A1A1A]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <RevealSection>
          <h2 className="text-[clamp(24px,4vw,44px)] font-bold leading-tight text-[#FAFAF8]">
            Si tu operación necesita más claridad, podemos ayudarte a construirla.
          </h2>
          <p className="mt-5 text-[16px] text-[#888] leading-relaxed max-w-lg mx-auto">
            Estudio Oasis diseña herramientas digitales para empresas que quieren trabajar con más orden, más visibilidad y mejor control.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="mailto:hola@estudiooasis.com"
              className="h-12 px-8 rounded-full bg-[#B8956A] text-[#FAFAF8] text-[14px] font-semibold flex items-center gap-2 hover:bg-[#A07D5A] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Agendar llamada <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/login"
              className="h-12 px-8 rounded-full border border-[#444] text-[#FAFAF8] text-[14px] font-semibold flex items-center gap-2 hover:border-[#666] transition-colors"
            >
              Ver Oasis OS
            </a>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── Footer ───
function Footer() {
  return (
    <footer className="py-12 bg-[#111] border-t border-[#222]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-7 w-7 rounded-lg bg-[#FAFAF8] flex items-center justify-center">
                <span className="text-[#1A1A1A] text-xs font-bold">O</span>
              </div>
              <span className="text-[#FAFAF8] font-semibold text-[14px]">Estudio Oasis</span>
            </div>
            <p className="text-[13px] text-[#666]">Sistemas y apps para empresas de servicio.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#666] hover:text-[#FAFAF8] transition-colors">
              LinkedIn
            </a>
            <a href="mailto:hola@estudiooasis.com" className="text-[13px] text-[#666] hover:text-[#FAFAF8] transition-colors">
              Email
            </a>
            <a href="#contacto" className="text-[13px] text-[#666] hover:text-[#FAFAF8] transition-colors">
              Contacto
            </a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[#222]">
          <p className="text-[12px] text-[#444]">© {new Date().getFullYear()} Estudio Oasis. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Landing Page ───
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-sans">
      <Navbar />
      <Hero />
      <WhatWeDo />
      <WhyVisibility />
      <ProductEcosystem />
      <FeaturedProduct />
      <WhyDifferent />
      <HowItWorks />
      <UseCases />
      <Showcase />
      <CtaSection />
      <Footer />
    </div>
  );
}
