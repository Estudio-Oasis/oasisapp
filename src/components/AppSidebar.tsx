import { Timer, Users, CheckSquare, DollarSign, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { TimerWidget } from "@/components/TimerWidget";
import { NotificationBell } from "@/components/NotificationBell";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Timer", url: "/timer", icon: Timer },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Finances", url: "/finances", icon: DollarSign },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar w-[220px]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
          <span className="text-micro text-background leading-none tracking-widest">OS</span>
        </div>
        <span className="text-sm font-semibold text-foreground">OasisOS</span>
      </div>

      {/* Navigation */}
      <SidebarContent className="px-3 mt-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`relative flex h-9 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent-light text-foreground font-semibold"
                    : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-accent" />
                )}
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      {/* Notification bell */}
      <div className="mt-2">
        <NotificationBell />
      </div>

      {/* Timer widget */}
      <TimerWidget />

      {/* User section */}
      <SidebarFooter className="px-3 pb-4">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background-tertiary text-xs font-semibold text-foreground-secondary">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
            <button
              onClick={signOut}
              className="text-xs text-foreground-muted hover:text-foreground text-left transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
