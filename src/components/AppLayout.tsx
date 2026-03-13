import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { Outlet, useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/timer": "Timer",
  "/clients": "Clientes",
  "/tasks": "Tareas",
  "/finances": "Finanzas",
  "/settings": "Ajustes",
};

export function AppLayout() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="flex h-14 items-center px-6 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <span className="text-[11px] font-bold tracking-widest text-background">OS</span>
            </div>
            <span className="mx-auto text-sm font-semibold text-foreground">{pageTitle}</span>
            <div className="w-7" /> {/* Spacer for centering */}
          </header>

          {/* Main content */}
          <main className="flex-1 pb-[60px] md:pb-0">
            <div className="px-6 py-6 md:px-8 md:py-8 lg:px-10">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
