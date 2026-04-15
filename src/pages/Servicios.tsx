import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";

const SERVICES = [
  {
    num: "01",
    title: "Branding",
    description:
      "Creamos identidades memorables desde la narrativa hasta el diseño. Cada proyecto comienza con entender a fondo el negocio, el mercado y la audiencia para construir una marca que conecte y se distinga.",
    deliverables:
      "Logotipos · Sistemas de identidad visual · Naming · Paletas de color · Tipografía · Packaging · Señalética · Papelería · Brandbooks · Rediseños · Mockups · Merchandise",
    dark: false,
    imageRight: true,
    placeholderBg: "#C9A96E",
    placeholderLabel: "BRANDING",
  },
  {
    num: "02",
    title: "Marketing & Publicidad",
    description:
      "Desarrollamos campañas que generan resultados medibles. Desde la estrategia hasta la producción y distribución, trabajamos en medios digitales y tradicionales con un enfoque en ROI real.",
    deliverables:
      "Estrategia de contenido · Campañas Meta Ads · Google Ads · TikTok Ads · Community management · Producción foto y video · Email marketing · Influencer marketing · OOH y medios tradicionales · SEO",
    dark: true,
    imageRight: false,
    placeholderBg: "#2D5A3D",
    placeholderLabel: "MARKETING",
  },
  {
    num: "03",
    title: "Tecnología",
    description:
      "Construimos plataformas digitales a medida: desde un sitio de portafolio hasta un e-commerce completo o un sistema interno para tu equipo. Todo responsive, rápido y fácil de administrar.",
    deliverables:
      "Websites · Landing pages · E-commerce · Apps web y móvil · Webflow · Shopify · Sistemas internos · Intranets · Tiendas en MercadoLibre y Amazon · SEO técnico",
    dark: false,
    imageRight: true,
    placeholderBg: "#1a3a5c",
    placeholderLabel: "TECNOLOGÍA",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Entender",
    text: "Investigamos el problema, el mercado y la audiencia antes de diseñar nada.",
  },
  {
    step: "02",
    title: "Estrategia",
    text: "Definimos el posicionamiento, el mensaje y el plan de trabajo.",
  },
  {
    step: "03",
    title: "Producción",
    text: "Diseñamos, desarrollamos y producimos con atención al detalle.",
  },
  {
    step: "04",
    title: "Lanzamiento",
    text: "Entregamos, medimos y optimizamos para maximizar resultados.",
  },
];

export default function ServiciosPage() {
  return (
    <div className="min-h-screen font-body">
      <SiteNavbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-[#FAF7F2]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#A8A29E] mb-4">
            SERVICIOS
          </p>
          <h1 className="font-serif-display text-[clamp(36px,6vw,64px)] leading-[1.05] text-[#1C1917]">
            Tres áreas.{" "}
            <span className="italic text-[#C8A96E]">Un estudio.</span>
          </h1>
          <p className="mt-5 text-[17px] text-[#57534E] max-w-xl mx-auto font-body leading-relaxed">
            Branding, marketing y tecnología trabajando juntos para hacer crecer
            tu marca.
          </p>
        </div>
      </section>

      {/* Services */}
      {SERVICES.map((s) => {
        const bgClass = s.dark ? "bg-[#1a1a1a]" : "bg-[#FAF7F2]";
        const textColor = s.dark ? "text-white" : "text-[#1C1917]";
        const subColor = s.dark ? "text-[#A8A29E]" : "text-[#57534E]";

        const image = (
          <div
            className="h-[240px] md:h-[400px] rounded-sm flex items-center justify-center"
            style={{ backgroundColor: s.placeholderBg }}
          >
            <span className="text-white/80 text-[18px] md:text-[24px] font-mono-label tracking-[0.3em]">
              {s.placeholderLabel}
            </span>
          </div>
        );

        const content = (
          <div className="flex flex-col justify-center">
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-2">
              {s.num}
            </p>
            <h2
              className={`font-serif-display text-[clamp(28px,3.5vw,44px)] leading-[1.1] ${textColor}`}
            >
              {s.title}
            </h2>
            <p className={`mt-4 text-[16px] leading-relaxed ${subColor} font-body`}>
              {s.description}
            </p>
            <p
              className={`mt-6 text-[13px] leading-loose ${subColor} opacity-70 font-body`}
            >
              {s.deliverables}
            </p>
          </div>
        );

        return (
          <section key={s.num} className={`${bgClass} py-16 md:py-28`}>
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              {s.imageRight ? (
                <>
                  {content}
                  {image}
                </>
              ) : (
                <>
                  <div className="order-2 md:order-1">{image}</div>
                  <div className="order-1 md:order-2">{content}</div>
                </>
              )}
            </div>
          </section>
        );
      })}

      {/* Process */}
      <section className="py-16 md:py-28 bg-[#1C1917]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-serif-display text-[clamp(28px,4vw,44px)] text-white text-center mb-12 md:mb-16">
            Nuestro <span className="italic text-[#C8A96E]">proceso.</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 md:gap-14">
            {PROCESS.map((p) => (
              <div key={p.step}>
                <span className="font-serif-display text-[48px] font-bold text-[#C8A96E]/20 leading-none">
                  {p.step}
                </span>
                <h3 className="mt-1 font-serif-display text-[22px] text-white">
                  {p.title}
                </h3>
                <p className="mt-2 text-[15px] text-[#A8A29E] font-body leading-relaxed">
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-28 bg-[#FAF7F2]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif-display text-[clamp(28px,4.5vw,48px)] text-[#1C1917]">
            ¿Tienes un proyecto{" "}
            <span className="italic text-[#C8A96E]">en mente?</span>
          </h2>
          <p className="mt-4 text-[16px] text-[#57534E] font-body">
            Cuéntanoslo. Respondemos en menos de 24 horas.
          </p>
          <Link
            to="/contacto"
            className="mt-8 inline-flex items-center gap-2 h-12 px-8 rounded-sm bg-[#1C1917] text-white text-[14px] font-semibold hover:bg-[#2D2D2D] transition-all"
          >
            Hablemos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
