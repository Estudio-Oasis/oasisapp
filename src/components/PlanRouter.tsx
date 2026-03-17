import { Outlet } from "react-router-dom";
import { usePlan } from "@/hooks/usePlan";
import { AppLayout } from "@/components/AppLayout";
import { BitacoraLayout } from "@/components/BitacoraLayout";

/**
 * Renders the correct layout based on the user's plan.
 * Free → BitacoraLayout (minimal, focused)
 * Pro  → AppLayout (full OasisOS with sidebar)
 */
export function PlanRouter() {
  const { isPro } = usePlan();

  if (isPro) {
    return <AppLayout />;
  }

  return <BitacoraLayout />;
}
