import { ArrowUpRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { whatsappUrl } from "@/lib/contact";

export function AnnouncementBar() {
  const { t, lang } = useLang();
  return (
    <a href={whatsappUrl(t("próximamente", "coming-soon"), lang)} target="_blank" rel="noopener noreferrer" className="flex min-h-9 items-center justify-center gap-2 border-b border-[hsl(var(--paper)/0.18)] bg-[hsl(var(--ink))] px-3 py-2 text-center text-[hsl(var(--paper))]">
      <span className="font-label text-[10px]">{t("Próximamente", "Coming soon")}</span>
      <span className="hidden sm:inline text-[12px] text-[hsl(var(--paper)/0.66)]">{t("Una nueva forma de operar growth.", "A new way to operate growth.")}</span>
      <span className="text-[12px] underline underline-offset-2">{t("Acceso anticipado", "Early access")}</span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
}
