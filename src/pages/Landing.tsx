import { useEffect, useState } from "react";
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
  ChevronDown,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import productDashboard from "@/assets/product-dashboard.png";
import productTimer from "@/assets/product-timer.png";
import productTasks from "@/assets/product-tasks.png";
import productQuotes from "@/assets/product-quotes.png";

const landingTrackedRef = { current: false };

const AGENCY_LOGOS = [
  { name: "Ogilvy", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/ogilvy_d7381671.png" },
  { name: "Leo Burnett", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/leo-burnett_c24e284a.png" },
  { name: "Havas", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/havas_304fe49c.jpg" },
  { name: "FCB", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/fcb_968bc1ba.png" },
  { name: "Media.Monks", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/media-monks_10b229d3.png" },
  { name: "VML", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/vml_a9ed372a.png" },
];

const PORTFOLIO_CHIPS = [
  "Brand Identity", "Advertising", "Content Strategy", "Product Design", "Logos & Branding",
];

// ─── Browser Frame ───
function BrowserFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[#E7E0D8] bg-white shadow-2xl overflow-hidden ${className}`}>
      <div className="h-8 bg-[#F5F0EB] border-b border-[#E7E0D8] flex items-center px-3 gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
      </div>
      {children}
    </div>
  );
}

// ─── iPhone Frame ───
function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[260px]">
      <div className="rounded-[2.5rem] border-[6px] border-[#1C1917] bg-[#1C1917] overflow-hidden shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1C1917] rounded-b-2xl z-10" />
        <div className="rounded-[2rem] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#FAF7F2] ${scrolled ? "shadow-sm" : ""} border-b border-[#E7E0D8]`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif-display text-[20px] font-bold tracking-tight text-[#1C1917]">OASIS</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-[13px] font-medium text-[#57534E] hover:text-[#1C1917] transition-colors">Inicio</Link>
          
          <div className="relative group" onMouseEnter={() => setAboutOpen(true)} onMouseLeave={() => setAboutOpen(false)}>
            <button className="text-[13px] font-medium text-[#57534E] hover:text-[#1C1917] transition-colors flex items-center gap-1">
              About <ChevronDown className="h-3 w-3" />
            </button>
            {aboutOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-[#E7E0D8] py-2 min-w-[180px]">
                <Link to="/about" className="block px-4 py-2 text-[13px] text-[#1C1917] hover:bg-[#F0E8DD] transition-colors">Estudio Oasis</Link>
                <Link to="/about/roger-teran" className="block px-4 py-2 text-[13px] text-[#1C1917] hover:bg-[#F0E8DD] transition-colors">Roger Terán</Link>
              </div>
            )}
          </div>

          <Link to="/portfolio" className="text-[13px] font-medium text-[#57534E] hover:text-[#1C1917] transition-colors">Portafolio</Link>
          <a href="#precios" className="text-[13px] font-medium text-[#57534E] hover:text-[#1C1917] transition-colors">Precios</a>
          <Link to="/login" className="text-[13px] font-medium text-[#57534E] hover:text-[#1C1917] transition-colors">Iniciar sesión</Link>
          <Link to="/signup" className="h-9 px-5 rounded-sm bg-[#1C1917] text-white text-[13px] font-semibold flex items-center gap-1.5 hover:bg-[#2D2D2D] transition-colors">
            Probar gratis
          </Link>
        </div>

        <button className="md:hidden text-[#1C1917]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-b border-[#E7E0D8] px-6 pb-4 space-y-3">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm text-[#1C1917]">Inicio</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block text-sm text-[#57534E]">Estudio Oasis</Link>
          <Link to="/portfolio" onClick={() => setMobileOpen(false)} className="block text-sm text-[#1C1917]">Portafolio</Link>
          <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-[#1C1917]">Iniciar sesión</Link>
          <Link to="/signup" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#C8A96E]">Probar gratis →</Link>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ───
function Hero() {
  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-[#FAF7F2]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-6">
            Sistema operativo para agencias
          </p>
          <h1 className="font-serif-display text-[clamp(32px,5vw,56px)] leading-[1.1] text-[#1C1917]">
            Le ponemos proceso y orden a tu{" "}
            <span className="italic text-[#C8A96E]">creatividad</span>
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-[#57534E] max-w-xl font-body">
            Todo lo que tu agencia necesita para facturar más, operar mejor y crecer sin caos.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/signup" className="h-12 px-7 rounded-sm bg-[#1C1917] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#2D2D2D] transition-all">
              Probar gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#producto" className="h-12 px-7 rounded-sm border border-[#1C1917] text-[#1C1917] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#1C1917] hover:text-white transition-all">
              Ver cómo funciona
            </a>
          </div>
        </div>
        <div>
          <img src={productDashboard} alt="Dashboard de OasisOS" className="w-full rounded-xl shadow-2xl" width={1280} height={800} />
        </div>
      </div>
    </section>
  );
}

// ─── Agency Logos ───
function AgencyLogos() {
  return (
    <section className="py-12 bg-[#FAF7F2] border-y border-[#E7E0D8]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#A8A29E] mb-8">
          Experiencia forjada en:
        </p>
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-14">
          {AGENCY_LOGOS.map((l) => (
            <img key={l.name} src={l.url} alt={l.name} className="h-7 md:h-9 object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-80 transition-all duration-500" loading="lazy" />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Origin Story ───
function OriginStory() {
  return (
    <section className="py-20 md:py-28 bg-[#1C1917]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-6">Nuestra historia</p>
        <h2 className="font-serif-display text-[clamp(24px,4vw,40px)] leading-tight text-white">
          No lo construimos en un hackathon.<br />
          <span className="italic text-[#C8A96E]">Lo construimos después de 15 años viviendo el mismo caos que tú.</span>
        </h2>
        <p className="mt-8 text-[15px] text-[#A8A29E] leading-relaxed font-body max-w-2xl mx-auto">
          Ogilvy, Leo Burnett, Havas, FCB, Media.Monks, VML. Seis agencias globales. Miles de horas intentando entender a dónde se iba el tiempo del equipo. Oasis OS es el sistema que nos hubiera gustado tener desde el día uno.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {PORTFOLIO_CHIPS.map((chip) => (
            <Link
              key={chip}
              to="/portfolio"
              className="px-4 py-1.5 rounded-full text-[12px] font-medium border border-white/15 text-[#A8A29E] hover:text-white hover:border-white/30 transition-colors"
            >
              {chip}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Problem ───
function ProblemSection() {
  return (
    <section className="py-20 md:py-28 bg-[#FAF7F2]">
      <div className="max-w-3xl mx-auto px-6">
        <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">El problema</p>
        <h2 className="font-serif-display text-[clamp(24px,4vw,40px)] leading-tight text-[#1C1917]">
          El problema no es la carga de trabajo.<br />
          <span className="italic text-[#B85C38]">Es no tener control sobre ella.</span>
        </h2>
        <div className="mt-8 space-y-5 text-[15px] text-[#57534E] leading-relaxed font-body">
          <p>Equipos creativos talentosos se pierden en la operación todos los días. No saben en qué se fue el día, no conectan trabajo con facturación, y toman decisiones basadas en intuición.</p>
          <p>Sin visibilidad real de dónde va el tiempo, es imposible saber qué clientes son rentables, quién tiene capacidad disponible, o por qué el equipo siempre se siente sobrecargado.</p>
          <p>Oasis OS nace de ver este patrón repetirse en 6 agencias globales durante 15+ años. La solución no es otro tracker. Es un sistema que conecta actividad, clientes y dinero.</p>
        </div>
      </div>
    </section>
  );
}

// ─── Product Tabs ───
function ProductTabs() {
  const tabs = [
    { value: "timer", label: "Bitácora", desc: "Registra tu trabajo en tiempo real con un clic. Ve el timeline de tu día y entiende exactamente en qué se fue cada hora.", img: productTimer, alt: "Timer inteligente de OasisOS" },
    { value: "tasks", label: "Tareas", desc: "Organiza el trabajo de tu equipo con tableros, prioridades y fechas. Conectado a clientes y proyectos.", img: productTasks, alt: "Gestión de tareas de OasisOS" },
    { value: "quotes", label: "Cotizaciones", desc: "Crea propuestas profesionales, envíalas por email y rastrea aprobaciones. Todo conectado a tus clientes.", img: productQuotes, alt: "Cotizaciones de OasisOS" },
  ];

  return (
    <section id="producto" className="py-20 md:py-28 bg-[#F0E8DD]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">El producto</p>
        <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[#1C1917]">Ve el producto en acción</h2>
        <p className="mt-2 text-[15px] text-[#57534E] font-body">Tres módulos que transforman cómo opera tu agencia.</p>

        <Tabs defaultValue="timer" className="mt-10">
          <TabsList className="bg-white/80 border border-[#E7E0D8] h-11 p-1 rounded-lg">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="rounded-md text-[13px] font-semibold data-[state=active]:bg-[#1C1917] data-[state=active]:text-white px-5">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value} className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                <div className="lg:col-span-2 pt-4">
                  <p className="text-[15px] text-[#57534E] leading-relaxed font-body">{t.desc}</p>
                  <Link to="/signup" className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-[#C8A96E] hover:text-[#1C1917] transition-colors">
                    Probar gratis <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="lg:col-span-3">
                  <img src={t.img} alt={t.alt} className="w-full rounded-xl shadow-2xl" loading="lazy" width={1280} height={800} />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

// ─── Desktop & Mobile ───
function DesktopMobileSection() {
  return (
    <section className="py-20 md:py-28 bg-[#FAF7F2]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4 text-center">Multi-dispositivo</p>
        <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[#1C1917] text-center">
          Tu oficina en tu bolsillo.
        </h2>
        <p className="mt-2 text-[15px] text-[#57534E] font-body text-center max-w-lg mx-auto">
          Funciona igual de bien en desktop y en tu celular. Registra tiempo desde donde sea.
        </p>
        <div className="mt-14 flex flex-col lg:flex-row items-center justify-center gap-10">
          <img src={productDashboard} alt="OasisOS en desktop" className="max-w-2xl flex-1 w-full rounded-xl shadow-2xl" loading="lazy" width={1280} height={800} />
          <IPhoneFrame>
            <img src={productTimer} alt="OasisOS en móvil" className="w-full" loading="lazy" />
          </IPhoneFrame>
        </div>
      </div>
    </section>
  );
}

// ─── Philosophy ───
function NotJustSection() {
  return (
    <section className="py-20 md:py-28 bg-[#1C1917]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-6">Filosofía</p>
        <h2 className="font-serif-display text-[clamp(24px,4vw,40px)] leading-tight text-white">
          Esto <span className="italic text-[#C8A96E]">no es</span> solo un tracker de horas.
        </h2>
        <div className="mt-8 space-y-5 text-[15px] text-[#A8A29E] leading-relaxed font-body max-w-2xl mx-auto">
          <p>Un tracker te dice cuántas horas trabajaste. Oasis OS te dice en qué las invertiste, para quién, y si valió la pena.</p>
          <p>Conectamos tres capas que normalmente viven separadas: la bitácora operativa, la gestión de clientes y proyectos, y la visibilidad financiera.</p>
          <p>El resultado: un registro operativo que te devuelve visibilidad. Sabes dónde va el tiempo, qué clientes son rentables, y puedes tomar decisiones con datos reales.</p>
        </div>
      </div>
    </section>
  );
}

// ─── For Who ───
function ForWho() {
  const segments = [
    {
      icon: Palette,
      title: "Freelancers",
      desc: "Trackea tu tiempo, calcula tu valor hora real y cobra lo que vales. Tu bitácora personal con inteligencia económica.",
      cta: "Empieza gratis",
      link: "/signup",
    },
    {
      icon: Users,
      title: "Equipos",
      desc: "Visibilidad en tiempo real de quién trabaja en qué. Coordina sin interrumpir el flujo creativo.",
      cta: "Ver planes de equipo",
      link: "/pricing",
    },
    {
      icon: Briefcase,
      title: "Agencias",
      desc: "Gestiona clientes, cotizaciones y finanzas en un lugar. De la propuesta al cobro, todo conectado.",
      cta: "Ver planes de agencia",
      link: "/pricing",
    },
  ];

  const additionalProfiles = [
    { icon: Target, title: "Líderes y admins", desc: "Toma decisiones con datos reales de operación." },
    { icon: TrendingUp, title: "Consultores", desc: "Registra horas por proyecto para cobrar mejor." },
    { icon: Globe, title: "Founders", desc: "Pon orden a la operación desde el día uno." },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#FAF7F2]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">Para quién es</p>
        <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[#1C1917]">
          Para cualquiera que necesite saber en qué se va su tiempo.
        </h2>

        {/* Primary segments — 3 columns with CTAs */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {segments.map((s) => (
            <div key={s.title} className="rounded-sm border border-[#E7E0D8] p-6 bg-white hover:bg-[#F0E8DD] transition-colors duration-300 group flex flex-col">
              <s.icon className="h-6 w-6 text-[#C8A96E] mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-[17px] font-semibold text-[#1C1917] mb-2">{s.title}</h3>
              <p className="text-[14px] text-[#57534E] leading-relaxed font-body flex-1">{s.desc}</p>
              <Link to={s.link} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#C8A96E] hover:text-[#1C1917] transition-colors">
                {s.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Additional profiles */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {additionalProfiles.map((p) => (
            <div key={p.title} className="rounded-sm border border-[#E7E0D8] p-4 bg-white hover:bg-[#F0E8DD] transition-colors duration-300 group">
              <p.icon className="h-4 w-4 text-[#C8A96E] mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-[14px] font-semibold text-[#1C1917] mb-1">{p.title}</h3>
              <p className="text-[12px] text-[#57534E] leading-relaxed font-body">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ───
function PricingSection() {
  const plans = [
    { name: "Individual", price: "Gratis", period: "", desc: "Para freelancers y creativos", features: ["Registro ilimitado", "Historial de 14 días", "5 refinamientos AI/día", "Timer + registro manual", "Valor hora calculado"], cta: "Empezar gratis", link: "/signup", popular: false, accent: false },
    { name: "Starter", price: "$9", period: "/mes", desc: "Para freelancers y equipos pequeños", features: ["Hasta 3 miembros", "Historial completo", "AI ilimitado", "Exportación de datos", "Visibilidad de equipo"], cta: "Elegir plan", link: "/signup", popular: false, accent: false },
    { name: "Estudio", price: "$16", period: "/mes", desc: "Para estudios y agencias medianas", features: ["Hasta 6 miembros", "Historial completo", "AI ilimitado", "Exportación de datos", "Visibilidad de equipo", "Soporte prioritario"], cta: "Elegir plan", link: "/signup", popular: true, accent: true },
    { name: "Agencia", price: "$20", period: "/mes", desc: "Para agencias y equipos grandes", features: ["Hasta 10 miembros", "Historial completo", "AI ilimitado", "Exportación de datos", "Visibilidad de equipo", "Soporte prioritario", "Onboarding personalizado"], cta: "Elegir plan", link: "/signup", popular: false, accent: false },
  ];

  return (
    <section id="precios" className="py-20 md:py-28 bg-[#F0E8DD]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">Precios</p>
        <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[#1C1917]">Simple y transparente.</h2>
        <p className="mt-3 text-[16px] text-[#57534E] font-body">Empieza gratis. Escala cuando tu equipo lo necesite.</p>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-sm border-2 p-5 h-full flex flex-col bg-white ${plan.accent ? "border-[#C8A96E] shadow-[0_8px_30px_-10px_rgba(200,169,110,0.2)]" : "border-[#E7E0D8]"}`}>
              {plan.popular && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-sm bg-[#C8A96E] text-white w-fit mb-3">Más popular</span>
              )}
              <h3 className="text-[16px] font-bold text-[#1C1917]">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-0.5">
                <span className="text-[32px] font-bold text-[#1C1917] leading-none">{plan.price}</span>
                {plan.period && <span className="text-[14px] text-[#57534E]">{plan.period}</span>}
              </div>
              <p className="mt-2 text-[13px] text-[#57534E] font-body">{plan.desc}</p>
              <ul className="mt-4 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A96E] mt-0.5 shrink-0" />
                    <span className="text-[12px] text-[#57534E]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to={plan.link} className={`mt-5 h-10 rounded-sm text-[13px] font-semibold flex items-center justify-center transition-colors ${plan.accent ? "bg-[#C8A96E] text-white hover:bg-[#D4B87A]" : "border border-[#E7E0D8] text-[#1C1917] hover:bg-[#F0E8DD]"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-[13px] text-[#A8A29E] font-body">
          ¿Necesitas más de 10 miembros?{" "}
          <a href="https://tally.so/r/wMrqBp" target="_blank" rel="noopener noreferrer" className="text-[#C8A96E] font-medium hover:underline">Contáctanos →</a>
        </p>
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
    <section id="como-funciona" className="py-20 md:py-28 bg-[#FAF7F2]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">Cómo funciona</p>
        <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[#1C1917]">Empieza en menos de un minuto.</h2>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.num}>
              <span className="font-serif-display text-[48px] font-bold text-[#E7E0D8] leading-none">{s.num}</span>
              <h3 className="mt-3 text-[16px] font-semibold text-[#1C1917]">{s.title}</h3>
              <p className="mt-2 text-[13px] text-[#57534E] leading-relaxed font-body">{s.desc}</p>
            </div>
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
        <h2 className="font-serif-display text-[clamp(24px,4vw,44px)] leading-tight text-white">
          Empieza a registrar tu día.
        </h2>
        <p className="mt-4 text-[16px] text-[#A8A29E] font-body max-w-md mx-auto">
          Prueba Oasis OS gratis. Sin tarjeta, sin compromiso.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link to="/bitacora-demo" className="h-12 px-8 rounded-sm bg-[#C8A96E] text-[#1C1917] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#D4B87A] transition-all">
            Probar gratis <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/signup" className="h-12 px-8 rounded-sm border border-white/20 text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:border-white/40 transition-colors">
            Crear cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───
function SiteFooter() {
  return (
    <footer className="py-16 md:py-24 bg-[#1C1917]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <span className="font-serif-display text-[28px] text-white">OASIS</span>
          <p className="mt-4 text-[14px] text-[#A8A29E] leading-relaxed font-body max-w-sm">
            Estudio creativo con 15+ años de experiencia en agencias globales. Creadores de Oasis OS — el sistema operativo para equipos creativos y de servicios.
          </p>
        </div>
        <div>
          <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#A8A29E] mb-4">Navegación</h4>
          <div className="space-y-2">
            {[
              { label: "Inicio", to: "/" },
              { label: "About", to: "/about" },
              { label: "Portafolio", to: "/portfolio" },
              { label: "Precios", to: "/pricing" },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#A8A29E] mb-4">Contacto</h4>
          <div className="space-y-2">
            <a href="mailto:joserogelioteran@gmail.com" className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors">joserogelioteran@gmail.com</a>
            <a href="https://linkedin.com/in/rogerteran" target="_blank" rel="noopener noreferrer" className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors">LinkedIn</a>
            <a href="https://behance.net/rogertern" target="_blank" rel="noopener noreferrer" className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors">Behance</a>
            <Link to="/login" className="block text-[13px] text-[#A8A29E]/50 hover:text-white transition-colors">Acceso equipo Oasis</Link>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between gap-2">
        <p className="text-[11px] text-[#A8A29E]/50">© 2026 Estudio Oasis. Todos los derechos reservados.</p>
        <p className="text-[11px] text-[#A8A29E]/50">Ciudad de México, México</p>
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
      <OriginStory />
      <ProblemSection />
      <ProductTabs />
      <DesktopMobileSection />
      <NotJustSection />
      <ForWho />
      <PricingSection />
      <HowItWorks />
      <CtaSection />
      <SiteFooter />
    </div>
  );
}
