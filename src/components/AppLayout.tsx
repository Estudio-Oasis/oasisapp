import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { TimerFAB } from "@/components/TimerFAB";
import { HelpFAB } from "@/components/HelpFAB";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Radio, Settings } from "lucide-react";
import { useUnreadChats } from "@/hooks/useUnreadChats";

export function AppLayout() {
  const location = useLocation();
  const { unreadCount } = useUnreadChats();

  const isBitacora = location.pathname === "/bitacora";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header — compact identity bar */}
          <header className="flex h-11 items-center justify-between px-4 md:hidden">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-foreground">
                <span className="text-[7px] font-bold tracking-widest text-background">B</span>
              </div>
              <span className="text-sm font-semibold text-foreground">Bitácora</span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/hub"
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground transition-colors"
              >
                <Radio className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-accent text-[8px] font-bold text-accent-foreground px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
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
          <main className="flex-1 pb-[52px] md:pb-0">
            <div className="px-3 py-2 md:px-8 md:py-6 lg:px-10">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />
        {!isBitacora && <TimerFAB />}
        <HelpFAB />
      </div>
    </SidebarProvider>
  );
}
