import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { TimerFAB } from "@/components/TimerFAB";
import { NotificationBell } from "@/components/NotificationBell";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Radio, Settings } from "lucide-react";
import { useUnreadChats } from "@/hooks/useUnreadChats";

const pageTitles: Record<string, string> = {
  "/bitacora": "Bitácora",
  "/hub": "Hub",
  "/clients": "Clientes",
  "/tasks": "Tareas",
  "/finances": "Finanzas",
  "/settings": "Ajustes",
};

export function AppLayout() {
  const location = useLocation();
  const { unreadCount } = useUnreadChats();

  // Find matching page title (supports nested routes)
  const pageTitle = pageTitles[location.pathname] ||
    Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path + "/"))?.[1] ||
    "";

  // Hide FAB on /bitacora since the page has its own launcher
  const isBitacora = location.pathname === "/bitacora";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="flex h-14 items-center justify-between px-4 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <span className="text-[11px] font-bold tracking-widest text-background">OS</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{pageTitle}</span>
            <div className="flex items-center gap-1">
              <Link
                to="/hub"
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground transition-colors"
              >
                <Radio className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-accent" />
                )}
              </Link>
              <Link
                to="/settings"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 pb-[60px] md:pb-0">
            <div className="px-4 py-4 md:px-8 md:py-8 lg:px-10">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />
        {!isBitacora && <TimerFAB />}
      </div>
    </SidebarProvider>
  );
}
