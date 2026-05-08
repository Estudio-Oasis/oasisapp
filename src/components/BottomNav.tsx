import { Timer, Users, Home, MoreHorizontal, Radio } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { usePlan } from "@/hooks/usePlan";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

interface NavItem {
  titleKey: TranslationKey;
  fallback: string;
  url: string;
  icon: any;
  paidOnly?: boolean;
  freeOnly?: boolean;
}

const allNavItems: NavItem[] = [
  { titleKey: "nav.home" as TranslationKey, fallback: "Inicio", url: "/home", icon: Home },
  { titleKey: "nav.bitacora" as TranslationKey, fallback: "Bitácora", url: "/bitacora", icon: Timer },
  { titleKey: "nav.hub" as TranslationKey, fallback: "Hub", url: "/hub", icon: Radio, paidOnly: true },
  { titleKey: "nav.more" as TranslationKey, fallback: "Más", url: "/mas", icon: MoreHorizontal },
];

export function BottomNav() {
  const location = useLocation();
  const { isFree } = usePlan();
  const { t } = useLanguage();

  const navItems = allNavItems.filter((item) => {
    if (item.paidOnly && isFree) return false;
    if (item.freeOnly && !isFree) return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden safe-area-bottom">
      <div className="flex h-[56px] items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
          const label = (() => {
            try { const v = t(item.titleKey); return v && v !== item.titleKey ? v : item.fallback; } catch { return item.fallback; }
          })();
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? "text-foreground" : "text-foreground-muted"
              }`}
            >
              <item.icon className="h-[20px] w-[20px]" strokeWidth={isActive ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
