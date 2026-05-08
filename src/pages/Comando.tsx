import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Radar, Zap, AlertTriangle, AlertCircle, Info, MessageCircle, MoreHorizontal, ArrowRight, Clock } from "lucide-react";
import { useOperationalData, useAttentionSignals, snoozeSignal, type AttentionSignal } from "@/hooks/useAttentionSignals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ComandoPage() {
  const { data, loading } = useOperationalData();
  const signals = useAttentionSignals(data);
  const isMobile = useIsMobile();

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-foreground-muted text-sm">Cargando vista de comando…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Header signals={signals} data={data} />
      <PulseStrip data={data} />
      <AttentionQueue signals={signals} mobile={isMobile} />

      <div className={cn("grid gap-6", isMobile ? "" : "grid-cols-3")}>
        <div className={cn(isMobile ? "" : "col-span-2")}>
          <ClientHeatmap data={data} />
        </div>
        <div>
          <MoneyPipeline data={data} />
        </div>
      </div>

      {!isMobile && <DayStrip data={data} />}
      {!isMobile && <TeamSignalList data={data} signals={signals} />}
    </div>
  );
}

function Header({ signals, data }: { signals: AttentionSignal[]; data: any }) {
  const risks = signals.filter((s) => s.severity === "risk").length;
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-bold tracking-tight">Comando</h1>
        </div>
        <p className="text-sm text-foreground-muted mt-1">
          Operación de toda la organización · {data.agencies.length} {data.agencies.length === 1 ? "agencia" : "agencias"}
        </p>
      </div>
      {risks > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs font-semibold text-destructive">{risks} riesgo{risks > 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}

function PulseStrip({ data }: { data: any }) {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const todayEntries = data.timeEntries.filter((t: any) => new Date(t.started_at).getTime() >= todayMs);
    const totalMin = todayEntries.reduce((acc: number, t: any) => acc + (Number(t.duration_min) || 0), 0);
    const billableMin = todayEntries.filter((t: any) => t.client_id).reduce((acc: number, t: any) => acc + (Number(t.duration_min) || 0), 0);
    const activeNow = data.timeEntries.filter((t: any) => !t.ended_at).length;
    const totalPeople = data.profiles.filter((p: any) => p.agency_id).length;

    // 7d sparkline data
    const days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 86_400_000;
      const sum = data.timeEntries
        .filter((t: any) => {
          const ts = new Date(t.started_at).getTime();
          return ts >= start && ts < end;
        })
        .reduce((acc: number, t: any) => acc + (Number(t.duration_min) || 0), 0);
      days.push(sum / 60);
    }

    return {
      totalPeople,
      activeNow,
      todayHours: totalMin / 60,
      billablePct: totalMin > 0 ? Math.round((billableMin / totalMin) * 100) : 0,
      sparkline: days,
    };
  }, [data]);

  const max = Math.max(...stats.sparkline, 1);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 rounded-2xl border border-border/60 bg-card">
      <Stat label="personas" value={String(stats.totalPeople)} />
      <Divider />
      <Stat label="activas ahora" value={String(stats.activeNow)} accent={stats.activeNow > 0 ? "amber" : "default"} />
      <Divider />
      <Stat label="horas hoy" value={stats.todayHours.toFixed(1)} />
      <Divider />
      <Stat label="facturable" value={`${stats.billablePct}%`} accent={stats.billablePct >= 70 ? "green" : "default"} />
      <div className="ml-auto flex items-end gap-0.5 h-8">
        {stats.sparkline.map((h, i) => (
          <div
            key={i}
            className="w-2 rounded-sm bg-accent/60"
            style={{ height: `${Math.max(8, (h / max) * 32)}px` }}
            title={`${h.toFixed(1)}h`}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "default" }: { label: string; value: string; accent?: "default" | "amber" | "green" }) {
  const colors = { default: "text-foreground", amber: "text-accent", green: "text-success" };
  return (
    <div className="flex flex-col">
      <span className={cn("text-xl font-bold tabular-nums leading-none", colors[accent])}>{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-foreground-muted mt-1">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-border/60" />;
}

function AttentionQueue({ signals, mobile }: { signals: AttentionSignal[]; mobile: boolean }) {
  if (signals.length === 0) {
    return (
      <div className="rounded-2xl border border-success/20 bg-success/5 p-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-3">
          <Zap className="h-6 w-6 text-success" />
        </div>
        <p className="text-base font-semibold text-foreground">Todo bajo control</p>
        <p className="text-sm text-foreground-muted mt-1">Sin alertas operativas en este momento.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <Zap className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Atención</h2>
        <span className="text-xs text-foreground-muted">· {signals.length}</span>
      </div>
      <div
        className={cn(
          mobile
            ? "flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-3 px-3 pb-2"
            : "grid gap-2"
        )}
      >
        {signals.slice(0, 8).map((s) => (
          <AttentionCard key={s.id} signal={s} mobile={mobile} />
        ))}
      </div>
    </div>
  );
}

function AttentionCard({ signal, mobile }: { signal: AttentionSignal; mobile: boolean }) {
  const navigate = useNavigate();
  const sevStyle = {
    risk: "border-destructive/30 bg-destructive/5",
    warn: "border-accent/30 bg-accent/5",
    info: "border-border/60 bg-card",
  }[signal.severity];

  const SevIcon = signal.severity === "risk" ? AlertTriangle : signal.severity === "warn" ? AlertCircle : Info;
  const sevColor = {
    risk: "text-destructive",
    warn: "text-accent",
    info: "text-foreground-muted",
  }[signal.severity];

  const handleAction = (action: AttentionSignal["actions"][number]) => {
    if (action.kind === "snooze") snoozeSignal(signal.id);
    else if (action.kind === "view" && action.target) navigate(action.target);
    else if (action.kind === "message" && action.target) navigate(`/hub?with=${action.target}`);
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        sevStyle,
        mobile && "min-w-[85%] snap-start"
      )}
    >
      <div className="flex items-start gap-3">
        <SevIcon className={cn("h-4 w-4 mt-0.5 shrink-0", sevColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">{signal.title}</p>
          <p className="text-xs text-foreground-muted mt-1">{signal.why}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {signal.actions.map((a, i) => (
              <Button
                key={i}
                size="sm"
                variant={i === 0 ? "ghost" : "outline"}
                className="h-7 text-xs"
                onClick={() => handleAction(a)}
              >
                {a.kind === "message" && <MessageCircle className="h-3 w-3 mr-1" />}
                {a.kind === "view" && <ArrowRight className="h-3 w-3 mr-1" />}
                {a.kind === "snooze" && <Clock className="h-3 w-3 mr-1" />}
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientHeatmap({ data }: { data: any }) {
  const navigate = useNavigate();
  const rows = useMemo(() => {
    const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const hoursByClient = new Map<string, number>();
    for (const te of data.timeEntries) {
      if (!te.client_id || !te.duration_min) continue;
      if (new Date(te.started_at).getTime() < weekStart) continue;
      hoursByClient.set(te.client_id, (hoursByClient.get(te.client_id) || 0) + Number(te.duration_min) / 60);
    }
    return data.clients
      .filter((c: any) => c.status === "active")
      .map((c: any) => {
        const hours = hoursByClient.get(c.id) || 0;
        const budget = c.monthly_rate ? Number(c.monthly_rate) / 4.33 / 50 : 0;
        const ratio = budget > 0 ? hours / budget : 0;
        return { ...c, hours, budget, ratio };
      })
      .sort((a: any, b: any) => b.ratio - a.ratio || b.hours - a.hours)
      .slice(0, 10);
  }, [data]);

  if (rows.length === 0) {
    return (
      <Section title="Calor por cliente">
        <p className="text-sm text-foreground-muted text-center py-6">Sin clientes activos.</p>
      </Section>
    );
  }

  return (
    <Section title="Calor por cliente" subtitle="últimos 7 días">
      <div className="space-y-2">
        {rows.map((r: any) => {
          const status = r.budget === 0 ? "neutral" : r.ratio > 1.1 ? "risk" : r.ratio > 0.9 ? "warn" : "ok";
          const barColor = {
            ok: "bg-success",
            warn: "bg-accent",
            risk: "bg-destructive",
            neutral: "bg-foreground-muted/40",
          }[status];
          const pct = r.budget > 0 ? Math.min(100, (r.hours / r.budget) * 100) : 0;
          return (
            <button
              key={r.id}
              onClick={() => navigate(`/clients/${r.id}`)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background-tertiary transition-colors text-left"
            >
              <span className="text-sm font-medium text-foreground flex-1 truncate">{r.name}</span>
              <span className="text-xs tabular-nums text-foreground-muted w-24 text-right">
                {r.hours.toFixed(1)}h{r.budget > 0 ? ` / ${r.budget.toFixed(1)}h` : ""}
              </span>
              <div className="w-32 h-1.5 rounded-full bg-background-tertiary overflow-hidden">
                <div className={cn("h-full transition-all", barColor)} style={{ width: `${pct}%` }} />
              </div>
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums w-12 text-right",
                  status === "risk" && "text-destructive",
                  status === "warn" && "text-accent",
                  status === "ok" && "text-success",
                  status === "neutral" && "text-foreground-muted"
                )}
              >
                {r.budget > 0 ? `${(r.ratio - 1) >= 0 ? "+" : ""}${Math.round((r.ratio - 1) * 100)}%` : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

function MoneyPipeline({ data }: { data: any }) {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const overdue = data.invoices.filter((i: any) => i.status !== "paid" && i.due_date && i.due_date < today);
  const overdueTotal = overdue.reduce((acc: number, i: any) => acc + Number(i.amount), 0);
  const pendingQuotes = data.quotes.filter((q: any) => q.status === "sent");
  const pendingTotal = pendingQuotes.reduce((acc: number, q: any) => acc + Number(q.total_amount), 0);

  const fmt = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <Section title="Pipeline & dinero">
      <div className="space-y-3">
        <button onClick={() => navigate("/finances")} className="w-full text-left p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
          <p className="text-[10px] uppercase tracking-wider text-destructive font-semibold">Facturas vencidas</p>
          <p className="text-xl font-bold tabular-nums mt-1">{fmt(overdueTotal)}</p>
          <p className="text-xs text-foreground-muted">{overdue.length} {overdue.length === 1 ? "factura" : "facturas"}</p>
        </button>
        <button onClick={() => navigate("/quotes")} className="w-full text-left p-3 rounded-lg border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors">
          <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">Cotizaciones enviadas</p>
          <p className="text-xl font-bold tabular-nums mt-1">{fmt(pendingTotal)}</p>
          <p className="text-xs text-foreground-muted">{pendingQuotes.length} pendientes</p>
        </button>
      </div>
    </Section>
  );
}

function DayStrip({ data }: { data: any }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const dayEnd = todayMs + 86_400_000;

  const profiles = data.profiles.filter((p: any) => p.agency_id);
  const startHour = 7;
  const endHour = 21;
  const span = endHour - startHour;

  return (
    <Section title="Tira del día" subtitle={`${startHour}:00 — ${endHour}:00`}>
      <div className="space-y-1.5">
        {profiles.map((p: any) => {
          const entries = data.timeEntries.filter((t: any) => t.user_id === p.id && new Date(t.started_at).getTime() >= todayMs && new Date(t.started_at).getTime() < dayEnd);
          return (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-xs font-medium text-foreground w-24 truncate">{p.name || "—"}</span>
              <div className="flex-1 relative h-5 rounded bg-background-tertiary overflow-hidden">
                {entries.map((e: any) => {
                  const start = new Date(e.started_at);
                  const end = e.ended_at ? new Date(e.ended_at) : new Date();
                  const startH = start.getHours() + start.getMinutes() / 60;
                  const endH = end.getHours() + end.getMinutes() / 60;
                  const left = Math.max(0, ((startH - startHour) / span) * 100);
                  const width = Math.max(0.5, ((endH - startH) / span) * 100);
                  if (left > 100) return null;
                  return (
                    <div
                      key={e.id}
                      className={cn("absolute top-0 h-full rounded-sm", e.client_id ? "bg-accent/60" : "bg-foreground-muted/40")}
                      style={{ left: `${left}%`, width: `${Math.min(100 - left, width)}%` }}
                      title={e.description || "Actividad"}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function TeamSignalList({ data, signals }: { data: any; signals: AttentionSignal[] }) {
  const flagged = new Set(
    signals
      .filter((s) => s.category === "person")
      .map((s) => {
        const m = s.id.match(/^fatigue-(.+)$/);
        if (m) {
          const te = data.timeEntries.find((t: any) => t.id === m[1]);
          return te?.user_id;
        }
        return null;
      })
      .filter(Boolean)
  );

  const profiles = data.profiles.filter((p: any) => p.agency_id);
  const presenceByUser = new Map(data.presence.map((p: any) => [p.user_id, p]));

  const sorted = [...profiles].sort((a, b) => {
    const aFlag = flagged.has(a.id) ? 0 : 1;
    const bFlag = flagged.has(b.id) ? 0 : 1;
    if (aFlag !== bFlag) return aFlag - bFlag;
    const aActive = data.timeEntries.some((t: any) => t.user_id === a.id && !t.ended_at) ? 0 : 1;
    const bActive = data.timeEntries.some((t: any) => t.user_id === b.id && !t.ended_at) ? 0 : 1;
    return aActive - bActive;
  });

  return (
    <Section title="Equipo" subtitle="ordenado por señal">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {sorted.map((p: any) => {
          const presence = presenceByUser.get(p.id) as any;
          const active = data.timeEntries.find((t: any) => t.user_id === p.id && !t.ended_at);
          const isFlagged = flagged.has(p.id);
          return (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                isFlagged ? "border-destructive/30 bg-destructive/5" : "border-border/60 bg-card"
              )}
            >
              <div className="h-8 w-8 rounded-full bg-background-tertiary flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
                {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : (p.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-success" : presence?.status === "online" ? "bg-success/50" : "bg-foreground-muted/40")} />
                  <p className="text-sm font-medium truncate">{p.name || "—"}</p>
                </div>
                <p className="text-[11px] text-foreground-muted truncate">
                  {active?.description || presence?.current_task || p.job_title || "Sin actividad"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-baseline gap-2 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
        {subtitle && <span className="text-[10px] text-foreground-muted">· {subtitle}</span>}
      </div>
      {children}
    </div>
  );
}
