import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard } from "@/components/OnboardingWizard";

/**
 * Standalone onboarding page for new users without an agency.
 * If user already has an agency, redirect to /home.
 */
export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login", { replace: true }); return; }

    supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.agency_id) {
          navigate("/home", { replace: true });
        } else {
          setChecking(false);
        }
      });
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <OnboardingWizard
      open={true}
      userName={displayName}
      onComplete={() => navigate("/home?welcome=true", { replace: true })}
      onSkip={() => navigate("/home", { replace: true })}
    />
  );
}
