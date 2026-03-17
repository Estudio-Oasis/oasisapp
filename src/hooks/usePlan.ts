import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PlanType = "free" | "pro";

export function usePlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan(null);
      setLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setPlan((data?.plan as PlanType) ?? "free");
        setLoading(false);
      });
  }, [user?.id]);

  return {
    plan,
    isFree: plan === "free",
    isPro: plan === "pro",
    loading,
  };
}
