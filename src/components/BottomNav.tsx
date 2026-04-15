import { Timer, Users, DollarSign, Shield, Home, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { usePlan } from "@/hooks/usePlan";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const allNavItems = [
  { titleKey: "nav.home" as TranslationKey, url: "/home", icon: Home },
  { titleKey: "nav.bitacora" as TranslationKey, url: "/bitacora", icon: Timer },
  { titleKey: "nav.clients" as TranslationKey, url: "/clients", icon: Users, paidOnly: true },
  { titleKey: "nav.vault" as TranslationKey, url: "/vault", icon: Shield, paidOnly: true },
  { titleKey: "nav.finances" as TranslationKey, url: "/finances", icon: DollarSign, adminOnly: true, paidOnly: true },
  { titleKey: "nav.settings" as TranslationKey, url: "/settings", icon: Settings, freeOnly: true },
];

export function BottomNav() {
  const location = useLocation();
  const { isAdmin } = useRole();
  const { isFree } = usePlan();
  const { t } = useLanguage();

  const navItems = allNavItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.paidOnly && isFree) return false;
    if (item.freeOnly && !isFree) return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm md:hidden safe-area-bottom">
      <div className="flex h-[48px] items-center justify-around px-8">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
          return (
            <Link
              key={item.titleKey}
              to={item.url}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-5 transition-colors ${
                isActive ? "text-accent" : "text-foreground-muted"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium leading-none">{t(item.titleKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
