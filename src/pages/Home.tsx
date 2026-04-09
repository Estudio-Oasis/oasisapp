import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useTimer } from "@/contexts/TimerContext";
import { supabase } from "@/integrations/supabase/client";
import { DayTasksWidget } from "@/components/dashboard/DayTasksWidget";
import { TimerLauncherWidget } from "@/components/dashboard/TimerLauncherWidget";
import { IdeasWidget } from "@/components/dashboard/IdeasWidget";
import { TeamWidget } from "@/components/dashboard/TeamWidget";
import { GapsWidget } from "@/components/dashboard/GapsWidget";
import { FinanceSummaryWidget } from "@/components/dashboard/FinanceSummaryWidget";
import { WidgetCard } from "@/components/ui/widget-card";
import { formatDuration } from "@/lib/timer-utils";
import { Clock, Users, FileText, Receipt, TrendingUp } from "lucide-react";

function AdminKPIs() {
  const [kpis, setKpis] = useState({ mrr: 0, teamHoursToday: 0, pendingQuotes: 0, overdueInvoices: 0 });

  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    Promise.all([
      supabase.from("payments").select("amount_received").gte("date_received", monthStart),
      supabase.from("time_entries").select("duration_min").gte("started_at", todayStart).not("ended_at", "is", null),
      supabase.from("quotes").select("id", { count: "exact", head: true }).eq("status", "sent"),
      supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "overdue"),
    ]).then(([payments, hours, quotes, invoices]) => {
      setKpis({
        mrr: (payments.data || []).reduce((s: number, p: any) => s + Number(p.amount_received), 0),
        teamHoursToday: (hours.data || []).reduce((s: number, e: any) => s + (Number(e.duration_min) || 0), 0),
        pendingQuotes: quotes.count || 0,
        overdueInvoices: invoices.count || 0,
      });
    });
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { icon: TrendingUp, label: "MRR este mes", value: `$${kpis.mrr.toLocaleString()}`, accent: "text-success" },
        { icon: Clock, label: "Horas equipo hoy", value: formatDuration(kpis.teamHoursToday), accent: "text-accent" },
        { icon: FileText, label: "Cotizaciones pendientes", value: String(kpis.pendingQuotes), accent: "text-foreground" },
        { icon: Receipt, label: "Facturas vencidas", value: String(kpis.overdueInvoices), accent: kpis.overdueInvoices > 0 ? "text-destructive" : "text-foreground" },
      ].map((kpi) => (
        <div key={kpi.label} className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <kpi.icon className={`h-4 w-4 ${kpi.accent}`} />
            <p className={`text-2xl font-bold tabular-nums ${kpi.accent}`}>{kpi.value}</p>
          </div>
          <p className="text-[10px] text-foreground-muted mt-1">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [ideaRefresh, setIdeaRefresh] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting} 👋</h1>
        <p className="text-[12px] text-foreground-muted mt-0.5">Tu centro de comando para hoy</p>
      </div>

      {/* Admin KPIs */}
      {isAdmin && <AdminKPIs />}

      {/* Main grid — mobile: stack, desktop: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DayTasksWidget />
        <TimerLauncherWidget onIdea={() => setIdeaRefresh(r => r + 1)} />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <IdeasWidget refreshTrigger={ideaRefresh} />
        <GapsWidget />
        <TeamWidget />
      </div>

      {/* Admin-only: Finance summary */}
      {isAdmin && <FinanceSummaryWidget />}
    </div>
  );
}
