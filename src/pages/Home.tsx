import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { DayTasksWidget } from "@/components/dashboard/DayTasksWidget";
import { TimerLauncherWidget } from "@/components/dashboard/TimerLauncherWidget";
import { IdeasWidget } from "@/components/dashboard/IdeasWidget";
import { TeamWidget } from "@/components/dashboard/TeamWidget";
import { ShortcutsWidget } from "@/components/dashboard/ShortcutsWidget";
import { FinanceSummaryWidget } from "@/components/dashboard/FinanceSummaryWidget";
import { GapsWidget } from "@/components/dashboard/GapsWidget";

export default function HomePage() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [ideaRefresh, setIdeaRefresh] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting} 👋</h1>
        <p className="text-sm text-foreground-secondary mt-0.5">Tu centro de comando para hoy</p>
      </div>

      {/* Main grid — mobile: stack, desktop: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column: Tasks */}
        <DayTasksWidget />

        {/* Right column: Timer Launcher */}
        <TimerLauncherWidget onIdea={() => setIdeaRefresh(r => r + 1)} />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Ideas */}
        <IdeasWidget refreshTrigger={ideaRefresh} />

        {/* Gaps reminder */}
        <GapsWidget />

        {/* Team */}
        <TeamWidget />
      </div>

      {/* Shortcuts */}
      <ShortcutsWidget />

      {/* Admin-only: Finance summary */}
      {isAdmin && <FinanceSummaryWidget />}
    </div>
  );
}
