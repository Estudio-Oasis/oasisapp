import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { loading: planLoading } = usePlan();

  if (loading || planLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Guard for pro-only routes. Redirects free users to /bitacora.
 */
export function ProRoute({ children }: { children: React.ReactNode }) {
  const { isPro, loading } = usePlan();
  const { session, loading: authLoading } = useAuth();

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isPro) {
    return <Navigate to="/bitacora" replace />;
  }

  return <>{children}</>;
}
