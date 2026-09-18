import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { BriefSection } from "@/components/home/BriefSection";
import { useLang } from "@/i18n/LanguageContext";
import { ExpertCTA } from "@/components/ExpertCTA";
import { Seo } from "@/components/Seo";

const EMAIL = "r@oasistud.io";
const WA_URL = "https://wa.me/525667701206";

const CHANNELS = [
  { label: "WhatsApp", value: "+52 56 6770 1206", href: WA_URL, external: true },
  { label: "Email", value: EMAIL, href: `mailto:${EMAIL}`, external: false },
  { label: "Instagram", value: "@oasistud.io", href: "https://instagram.com/oasistud.io", external: true },
  { label: "LinkedIn", value: "/in/rogerteran", href: "https://www.linkedin.com/in/rogerteran", external: true },
];

export default function ContactoPage() {
  const { t } = useLang();
  return (
    <div className="min-h-screen font-body bg-[hsl(var(--paper))]">
      <div className="grain-overlay" aria-hidden />
      <Seo title={{ es: "Contacto | Estudio Oasis", en: "Contact | Estudio Oasis" }} description={{ es: "Cuéntanos qué está pasando en tu negocio. Empezamos por diagnosticar.", en: "Tell us what is happening in your business. We start with a diagnosis." }} path="/contacto" />
      <SiteNavbar />

      <section className="pt-24 md:pt-28 pb-12 md:pb-16">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <p className="font-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--ink)/0.40)]">
            {t("Contacto", "Contact")}
          </p>
          <h1 className="mt-5 font-ultra text-[clamp(46px,12vw,220px)] md:text-[min(9.6vw,15vh)] leading-[0.9] text-[hsl(var(--ink))]">
            {t("No te va a contestar", "You will not hear from")} {" "}
            <span className="text-[#C5221F]">{t("un bot.", "a bot.")}</span>
          </h1>
          <p className="mt-6 font-body text-[15px] md:text-[18px] leading-relaxed text-[hsl(var(--ink)/0.55)] max-w-[64ch]">
            {t(
              "Cuando escribes desde esta página hablas directamente con un experto de Oasis. Cuéntanos qué vendes, qué funciona, qué no y qué quieres conseguir.",
              "When you write from this page you talk directly to an Oasis expert. Tell us what you sell, what works, what does not, and what you want to achieve.",
            )}
          </p>
          <div className="mt-7"><ExpertCTA source="contacto" /></div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 border-t-2 border-[hsl(var(--ink))]">
            {CHANNELS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                className="group py-6 md:py-8 lg:px-6 lg:first:pl-0 border-b border-[hsl(var(--ink)/0.15)] lg:border-b-0 lg:border-r lg:border-r-[hsl(var(--ink)/0.15)] lg:last:border-r-0"
              >
                <span className="font-label text-[10px] tracking-[0.24em] uppercase text-[hsl(var(--ink)/0.40)]">
                  {c.label === "Email" ? t("Correo", "Email") : c.label}
                </span>
                <p className="mt-2 font-condensed text-[clamp(20px,3vw,32px)] leading-none text-[hsl(var(--ink))] group-hover:text-[#C5221F] transition-colors break-words">
                  {c.value}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <BriefSection />

      <SiteFooter />
    </div>
  );
}
