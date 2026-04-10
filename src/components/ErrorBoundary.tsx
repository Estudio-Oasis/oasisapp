import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
              O
            </div>
            <span className="text-lg font-bold tracking-tight">OasisOS</span>
          </div>
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold text-foreground">Algo salió mal</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()} variant="outline">
              Recargar página
            </Button>
            <Button onClick={() => (window.location.href = "/home")}>
              Volver al inicio
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 text-left text-xs text-destructive bg-destructive/5 rounded-lg p-4 max-w-lg overflow-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
