import { Timer, Users, DollarSign } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useRole } from "@/hooks/useRole";

const coreNavItems = [
  { title: "Bitácora", url: "/bitacora", icon: Timer },
  { title: "Clientes", url: "/clients", icon: Users },
  { title: "Finanzas", url: "/finances", icon: DollarSign, adminOnly: true },
];

export function BottomNav() {
  const location = useLocation();
  const { isAdmin } = useRole();

  const navItems = coreNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm md:hidden safe-area-bottom">
      <div className="flex h-[48px] items-center justify-around px-8">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
          return (
            <Link
              key={item.title}
              to={item.url}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-5 transition-colors ${
                isActive ? "text-accent" : "text-foreground-muted"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium leading-none">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
