import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { planByProductId } from "@/lib/stripe-plans";

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  planName: string | null;
}

export function useSubscription() {
  const { session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    loading: true,
    planName: null,
  });

  const check = useCallback(async () => {
    if (!session) {
      setState((s) => ({ ...s, loading: false, subscribed: false }));
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      const plan = data?.product_id ? planByProductId(data.product_id) : null;
      setState({
        subscribed: data?.subscribed ?? false,
        productId: data?.product_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        loading: false,
        planName: plan?.name ?? null,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [session]);

  useEffect(() => {
    check();
  }, [check]);

  const openCheckout = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  return { ...state, refresh: check, openCheckout, openPortal };
}
