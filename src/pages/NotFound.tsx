import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404: User attempted to access:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8 bg-background">
      <div className="flex items-center gap-2 mb-8">
        <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
          O
        </div>
        <span className="text-lg font-bold tracking-tight">OasisOS</span>
      </div>
      <p className="text-6xl font-bold text-muted-foreground/30">404</p>
      <h2 className="text-xl font-semibold text-foreground">Esta página no existe</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        La URL que buscas no se encontró. Puede que haya sido movida o eliminada.
      </p>
      <Button asChild>
        <Link to="/home">Volver al inicio</Link>
      </Button>
    </div>
  );
}
