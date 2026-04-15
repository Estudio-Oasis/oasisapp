import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function AvisoPrivacidadPage() {
  return (
    <div className="min-h-screen font-body bg-[#FAF7F2]">
      <SiteNavbar />

      <section className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="font-serif-display text-[clamp(28px,4vw,44px)] text-[#1C1917] mb-8">Aviso de Privacidad</h1>
          <div className="prose prose-neutral max-w-none text-[15px] text-[#57534E] leading-relaxed font-body space-y-6">
            <p>
              <strong>Estudio Oasis</strong> con domicilio en Ciudad de México, México, es responsable del tratamiento de sus datos personales.
            </p>
            <h2 className="font-serif-display text-[20px] text-[#1C1917] mt-8">Datos que recopilamos</h2>
            <p>
              Recopilamos datos personales como nombre, correo electrónico, empresa y mensaje cuando usted nos contacta a través de nuestro formulario web o correo electrónico.
            </p>
            <h2 className="font-serif-display text-[20px] text-[#1C1917] mt-8">Uso de los datos</h2>
            <p>
              Sus datos personales serán utilizados exclusivamente para responder a sus consultas, proporcionar cotizaciones de servicios y mantener comunicación relacionada con proyectos potenciales o en curso.
            </p>
            <h2 className="font-serif-display text-[20px] text-[#1C1917] mt-8">Protección de datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales contra acceso no autorizado, pérdida o alteración.
            </p>
            <h2 className="font-serif-display text-[20px] text-[#1C1917] mt-8">Derechos ARCO</h2>
            <p>
              Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales. Para ejercer estos derechos, envíe un correo a <a href="mailto:joserogelioteran@gmail.com" className="text-[#C8A96E] hover:underline">joserogelioteran@gmail.com</a>.
            </p>
            <h2 className="font-serif-display text-[20px] text-[#1C1917] mt-8">Contacto</h2>
            <p>
              Para cualquier duda sobre este aviso de privacidad, contáctenos en <a href="mailto:joserogelioteran@gmail.com" className="text-[#C8A96E] hover:underline">joserogelioteran@gmail.com</a>.
            </p>
            <p className="text-[#A8A29E] text-[13px] mt-8">Última actualización: Abril 2026</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
