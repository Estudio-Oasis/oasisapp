import { Timer, Users, CheckSquare, DollarSign, Settings, Radio } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { useUnreadChats } from "@/hooks/useUnreadChats";

const allNavItems = [
  { title: "Timer", url: "/timer", icon: Timer },
  { title: "Hub", url: "/hub", icon: Radio },
  { title: "Clientes", url: "/clients", icon: Users },
  { title: "Tareas", url: "/tasks", icon: CheckSquare },
  { title: "Finanzas", url: "/finances", icon: DollarSign, adminOnly: true },
  { title: "Ajustes", url: "/settings", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();
  const { isAdmin } = useRole();
  const { unreadCount } = useUnreadChats();

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex h-[60px] items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
          return (
            <Link
              key={item.title}
              to={item.url}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-md transition-colors ${
                isActive ? "text-accent" : "text-foreground-muted"
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.url === "/hub" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground px-0.5">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-micro">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
