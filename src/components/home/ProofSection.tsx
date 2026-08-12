import { BRANDS_MANAGED } from "./heroContent";
import { useLang } from "@/i18n/LanguageContext";

export function ProofSection() {
  const { t } = useLang();
  return (
    <section data-reveal className="bg-[hsl(var(--ink))] py-20 md:py-24 overflow-hidden">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--paper)/0.40)]">
          {t("12 años, marcas reales", "12 years, real brands")}
        </p>

        <h2 className="mt-6 font-ultra text-[clamp(30px,6vw,96px)] md:text-[min(5vw,8vh)] leading-[0.95] text-[hsl(var(--paper)/0.30)]">
          {t(
            "Venimos de ser brand managers y socios de crecimiento de",
            "We come from being brand managers and growth partners for",
          )}
        </h2>

        <p className="mt-6 md:mt-8 font-ultra text-[clamp(26px,5vw,72px)] md:text-[min(4.4vw,7vh)] leading-[1.02] text-[hsl(var(--paper)/0.25)]">
          {BRANDS_MANAGED.map((c, i) => (
            <span key={c}>
              <span className="text-[hsl(var(--paper)/0.75)] transition-colors duration-300 hover:text-[hsl(var(--paper))]">
                {c}
              </span>
              {i < BRANDS_MANAGED.length - 1 ? ", " : t(" y muchas más.", " and many more.")}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
