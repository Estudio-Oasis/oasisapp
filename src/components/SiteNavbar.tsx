import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { SiteControls } from "@/components/SiteControls";
import { useLang } from "@/i18n/LanguageContext";

export function SiteNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { label: t("Servicios", "Services"), to: "/servicios" },
    { label: "Roger", to: "/roger" },
    { label: t("Contacto", "Contact"), to: "/contacto" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--paper))] transition-all duration-300 ${
        scrolled ? "border-b border-[hsl(var(--ink)/0.15)]" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-[1700px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-ultra text-[28px] md:text-[32px] leading-none text-[hsl(var(--ink))]"
        >
          OASIS
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="font-condensed text-[19px] leading-none text-[hsl(var(--ink)/0.55)] hover:text-[hsl(var(--ink))] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <SiteControls />
          <Link
            to="/contacto"
            className="font-condensed text-[19px] leading-none h-10 px-5 flex items-center bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:bg-[#E8453C] transition-colors"
          >
            {t("Hablemos", "Let's talk")}
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <SiteControls />
          <button
            className="text-[hsl(var(--ink))] h-10 w-10 flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t("Menú", "Menu")}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[hsl(var(--paper))] border-b border-[hsl(var(--ink)/0.15)] px-4 pb-5">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="block font-ultra text-[34px] leading-tight text-[hsl(var(--ink))]"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/contacto"
            onClick={() => setMobileOpen(false)}
            className="block mt-2 font-ultra text-[34px] leading-tight text-[#E8453C]"
          >
            {t("Hablemos", "Let's talk")} →
          </Link>
        </div>
      )}
    </nav>
  );
}
