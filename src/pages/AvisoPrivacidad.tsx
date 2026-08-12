import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { useLang, type Bi } from "@/i18n/LanguageContext";

const BLOCKS: { title: Bi; body: Bi }[] = [
  {
    title: { es: "Datos que recopilamos", en: "Data we collect" },
    body: {
      es: "Cuando llenas el brief o el cotizador guardamos tu nombre, correo o WhatsApp, empresa y el contexto de negocio que nos compartes, junto con la página desde la que nos escribiste.",
      en: "When you fill in the brief or the estimate builder we store your name, email or WhatsApp, company, and the business context you share, along with the page you wrote from.",
    },
  },
  {
    title: { es: "Uso de los datos", en: "How we use it" },
    body: {
      es: "Los usamos únicamente para responderte, preparar tu diagnóstico o propuesta y darle seguimiento. No vendemos ni compartimos tus datos con terceros para publicidad.",
      en: "We use it only to reply, prepare your diagnosis or proposal, and follow up. We don't sell or share your data with third parties for advertising.",
    },
  },
  {
    title: { es: "Protección", en: "Protection" },
    body: {
      es: "La información se guarda en una base de datos con acceso restringido al equipo de Estudio Oasis y medidas técnicas para evitar accesos no autorizados.",
      en: "Information is stored in a database with access restricted to the Estudio Oasis team, with technical measures against unauthorized access.",
    },
  },
  {
    title: { es: "Derechos ARCO", en: "Your rights" },
    body: {
      es: "Puedes Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos escribiéndonos a r@oasistud.io. Atendemos la solicitud en menos de 30 días.",
      en: "You can access, correct, delete, or object to the processing of your data by writing to r@oasistud.io. We handle requests within 30 days.",
    },
  },
];

export default function AvisoPrivacidadPage() {
  const { t, pick } = useLang();

  return (
    <div className="min-h-screen font-body bg-[hsl(var(--paper))]">
      <div className="grain-overlay" aria-hidden />
      <SiteNavbar />

      <section className="pt-24 md:pt-28 pb-16 md:pb-24">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <p className="font-label text-[hsl(var(--ink)/0.40)]">
            {t("Legal", "Legal")}
          </p>
          <h1 className="mt-5 font-ultra text-[clamp(34px,10vw,190px)] md:text-[min(8.6vw,14vh)] leading-[0.92] text-[hsl(var(--ink))]">
            {t("Aviso de", "Privacy")}{" "}
            <span className="text-[#C5221F]">{t("privacidad.", "notice.")}</span>
          </h1>
          <p className="mt-6 font-body text-[15px] md:text-[18px] leading-relaxed text-[hsl(var(--ink)/0.60)] max-w-[66ch]">
            {t(
              "Estudio Oasis, con domicilio en Ciudad de México, es responsable del tratamiento de tus datos personales.",
              "Estudio Oasis, based in Mexico City, is responsible for processing your personal data.",
            )}
          </p>

          <div className="mt-12 grid md:grid-cols-2 gap-x-14 gap-y-10 border-t-2 border-[hsl(var(--ink))] pt-10">
            {BLOCKS.map((b) => (
              <div key={b.title.es}>
                <h2 className="font-condensed text-[clamp(20px,2.8vw,34px)] leading-none text-[hsl(var(--ink))]">
                  {pick(b.title)}
                </h2>
                <p className="mt-3 font-body text-[15px] md:text-[17px] leading-relaxed text-[hsl(var(--ink)/0.60)] max-w-[60ch]">
                  {pick(b.body)}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-12 font-label text-[hsl(var(--ink)/0.35)]">
            {t("Última actualización: abril 2026", "Last updated: April 2026")}
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
