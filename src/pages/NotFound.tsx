import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";

export default function NotFound() {
  const location = useLocation();
  const { t } = useLang();

  useEffect(() => {
    console.error("404: User attempted to access:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[hsl(var(--paper))] font-body flex items-center">
      <div className="grain-overlay" aria-hidden />
      <div className="max-w-[1700px] w-full mx-auto px-4 md:px-6">
        <p className="font-label text-[hsl(var(--ink)/0.40)]">404</p>
        <h1 className="mt-4 font-ultra text-[clamp(44px,12vw,220px)] md:text-[min(9.6vw,15vh)] leading-[0.9] text-[hsl(var(--ink))]">
          {t("Esta página", "This page")}{" "}
          <span className="text-[#C5221F]">{t("no existe.", "doesn't exist.")}</span>
        </h1>
        <p className="mt-6 font-body text-[15px] md:text-[18px] leading-relaxed text-[hsl(var(--ink)/0.55)] max-w-[52ch]">
          {t(
            "La URL que buscas no se encontró. Puede que se haya movido o eliminado.",
            "The URL you're looking for wasn't found. It may have moved or been removed.",
          )}
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center h-12 px-6 bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:bg-[#C5221F] transition-colors font-label"
        >
          {t("Volver al inicio", "Back home")}
        </Link>
      </div>
    </div>
  );
}
