import { Link } from "react-router-dom";

const NAV = [
  { label: "Inicio", to: "/" },
  { label: "Servicios", to: "/servicios" },
  { label: "Roger", to: "/roger" },
  { label: "Contacto", to: "/contacto" },
];


export function SiteFooter() {
  return (
    <footer className="bg-[hsl(var(--ink))] pt-16 md:pt-20 pb-8 border-t border-[hsl(var(--paper)/0.10)]">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-ultra leading-[0.85] text-[clamp(64px,20vw,300px)] md:text-[min(15vw,22vh)] text-[hsl(var(--paper)/0.12)]">
          OASIS
        </p>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-[hsl(var(--paper)/0.15)] pt-8">
          <div>
            <h4 className="font-label text-[10px] tracking-[0.3em] uppercase text-[hsl(var(--paper)/0.35)] mb-4">
              Estudio
            </h4>
            <p className="text-[14px] text-[hsl(var(--paper)/0.70)] leading-relaxed">
              Crecimiento basado en sistemas.
            </p>
            <p className="mt-3 text-[13px] text-[hsl(var(--paper)/0.40)]">Ciudad de México</p>
          </div>

          <div>
            <h4 className="font-label text-[10px] tracking-[0.3em] uppercase text-[hsl(var(--paper)/0.35)] mb-4">
              Navegación
            </h4>
            <div className="space-y-2">
              {NAV.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="block text-[13px] text-[hsl(var(--paper)/0.60)] hover:text-[hsl(var(--paper))] transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-label text-[10px] tracking-[0.3em] uppercase text-[hsl(var(--paper)/0.35)] mb-4">
              Contacto
            </h4>
            <div className="space-y-2">
              <a
                href="mailto:joserogelioteran@gmail.com"
                className="block text-[13px] text-[hsl(var(--paper)/0.60)] hover:text-[hsl(var(--paper))] transition-colors"
              >
                Mail
              </a>
              <a
                href="https://wa.me/525667701206"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] text-[hsl(var(--paper)/0.60)] hover:text-[hsl(var(--paper))] transition-colors"
              >
                WhatsApp
              </a>
              <Link
                to="/contacto"
                className="block text-[13px] text-[hsl(var(--paper)/0.60)] hover:text-[hsl(var(--paper))] transition-colors"
              >
                Formulario
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-label text-[10px] tracking-[0.3em] uppercase text-[hsl(var(--paper)/0.35)] mb-4">
              Redes
            </h4>
            <div className="space-y-2">
              <a
                href="https://www.instagram.com/oasistud.io"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] text-[hsl(var(--paper)/0.60)] hover:text-[hsl(var(--paper))] transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.linkedin.com/in/rogerteran"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] text-[hsl(var(--paper)/0.60)] hover:text-[hsl(var(--paper))] transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://www.behance.net/rogertern"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] text-[hsl(var(--paper)/0.60)] hover:text-[hsl(var(--paper))] transition-colors"
              >
                Behance
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[hsl(var(--paper)/0.10)] flex flex-col md:flex-row justify-between gap-2">
          <p className="font-label text-[10px] tracking-[0.2em] uppercase text-[hsl(var(--paper)/0.30)]">
            © 2026 Estudio Oasis
          </p>
          <Link
            to="/aviso-de-privacidad"
            className="font-label text-[10px] tracking-[0.2em] uppercase text-[hsl(var(--paper)/0.30)] hover:text-[hsl(var(--paper))] transition-colors"
          >
            Aviso de Privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}
