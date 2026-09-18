import { ArrowUpRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { whatsappUrl } from "@/lib/contact";

export function ExpertCTA({ source, inverse = false, compact = false }: { source: string; inverse?: boolean; compact?: boolean }) {
  const { t, lang } = useLang();
  return (
    <a href={whatsappUrl(source, lang)} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-12 items-center justify-center gap-2 px-5 font-label transition-colors ${compact ? "text-[11px]" : "text-[12px]"} ${inverse ? "bg-[hsl(var(--paper))] text-[hsl(var(--ink))] hover:bg-destructive hover:text-destructive-foreground" : "bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:bg-destructive hover:text-destructive-foreground"}`}>
      {t("Habla con un experto", "Talk to an expert")} <ArrowUpRight className="h-4 w-4" />
    </a>
  );
}
