import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EconomicProfile {
  income_target: number | null;
  income_minimum: number | null;
  income_currency: string;
  available_hours_per_week: number | null;
  work_days: string[];
  profile_type: string | null;
}

export interface HourlyRates {
  rate_minimum: number | null;
  rate_target: number | null;
  rate_premium: number | null;
}

function calcRates(profile: EconomicProfile): HourlyRates {
  const hrs = profile.available_hours_per_week;
  if (!hrs || hrs <= 0) return { rate_minimum: null, rate_target: null, rate_premium: null };
  const monthlyHours = hrs * 4.33;
  return {
    rate_minimum: profile.income_minimum ? Math.round((profile.income_minimum / monthlyHours) * 100) / 100 : null,
    rate_target: profile.income_target ? Math.round((profile.income_target / monthlyHours) * 100) / 100 : null,
    rate_premium: profile.income_target ? Math.round(((profile.income_target * 1.3) / monthlyHours) * 100) / 100 : null,
  };
}

export function useHourlyRate() {
  const { user } = useAuth();
  const [economic, setEconomic] = useState<EconomicProfile | null>(null);
  const [rates, setRates] = useState<HourlyRates>({ rate_minimum: null, rate_target: null, rate_premium: null });
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("income_target, income_minimum, income_currency, available_hours_per_week, work_days, profile_type")
      .eq("id", user.id)
      .single();

    if (data) {
      const ep: EconomicProfile = {
        income_target: data.income_target as number | null,
        income_minimum: data.income_minimum as number | null,
        income_currency: (data.income_currency as string) || "MXN",
        available_hours_per_week: data.available_hours_per_week as number | null,
        work_days: (data.work_days as string[]) || ["mon", "tue", "wed", "thu", "fri"],
        profile_type: data.profile_type as string | null,
      };
      setEconomic(ep);
      setRates(calcRates(ep));
    }
    setLoading(false);
  };

  useEffect(() => { refetch(); }, [user]);

  const hasEconomicProfile = !!(economic?.income_target && economic?.available_hours_per_week);

  return { economic, rates, loading, hasEconomicProfile, refetch };
}
