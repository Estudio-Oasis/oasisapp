import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, user, loading } = useAuth();
  const { loading: planLoading } = usePlan();
  const [agencyCheck, setAgencyCheck] = useState<"loading" | "has_agency" | "no_agency">("loading");

  useEffect(() => {
    if (loading || !user) return;
    supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setAgencyCheck(data?.agency_id ? "has_agency" : "no_agency");
      });
  }, [user, loading]);

  if (loading || planLoading || agencyCheck === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (agencyCheck === "no_agency") {
    return <Navigate to="/onboarding" replace />;
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
