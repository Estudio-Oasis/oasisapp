import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <main className="flex-1 pb-16 md:pb-0">
          <div className="mx-auto px-6 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
