import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

export function SiteControls({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center border-2 border-[hsl(var(--ink)/0.20)] h-10">
        {(["es", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`h-full px-3 font-label text-[11px] tracking-[0.1em] uppercase transition-colors ${
              lang === l
                ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]"
                : "text-[hsl(var(--ink)/0.50)] hover:text-[hsl(var(--ink))]"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Modo claro" : "Modo oscuro"}
        className="h-10 w-10 flex items-center justify-center border-2 border-[hsl(var(--ink)/0.20)] text-[hsl(var(--ink)/0.60)] hover:text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))] transition-colors"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
}
