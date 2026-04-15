import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { DayTasksWidget } from "@/components/dashboard/DayTasksWidget";
import { TimerLauncherWidget } from "@/components/dashboard/TimerLauncherWidget";
import { IdeasWidget } from "@/components/dashboard/IdeasWidget";
import { TeamWidget } from "@/components/dashboard/TeamWidget";
import { GapsWidget } from "@/components/dashboard/GapsWidget";
import { FinanceSummaryWidget } from "@/components/dashboard/FinanceSummaryWidget";
import { WelcomeChecklist } from "@/components/dashboard/WelcomeChecklist";
import { formatDuration } from "@/lib/timer-utils";
import { useHourlyRate } from "@/hooks/useHourlyRate";
import { Clock, Users, FileText, Receipt, TrendingUp, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

function DailyProgressBar() {
  const { user } = useAuth();
  const [minutesToday, setMinutesToday] = useState(0);
  const [availableMin, setAvailableMin] = useState(480); // default 8h

  useEffect(() => {
    if (!user) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    Promise.all([
      supabase
        .from("time_entries")
        .select("duration_min")
        .eq("user_id", user.id)
        .gte("started_at", todayStart.toISOString())
        .not("ended_at", "is", null),
      supabase
        .from("profiles")
        .select("work_start_hour, work_end_hour")
        .eq("id", user.id)
        .single(),
    ]).then(([entries, profile]) => {
      const total = (entries.data || []).reduce((s: number, e: any) => s + (Number(e.duration_min) || 0), 0);
      setMinutesToday(total);
      if (profile.data) {
        const diff = (profile.data.work_end_hour - profile.data.work_start_hour) * 60;
        if (diff > 0) setAvailableMin(diff);
      }
    });
  }, [user]);

  const pct = Math.min((minutesToday / availableMin) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <Progress value={pct} className="h-2 flex-1" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDuration(minutesToday)} de {formatDuration(availableMin)} hoy
      </span>
    </div>
  );
}

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

function MonthProgressWidget() {
  const { user } = useAuth();
  const { rates, economic, hasEconomicProfile } = useHourlyRate();
  const [monthIncome, setMonthIncome] = useState(0);
  const [monthHours, setMonthHours] = useState(0);

  useEffect(() => {
    if (!user || !hasEconomicProfile) return;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    Promise.all([
      supabase.from("payments").select("amount_received").gte("date_received", monthStart),
      supabase.from("time_entries").select("duration_min").eq("user_id", user.id).gte("started_at", monthStart).not("ended_at", "is", null),
    ]).then(([payments, entries]) => {
      setMonthIncome((payments.data || []).reduce((s: number, p: any) => s + Number(p.amount_received), 0));
      const mins = (entries.data || []).reduce((s: number, e: any) => s + (Number(e.duration_min) || 0), 0);
      setMonthHours(mins / 60);
    });
  }, [user, hasEconomicProfile]);

  if (!hasEconomicProfile || !economic) return null;

  const target = economic.income_target || 0;
  const pct = target > 0 ? Math.min((monthIncome / target) * 100, 100) : 0;
  const realRate = monthHours > 0 ? Math.round(monthIncome / monthHours) : null;
  const currency = economic.income_currency;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Progreso del mes</h3>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-foreground-secondary">
            ${monthIncome.toLocaleString()} de ${target.toLocaleString()} {currency}
          </span>
          <span className="font-medium text-foreground">{Math.round(pct)}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
      {realRate !== null && rates.rate_target && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-foreground-secondary">Valor hora real:</span>
          <span className={`font-bold ${realRate >= rates.rate_target ? "text-success" : "text-destructive"}`}>
            ${realRate.toLocaleString()}/hr
          </span>
          <span className="text-foreground-muted">vs ${rates.rate_target.toLocaleString()}/hr objetivo</span>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { isFree } = usePlan();
  const [ideaRefresh, setIdeaRefresh] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">{greeting} 👋</h1>
        <DailyProgressBar />
      </div>

      {/* Month economic progress */}
      <MonthProgressWidget />

      {/* Welcome checklist for new users */}
      <WelcomeChecklist />

      {/* Admin KPIs — only for paid plan admins */}
      {isAdmin && !isFree && <AdminKPIs />}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DayTasksWidget />
        <TimerLauncherWidget onIdea={() => setIdeaRefresh(r => r + 1)} />
      </div>

      {/* Secondary row */}
      <div className={`grid grid-cols-1 gap-4 ${isFree ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
        <IdeasWidget refreshTrigger={ideaRefresh} />
        <GapsWidget />
        {!isFree && <TeamWidget />}
      </div>

      {/* Admin-only: Finance summary */}
      {isAdmin && !isFree && <FinanceSummaryWidget />}
    </div>
  );
}
