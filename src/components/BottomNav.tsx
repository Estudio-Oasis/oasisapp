import { Timer, Users, CheckSquare, DollarSign } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { title: "Timer", url: "/timer", icon: Timer },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Finances", url: "/finances", icon: DollarSign },
];

export function BottomNav() {
  const location = useLocation();

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
                isActive ? "text-foreground" : "text-foreground-muted"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-micro">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
