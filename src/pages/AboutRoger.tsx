import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, GraduationCap, ExternalLink, Mail, MessageCircle, Menu, X } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { RogerContactFab } from "@/components/RogerContactFab";

const WHATSAPP = "525667701206";
const WHATSAPP_DISPLAY = "+52 56 6770 1206";
const EMAIL = "joserogelioteran@gmail.com";
const WA_URL = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola Roger, vi tu sitio y me gustaría platicar.")}`;
const MAIL_URL = `mailto:${EMAIL}`;

type Lang = "es" | "en";

const T = {
  es: {
    topbarWa: "Escríbeme por WhatsApp",
    topbarMail: "Escríbeme por correo",
    navAbout: "Sobre mí",
    navExpertise: "Conocimiento",
    navTimeline: "Trayectoria",
    navWork: "Trabajo",
    navContact: "Contacto",
    eyebrow: "Hola, soy",
    heroSub: "Product & Growth Leader con formación en psicología y una trayectoria que combina marketing, producto y toma de decisiones basada en datos.",
    ctaPortfolio: "Ver portafolio",
    ctaContact: "Contáctame",
    aboutEyebrow: "Sobre mí",
    aboutTitle1: "Product & Growth Leader",
    aboutTitle2: "con alma creativa",
    bio1: 'Soy José Rogelio "Roger" Terán Bueno. Estudié Psicología en el Tec de Monterrey y después Dirección Creativa en Miami Ad School. Esa combinación — entender cómo piensan las personas y cómo comunicar ideas — ha definido toda mi carrera.',
    bio2: "He trabajado en agencias como Ogilvy, Leo Burnett, Havas, FCB, Media Monks y VML. Fui Director Creativo para Nivea en FCB. Lideré la estrategia de marca en español de los San Francisco 49ers, convirtiéndolos en el equipo #1 en redes sociales de la NFL en México.",
    bio3: "Como Chief Growth Officer en Rocketfy, escalé el revenue mensual de $1.5M a $4M USD en dos trimestres, liderando equipos de más de 40 personas. En Platzi, trabajé en el equipo de crecimiento enfocado en retención.",
    bio4: "Hoy soy profesor en Miami Ad School México, donde enseño Copywriting, Branding, Creative Direction y Paid Media.",
    bio5: "Mi principal fortaleza es traducir data compleja en decisiones estratégicas claras, alinear equipos alrededor de métricas que realmente importan y construir productos y experiencias que crecen porque resuelven problemas reales.",
    seePortfolio: "Ver mi portafolio →",
    pitchEyebrow: "¿Quieres hacer crecer tu marca?",
    pitchTitle: "Trabajemos juntos para escalar tu negocio.",
    pitchSub: "Branding, growth, contenido y producto — bajo un solo liderazgo. Escríbeme y te respondo el mismo día.",
    pitchWa: "Escríbeme por WhatsApp",
    pitchMail: "Mándame un correo",
    resultsEyebrow: "Resultados que he generado",
    resultsTitle: "No es teoría — es track record.",
    result1: "+166% revenue mensual en Rocketfy en 2 trimestres",
    result2: "Equipo 49ers #1 en redes sociales de la NFL en México",
    result3: "+200% tráfico web orgánico en Zoé Water",
    result4: "40+ personas lideradas en Growth, Data y Producto",
    resultsCta: "Quiero resultados así para mi marca →",
    inlineCta1: "¿Listo para llevar tu marca al siguiente nivel?",
    inlineCta1Sub: "Te ayudo a definir estrategia, identidad, contenido y growth en un solo proceso.",
    inlineCta2: "Si te suena, hablemos.",
    inlineCta2Sub: "Cuéntame qué necesitas y vemos cómo puedo aportar.",
    availabilityBadge: "🟢 Disponible para nuevos proyectos",
    finalKicker: "Respondo en menos de 24 horas. Sin compromiso.",
    expertiseTitle: "Áreas de conocimiento",
    timelineTitle: "15+ años de experiencia",
    workEyebrow: "Trabajo destacado",
    workTitle: "Una muestra del trabajo creativo y estratégico",
    workSub: "de más de 15 años.",
    ctaTitle1: "Trabajemos",
    ctaTitle2: "juntos",
    ctaWa: "WhatsApp",
    ctaMail: "Correo",
    location: "Ciudad de México, México",
  },
  en: {
    topbarWa: "Message me on WhatsApp",
    topbarMail: "Send me an email",
    navAbout: "About",
    navExpertise: "Expertise",
    navTimeline: "Experience",
    navWork: "Work",
    navContact: "Contact",
    eyebrow: "Hi, I'm",
    heroSub: "Product & Growth Leader with a background in psychology and a career that blends marketing, product and data-driven decisions.",
    ctaPortfolio: "See portfolio",
    ctaContact: "Contact me",
    aboutEyebrow: "About me",
    aboutTitle1: "Product & Growth Leader",
    aboutTitle2: "with a creative soul",
    bio1: 'I\'m José Rogelio "Roger" Terán Bueno. I studied Psychology at Tec de Monterrey and then Creative Direction at Miami Ad School. That combination — understanding how people think and how to communicate ideas — has defined my entire career.',
    bio2: "I've worked at agencies like Ogilvy, Leo Burnett, Havas, FCB, Media Monks and VML. I was Creative Director for Nivea at FCB. I led the Spanish-language brand strategy for the San Francisco 49ers, turning them into the #1 NFL team on social media in Mexico.",
    bio3: "As Chief Growth Officer at Rocketfy, I scaled monthly revenue from $1.5M to $4M USD in two quarters, leading teams of more than 40 people. At Platzi, I worked on the growth team focused on retention.",
    bio4: "Today I teach at Miami Ad School Mexico — Copywriting, Branding, Creative Direction and Paid Media.",
    bio5: "My core strength is translating complex data into clear strategic decisions, aligning teams around metrics that actually matter, and building products and experiences that grow because they solve real problems.",
    seePortfolio: "See my portfolio →",
    pitchEyebrow: "Want to grow your brand?",
    pitchTitle: "Let's work together to scale your business.",
    pitchSub: "Branding, growth, content and product — under one leadership. Reach out and I'll get back to you the same day.",
    pitchWa: "Message me on WhatsApp",
    pitchMail: "Send me an email",
    resultsEyebrow: "Results I've delivered",
    resultsTitle: "Not theory — track record.",
    result1: "+166% monthly revenue at Rocketfy in 2 quarters",
    result2: "49ers became #1 NFL team on social media in Mexico",
    result3: "+200% organic web traffic at Zoé Water",
    result4: "40+ people led across Growth, Data and Product",
    resultsCta: "I want results like these for my brand →",
    inlineCta1: "Ready to take your brand to the next level?",
    inlineCta1Sub: "I help you define strategy, identity, content and growth in one process.",
    inlineCta2: "If this resonates, let's talk.",
    inlineCta2Sub: "Tell me what you need and let's see how I can help.",
    availabilityBadge: "🟢 Available for new projects",
    finalKicker: "I respond in under 24 hours. No commitment.",
    expertiseTitle: "Areas of expertise",
    timelineTitle: "15+ years of experience",
    workEyebrow: "Featured work",
    workTitle: "A sample of creative and strategic work",
    workSub: "from over 15 years.",
    ctaTitle1: "Let's work",
    ctaTitle2: "together",
    ctaWa: "WhatsApp",
    ctaMail: "Email",
    location: "Mexico City, Mexico",
  },
};

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

function RogerNavbar({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = T[lang];
  return (
    <>
      {/* Topbar */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-[#1C1917] text-white text-[12px]">
        <div className="max-w-6xl mx-auto px-6 h-9 flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#A8A29E] hover:text-[#C8A96E] transition-colors">
              <MessageCircle className="h-3.5 w-3.5" /> {t.topbarWa}
            </a>
            <a href={MAIL_URL} className="flex items-center gap-1.5 text-[#A8A29E] hover:text-[#C8A96E] transition-colors">
              <Mail className="h-3.5 w-3.5" /> {t.topbarMail}
            </a>
          </div>
          <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="sm:hidden flex items-center gap-1.5 text-[#A8A29E]">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
          <div className="flex items-center gap-1 text-[11px] font-mono-label">
            <button onClick={() => setLang("es")} className={`px-2 py-0.5 rounded-sm transition-colors ${lang === "es" ? "text-[#C8A96E] font-semibold" : "text-[#A8A29E] hover:text-white"}`}>ES</button>
            <span className="text-[#57534E]">/</span>
            <button onClick={() => setLang("en")} className={`px-2 py-0.5 rounded-sm transition-colors ${lang === "en" ? "text-[#C8A96E] font-semibold" : "text-[#A8A29E] hover:text-white"}`}>EN</button>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="fixed top-9 left-0 right-0 z-50 bg-[#FAF7F2] border-b border-[#E7E0D8]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/roger" className="font-serif-display text-[18px] md:text-[20px] font-bold tracking-tight text-[#1C1917]">
            Roger Terán
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <a href="#about" className="text-[13px] font-medium text-[#57534E] hover:text-[#1C1917]">{t.navAbout}</a>
            <a href="#expertise" className="text-[13px] font-medium text-[#57534E] hover:text-[#1C1917]">{t.navExpertise}</a>
            <a href="#timeline" className="text-[13px] font-medium text-[#57534E] hover:text-[#1C1917]">{t.navTimeline}</a>
            <Link to="/portfolio" className="text-[13px] font-medium text-[#57534E] hover:text-[#1C1917]">{t.navWork}</Link>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="h-9 px-5 rounded-sm bg-[#1C1917] text-white text-[13px] font-semibold flex items-center gap-1.5 hover:bg-[#2D2D2D] transition-colors">
              {t.navContact}
            </a>
          </div>
          <button className="md:hidden text-[#1C1917]" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-[#FAF7F2] border-b border-[#E7E0D8] px-6 pb-4 space-y-3">
            <a href="#about" onClick={() => setMobileOpen(false)} className="block text-sm text-[#1C1917]">{t.navAbout}</a>
            <a href="#expertise" onClick={() => setMobileOpen(false)} className="block text-sm text-[#1C1917]">{t.navExpertise}</a>
            <a href="#timeline" onClick={() => setMobileOpen(false)} className="block text-sm text-[#1C1917]">{t.navTimeline}</a>
            <Link to="/portfolio" onClick={() => setMobileOpen(false)} className="block text-sm text-[#1C1917]">{t.navWork}</Link>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#C8A96E]">{t.navContact} →</a>
          </div>
        )}
      </nav>
    </>
  );
}

const TIMELINE_ES = [
  { years: "2011–2014", role: "Becario de RH / Marketing Interno", company: "Rassini", desc: "Primeros pasos en comunicación organizacional, marketing interno y branding corporativo." },
  { years: "2014–2016", role: "Brand Manager", company: "Mundo Cuervo / José Cuervo", desc: "Dirección creativa, desarrollo de marca y marketing experiencial para la división turística de José Cuervo en Tequila, Jalisco." },
  { years: "2015–2017", role: "Creative Direction", company: "Miami Ad School", desc: "Formación en dirección creativa y copywriting en una de las escuelas de publicidad más reconocidas del mundo." },
  { years: "2016–2019", role: "Growth Manager / CMO", company: "Zoé Water & 98 Coast Avenue", desc: "Liderazgo de estrategia creativa y growth. +200% tráfico web en Zoé Water. Campaña internacional 'Living the Coast Life' en 98 Coast Av." },
  { years: "2019–2021", role: "Retention Copywriter", company: "Platzi", desc: "Equipo de crecimiento enfocado en retención y engagement. Profesor de Creatividad." },
  { years: "2021–2024", role: "Chief Growth Officer", company: "Rocketfy", desc: "Escalé revenue mensual de $1.5M a $4M USD en dos trimestres. Lideré equipos de 40+ personas en Growth, Data, BI y Producto." },
  { years: "2023–Presente", role: "Profesor & Mentor", company: "Miami Ad School México", desc: "Copywriting, Branding, Creative Direction, Paid Media, Design Systems. Formando talento creativo senior." },
  { years: "2024–2025", role: "Brand Manager Español", company: "San Francisco 49ers", desc: "Estrategia de marca para el mercado hispanohablante. El equipo se convirtió en #1 en redes sociales de la NFL en México." },
];

const TIMELINE_EN = [
  { years: "2011–2014", role: "HR / Internal Marketing Intern", company: "Rassini", desc: "First steps in organizational communication, internal marketing and corporate branding." },
  { years: "2014–2016", role: "Brand Manager", company: "Mundo Cuervo / José Cuervo", desc: "Creative direction, brand development and experiential marketing for the tourism division of José Cuervo in Tequila, Jalisco." },
  { years: "2015–2017", role: "Creative Direction", company: "Miami Ad School", desc: "Training in creative direction and copywriting at one of the most recognized advertising schools in the world." },
  { years: "2016–2019", role: "Growth Manager / CMO", company: "Zoé Water & 98 Coast Avenue", desc: "Creative strategy and growth leadership. +200% web traffic at Zoé Water. International 'Living the Coast Life' campaign at 98 Coast Av." },
  { years: "2019–2021", role: "Retention Copywriter", company: "Platzi", desc: "Growth team focused on retention and engagement. Creativity professor." },
  { years: "2021–2024", role: "Chief Growth Officer", company: "Rocketfy", desc: "Scaled monthly revenue from $1.5M to $4M USD in two quarters. Led teams of 40+ in Growth, Data, BI and Product." },
  { years: "2023–Present", role: "Professor & Mentor", company: "Miami Ad School Mexico", desc: "Copywriting, Branding, Creative Direction, Paid Media, Design Systems. Training senior creative talent." },
  { years: "2024–2025", role: "Spanish Brand Manager", company: "San Francisco 49ers", desc: "Brand strategy for the Spanish-speaking market. The team became #1 on NFL social media in Mexico." },
];

const EXPERTISE_ES = [
  { cat: "Estrategia", tags: ["Brand Strategy", "Growth Marketing", "Product-Led Growth", "CRO", "Neuromarketing"] },
  { cat: "Creativo", tags: ["Creative Direction", "Copywriting", "Art Direction", "Content Strategy", "Storytelling"] },
  { cat: "Digital", tags: ["Paid Media", "Performance Marketing", "SEO/SEM", "Social Media", "Email Marketing"] },
  { cat: "Producto", tags: ["Product Design", "UX/UI", "Design Systems", "Frontend", "Data Analytics"] },
  { cat: "Liderazgo", tags: ["Team Building", "Cross-functional Leadership", "OKRs", "Cultura", "Coaching"] },
  { cat: "Herramientas", tags: ["Figma", "Webflow", "Python", "Google Analytics 4", "Shopify"] },
];

const EXPERTISE_EN = [
  { cat: "Strategy", tags: ["Brand Strategy", "Growth Marketing", "Product-Led Growth", "CRO", "Neuromarketing"] },
  { cat: "Creative", tags: ["Creative Direction", "Copywriting", "Art Direction", "Content Strategy", "Storytelling"] },
  { cat: "Digital", tags: ["Paid Media", "Performance Marketing", "SEO/SEM", "Social Media", "Email Marketing"] },
  { cat: "Product", tags: ["Product Design", "UX/UI", "Design Systems", "Frontend", "Data Analytics"] },
  { cat: "Leadership", tags: ["Team Building", "Cross-functional Leadership", "OKRs", "Culture", "Coaching"] },
  { cat: "Tools", tags: ["Figma", "Webflow", "Python", "Google Analytics 4", "Shopify"] },
];

const FEATURED_WORK = [
  { cat: "Brand Identity", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_brand_identity_bf807ff9.jpg", desc: { es: "Casa Nungaray mezcal, Ixtlahuaca, Intimo, Pure Pleasure — identidades visuales completas con aplicaciones", en: "Casa Nungaray mezcal, Ixtlahuaca, Intimo, Pure Pleasure — full visual identities with applications" }, span: true },
  { cat: "Advertising", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_advertising_61e40ef1.jpg", desc: { es: "Cubbo fulfillment, Mabe, All Bran, Platzi Day — campañas publicitarias multiplataforma", en: "Cubbo fulfillment, Mabe, All Bran, Platzi Day — multiplatform advertising campaigns" } },
  { cat: "Content Strategy", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_content_strategy_f5a25f34.jpg", desc: { es: "Kit-Cat Clock social media, Rocketfy Galaxia Ventas — estrategia de contenido y social media", en: "Kit-Cat Clock social media, Rocketfy Galaxia Ventas — content strategy and social media" } },
  { cat: "Product Design", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_product_design_fcdbb4ef.jpg", desc: { es: "Sedes, Mango app, Nouvet, alarm app — diseño web, apps móviles y plataformas digitales", en: "Sedes, Mango app, Nouvet, alarm app — web design, mobile apps and digital platforms" } },
  { cat: "Logos & Branding", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_logos_grid_0f4cd52b.jpg", desc: { es: "15+ identidades de marca creadas — desde mezcal artesanal hasta tech startups", en: "15+ brand identities created — from artisanal mezcal to tech startups" } },
  { cat: "Logo Evolution", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_logo_evolution_58c31615.jpg", desc: { es: "Evolución de logos para Rocketfy y Zoé Water — refinamiento estratégico de marca", en: "Logo evolution for Rocketfy and Zoé Water — strategic brand refinement" } },
];

export default function AboutRoger() {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "es";
    return (localStorage.getItem("roger-lang") as Lang) || "es";
  });
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("roger-lang", lang);
  }, [lang]);

  const t = T[lang];
  const TIMELINE = lang === "es" ? TIMELINE_ES : TIMELINE_EN;
  const EXPERTISE = lang === "es" ? EXPERTISE_ES : EXPERTISE_EN;

  return (
    <div className="min-h-screen font-body bg-[#FAF7F2]">
      <RogerNavbar lang={lang} setLang={setLang} />

      {/* Hero */}
      <section className="relative pt-[140px] pb-16 md:pt-[180px] md:pb-20 bg-[#1C1917]">
        <div className="relative max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">{t.eyebrow}</p>
            <h1 className="font-serif-display text-[clamp(36px,6vw,64px)] leading-[1.05] text-white">
              José Rogelio<br /><span className="italic text-[#C8A96E]">"Roger" Terán</span>
            </h1>
            <p className="mt-4 text-[16px] text-[#A8A29E] max-w-lg">
              {t.heroSub}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/portfolio" className="h-11 px-6 rounded-sm bg-[#C8A96E] text-[#1C1917] text-[13px] font-semibold flex items-center gap-2 hover:bg-[#D4B87A] transition-colors">
                {t.ctaPortfolio} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="h-11 px-6 rounded-sm border border-white/20 text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-white/5 transition-colors">
                <MessageCircle className="h-4 w-4" /> {t.ctaContact}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Bio */}
      <section id="about" className="py-24 md:py-36 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-5 gap-16">
          <div className="md:col-span-2 md:sticky md:top-32 self-start">
            <Reveal>
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/about-roger-XN3CDjsVCtGvdF5hcCG8Sk.webp" alt="Roger Terán" className="rounded-sm w-full object-cover mb-6" />
              <div className="space-y-3 text-[13px] text-[#57534E]">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#C8A96E]" /> {t.location}</div>
                <div className="flex items-start gap-2"><GraduationCap className="h-4 w-4 text-[#C8A96E] mt-0.5 shrink-0" />
                  <div>BS Psicología — Tec de Monterrey<br />Creative Direction — Miami Ad School<br />Social Justice — Harvard University</div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#C8A96E] hover:text-[#D4B87A] flex items-center gap-1">
                  WhatsApp <ExternalLink className="h-3 w-3" />
                </a>
                <a href={MAIL_URL} className="text-[12px] text-[#C8A96E] hover:text-[#D4B87A] flex items-center gap-1">
                  {lang === "es" ? "Correo" : "Email"} <ExternalLink className="h-3 w-3" />
                </a>
                {[
                  { label: "LinkedIn", href: "https://linkedin.com/in/rogerteran" },
                  { label: "Behance", href: "https://behance.net/rogertern" },
                  { label: "Instagram", href: "https://instagram.com/rayo_teran" },
                ].map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#C8A96E] hover:text-[#D4B87A] flex items-center gap-1">
                    {l.label} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-3">
            <Reveal>
              <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">{t.aboutEyebrow}</p>
              <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[#1C1917]">
                {t.aboutTitle1}<br /><span className="italic text-[#B85C38]">{t.aboutTitle2}</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-6 space-y-4 text-[15px] text-[#57534E] leading-relaxed">
                <p>{t.bio1}</p>
                <p>{t.bio2}</p>
                <p>{t.bio3}</p>
                <p>{t.bio4}</p>
                <p>{t.bio5}</p>
              </div>
              <Link to="/portfolio" className="inline-block mt-6 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#C8A96E] hover:text-[#D4B87A]">
                {t.seePortfolio}
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section id="expertise" className="py-20 bg-[#F0E8DD] scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,3vw,36px)] text-[#1C1917] text-center mb-12">{t.expertiseTitle}</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXPERTISE.map((e, i) => (
              <Reveal key={e.cat} delay={i * 80}>
                <div className="border border-[#E7E0D8] rounded-sm p-5 bg-white">
                  <h3 className="text-[14px] font-semibold text-[#1C1917] mb-3">{e.cat}</h3>
                  <div className="flex flex-wrap gap-2">
                    {e.tags.map((tag) => (
                      <span key={tag} className="text-[11px] px-2.5 py-1 rounded-sm bg-[#F0E8DD] text-[#57534E] font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section id="timeline" className="py-24 md:py-32 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,3vw,36px)] text-[#1C1917] text-center mb-16">{t.timelineTitle}</h2>
          </Reveal>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-[#E7E0D8]" />
            <div className="space-y-12">
              {TIMELINE.map((entry, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className={`relative flex items-start gap-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#C8A96E] border-2 border-[#FAF7F2] z-10" />
                    <div className={`ml-12 md:ml-0 md:w-[45%] ${i % 2 === 0 ? "md:text-right md:pr-8" : "md:text-left md:pl-8"}`}>
                      <span className="font-mono-label text-[11px] tracking-wider text-[#C8A96E]">{entry.years}</span>
                      <h3 className="text-[15px] font-semibold text-[#1C1917] mt-1">{entry.role}</h3>
                      <p className="text-[13px] font-medium text-[#B85C38]">{entry.company}</p>
                      <p className="text-[13px] text-[#57534E] mt-1 leading-relaxed">{entry.desc}</p>
                    </div>
                    <div className="hidden md:block md:w-[45%]" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trabajo Destacado */}
      <section className="py-24 md:py-32 bg-[#F0E8DD]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4 text-center">{t.workEyebrow}</p>
            <h2 className="font-serif-display text-[clamp(24px,3vw,36px)] text-[#1C1917] text-center mb-4">{t.workTitle}</h2>
            <p className="text-center text-[15px] text-[#57534E] mb-12">{t.workSub}</p>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURED_WORK.map((item, i) => (
              <Reveal key={item.cat} delay={i * 80} className={item.span ? "md:col-span-2" : ""}>
                <Link to="/portfolio" className="block border border-[#E7E0D8] rounded-sm overflow-hidden bg-white group">
                  <div className={`${item.span ? "aspect-[2/1]" : "aspect-[16/10]"} overflow-hidden`}>
                    <img src={item.img} alt={item.cat} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm bg-[#F0E8DD] text-[#57534E]">{item.cat}</span>
                    <p className="mt-2 text-[13px] text-[#57534E] leading-relaxed">{item.desc[lang]}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#1C1917]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,4vw,44px)] text-white">
              {t.ctaTitle1} <span className="italic text-[#C8A96E]">{t.ctaTitle2}</span>
            </h2>
            <p className="mt-3 text-[13px] text-[#A8A29E]">{WHATSAPP_DISPLAY}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="h-12 px-7 rounded-sm bg-[#C8A96E] text-[#1C1917] text-[14px] font-semibold flex items-center gap-2 hover:bg-[#D4B87A]">
                <MessageCircle className="h-4 w-4" /> {t.ctaWa}
              </a>
              <a href={MAIL_URL} className="h-12 px-7 rounded-sm border border-white/20 text-white text-[14px] font-semibold flex items-center gap-2 hover:bg-white/5">
                <Mail className="h-4 w-4" /> {t.ctaMail}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
      <RogerContactFab lang={lang} />
    </div>
  );
}
