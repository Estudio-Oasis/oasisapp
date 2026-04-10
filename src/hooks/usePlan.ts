import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PlanType = "free" | "pro" | "agency";

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
      .select("plan, agency_id")
      .eq("id", user.id)
      .single()
      .then(async ({ data }) => {
        // Try to read plan from agency first, fall back to profile
        if (data?.agency_id) {
          const { data: agency } = await supabase
            .from("agencies")
            .select("plan")
            .eq("id", data.agency_id)
            .single();
          const agencyPlan = (agency as any)?.plan as string | undefined;
          if (agencyPlan && agencyPlan !== "free") {
            setPlan(agencyPlan as PlanType);
            setLoading(false);
            return;
          }
        }
        // Fall back to profile plan
        setPlan((data?.plan as PlanType) ?? "free");
        setLoading(false);
      });
  }, [user?.id]);

  return {
    plan,
    isFree: plan === "free",
    isPro: plan === "pro" || plan === "agency",
    isAgency: plan === "agency",
    maxMembers: plan === "agency" ? 10 : plan === "pro" ? 6 : 1,
    historyDays: plan === "free" ? 14 : Infinity,
    loading,
  };
}
