import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export function SiteNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { label: "Servicios", to: "/servicios" },
    { label: "Portafolio", to: "/portfolio" },
    { label: "About", to: "/about" },
    { label: "Contacto", to: "/contacto" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-[#FCFCFA] transition-all duration-300 ${
        scrolled ? "border-b border-[#111110]/15" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-[1700px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="font-ultra text-[26px] md:text-[30px] leading-none text-[#111110]">
          OASIS
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="font-mono-label text-[11px] tracking-[0.2em] uppercase text-[#111110]/55 hover:text-[#111110] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/contacto"
            className="font-mono-label text-[11px] tracking-[0.2em] uppercase px-5 py-2.5 bg-[#111110] text-[#FCFCFA] hover:bg-[#E8453C] transition-colors"
          >
            Hablemos
          </Link>
        </div>

        <button
          className="md:hidden text-[#111110]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menú"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#FCFCFA] border-b border-[#111110]/15 px-4 pb-5">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="block font-ultra text-[34px] leading-tight text-[#111110]"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/contacto"
            onClick={() => setMobileOpen(false)}
            className="block mt-2 font-ultra text-[34px] leading-tight text-[#E8453C]"
          >
            Hablemos →
          </Link>
        </div>
      )}
    </nav>
  );
}
