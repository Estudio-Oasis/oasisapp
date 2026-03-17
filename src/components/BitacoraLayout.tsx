import { Outlet, Link } from "react-router-dom";
import { Settings } from "lucide-react";

/**
 * Minimal layout for free-plan users.
 * No sidebar, no bottom nav with clients/finances — just Bitácora focused.
 */
export function BitacoraLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Compact header */}
      <header className="flex h-11 items-center justify-between px-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground">
            <span className="text-[8px] font-bold tracking-widest text-background">B</span>
          </div>
          <span className="text-sm font-semibold text-foreground">Bitácora</span>
        </div>
        <Link
          to="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="px-3 py-2 md:px-8 md:py-6 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
