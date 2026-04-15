import { Outlet, Link } from "react-router-dom";
import { Settings, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function BitacoraLayout() {
  const { user } = useAuth();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name").eq("id", user.id).single().then(({ data }) => {
      if (data?.name) setName(data.name);
    });
  }, [user?.id]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Compact header */}
      <header className="flex h-11 items-center justify-between px-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground">
              <span className="text-[8px] font-bold tracking-widest text-background">O</span>
            </div>
            <span className="text-sm font-semibold text-foreground">OasisOS</span>
          </Link>
          {name && (
            <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">· {name}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/home"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
          <Link
            to="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
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
