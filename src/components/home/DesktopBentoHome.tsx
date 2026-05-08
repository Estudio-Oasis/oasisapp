import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { useRole } from "@/hooks/useRole";
import { usePlan } from "@/hooks/usePlan";
import { useHourlyRate } from "@/hooks/useHourlyRate";
import { supabase } from "@/integrations/supabase/client";
import { formatDuration, formatElapsedShort } from "@/lib/timer-utils";
import { DayTasksWidget } from "@/components/dashboard/DayTasksWidget";
import { IdeasWidget } from "@/components/dashboard/IdeasWidget";
import { GapsWidget } from "@/components/dashboard/GapsWidget";
import { WelcomeChecklist } from "@/components/dashboard/WelcomeChecklist";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickSheet } from "@/components/timer/QuickSheet";
import { cn } from "@/lib/utils";
import {
  Radar, ArrowRight, Clock, Target, Users as UsersIcon,
  Command, Pause, Play, Zap, HelpCircle,
} from "lucide-react";

interface DayBlock { start: number; end: number; billable: boolean; clientName: string | null; durMin: number }
interface ActiveMember { id: string; name: string; clientName: string | null }

function useHomeData() {
  const { user } = useAuth();
  const [data, setData] = useState({
    minutesToday: 0,
    billableMin: 0,
    blocks: [] as DayBlock[],
    teamActive: 0,
    topMembers: [] as ActiveMember[],
    monthIncome: 0,
    topClients: [] as { name: string; min: number }[],
    gapMin: 0,
    gapStart: null as string | null,
    gapEnd: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [entries, presence, payments] = await Promise.all([
      supabase.from("time_entries")
        .select("started_at, ended_at, duration_min, client_id, clients(name, monthly_rate)")
        .eq("user_id", user.id).gte("started_at", todayStart.toISOString()).order("started_at"),
      supabase.from("member_presence")
        .select("user_id, status, last_seen_at, current_task, current_client"),
      supabase.from("payments").select("amount_received").gte("date_received", monthStart),
    ]);

    const list = entries.data || [];
    let totalMin = 0, billableMin = 0;
    const blocks: DayBlock[] = [];
    const byClient = new Map<string, number>();
    list.forEach((e: any) => {
      let dur: number;
      if (e.duration_min != null) dur = Number(e.duration_min);
      else if (e.ended_at) dur = (new Date(e.ended_at).getTime() - new Date(e.started_at).getTime()) / 60000;
      else {
        const sStart = Math.max(new Date(e.started_at).getTime(), todayStart.getTime());
        dur = Math.min((Date.now() - sStart) / 60000, 12 * 60);
      }
      if (!isFinite(dur) || dur < 0) dur = 0;
      totalMin += dur;
      const billable = Number(e?.clients?.monthly_rate || 0) > 0;
      if (billable) billableMin += dur;
      const cname = e?.clients?.name || null;
      if (cname) byClient.set(cname, (byClient.get(cname) || 0) + dur);
      if (e.ended_at) {
        const s = new Date(e.started_at), en = new Date(e.ended_at);
        blocks.push({
          start: s.getHours() * 60 + s.getMinutes(),
          end: en.getHours() * 60 + en.getMinutes(),
          billable,
          clientName: cname,
          durMin: dur,
        });
      }
    });

    // gap detection
    let gapMin = 0, gapStart: string | null = null, gapEnd: string | null = null;
    const sorted = [...blocks].sort((a, b) => a.start - b.start);
    let prevEnd = 8 * 60;
    for (const b of sorted) {
      if (b.start > prevEnd && b.start - prevEnd >= 15) {
        if (b.start - prevEnd > gapMin) {
          gapMin = b.start - prevEnd;
          const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
          gapStart = fmt(prevEnd);
          gapEnd = fmt(b.start);
        }
      }
      prevEnd = Math.max(prevEnd, b.end);
    }

    const nowMs = Date.now();
    const activeList = (presence.data || []).filter((p: any) =>
      p.user_id !== user.id &&
      p.status !== "offline" &&
      nowMs - new Date(p.last_seen_at).getTime() < 2 * 60 * 1000
    );
    const activeIds = activeList.map((p: any) => p.user_id);
    const profilesRes = activeIds.length
      ? await supabase.from("profiles").select("id, name").in("id", activeIds)
      : { data: [] as any[] };
    const nameById = new Map<string, string>();
    (profilesRes.data || []).forEach((p: any) => nameById.set(p.id, p.name || ""));

    const topClients = [...byClient.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
      .map(([name, min]) => ({ name, min }));

    setData({
      minutesToday: totalMin,
      billableMin,
      blocks,
      teamActive: activeList.length,
      topMembers: activeList.slice(0, 4).map((p: any) => ({
        id: p.user_id,
        name: (nameById.get(p.user_id) || "Miembro"),
        clientName: p.current_task || p.current_client || null,
      })),
      monthIncome: (payments.data || []).reduce((s: number, p: any) => s + Number(p.amount_received), 0),
      topClients,
      gapMin, gapStart, gapEnd,
    });
    setLoading(false);
  }, [user?.id]);

  const scheduleLoad = useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => load(), 400);
  }, [load]);

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel("home-desktop-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "time_entries", filter: `user_id=eq.${user.id}` }, scheduleLoad)
      .on("postgres_changes", { event: "*", schema: "public", table: "member_presence" }, scheduleLoad)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, scheduleLoad)
      .subscribe();
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      supabase.removeChannel(ch);
    };
  }, [user?.id, load, scheduleLoad]);

  return { ...data, loading };
}


function DayRail({ blocks, height = "h-3" }: { blocks: DayBlock[]; height?: string }) {
  const startH = 8, endH = 19;
  const total = (endH - startH) * 60;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPct = ((nowMin - startH * 60) / total) * 100;
  const showNow = nowPct >= 0 && nowPct <= 100;

  const palette = ["#3B5BA9", "#C8553D", "#2E7D6B", "#7A4FA1", "#B5894C", "#5A6E8C"];
  const colorFor = (name?: string | null) => {
    if (!name) return "hsl(var(--foreground) / 0.3)";
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  };

  return (
    <div className="relative">
      <div className={cn("relative w-full rounded-full bg-foreground/10 overflow-hidden", height)}>
        {blocks.map((b, i) => {
          const left = Math.max(0, ((b.start - startH * 60) / total) * 100);
          const width = Math.max(0.5, ((b.end - b.start) / total) * 100);
          if (left > 100) return null;
          return (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{
                left: `${left}%`,
                width: `${Math.min(width, 100 - left)}%`,
                background: colorFor(b.clientName),
              }}
            />
          );
        })}
        {showNow && (
          <div className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-accent shadow-[0_0_8px_hsl(var(--accent))]"
            style={{ left: `${nowPct}%` }} />
        )}
      </div>
    </div>
  );
}

export function DesktopBentoHome({ onIdea }: { onIdea?: () => void }) {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { isFree } = usePlan();
  const { economic, hasEconomicProfile } = useHourlyRate();
  const { isRunning, isStopping, activeTask, activeClient, activeEntry, elapsedSeconds, stopTimer } = useTimer();
  const navigate = useNavigate();
  const data = useHomeData();
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name, agencies(name)").eq("id", user.id).maybeSingle()
      .then(({ data }: any) => {
        setName((data?.name || "").split(" ")[0] || "");
        setAgencyName(data?.agencies?.name || "");
      });
    supabase.from("super_admin_users" as any).select("id").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsSuperAdmin(!!data));
  }, [user?.id]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const billablePct = data.minutesToday > 0
    ? Math.round((data.billableMin / data.minutesToday) * 100) : 0;
  const target = economic?.income_target || 0;
  const incomePct = target > 0 ? Math.min(Math.round((data.monthIncome / target) * 100), 999) : 0;

  const dateLabel = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-5 max-w-[1280px] mx-auto">
      {/* HERO — fondo oscuro con halo ámbar + tu día integrado (estilo PDF 02) */}
      <section className="relative overflow-hidden rounded-3xl bg-foreground text-background p-8 shadow-xl">
        <div className="pointer-events-none absolute -top-40 -right-32 h-[420px] w-[420px] rounded-full bg-accent/35 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: "radial-gradient(circle at 30% 40%, white 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-background/60">
              {dateLabel} · {new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-12 gap-8 items-start">
            <div className="col-span-12 lg:col-span-7">
              <h1 className="text-[44px] xl:text-[52px] font-bold leading-[1.02] tracking-tight">
                {greeting}{name ? "," : ""}{" "}
                {name && <span className="text-accent">{name}</span>}
              </h1>
              <p className="mt-3 text-[15px] text-background/70 max-w-xl min-h-[24px]">
                {data.loading ? (
                  <Skeleton className="h-5 w-72 bg-background/15" />
                ) : data.minutesToday > 0 ? (
                  <>Llevas <span className="font-bold tabular-nums text-background">{formatDuration(data.minutesToday)}</span> hoy en {data.topClients.length} {data.topClients.length === 1 ? "cliente" : "clientes"} · <span className="font-bold tabular-nums text-background">{billablePct}%</span> facturable{data.gapMin >= 15 ? <> · hueco de <span className="text-accent font-bold">{data.gapMin}m</span></> : null}.</>
                ) : (
                  "Sin actividad registrada todavía. Empieza el día."
                )}
              </p>
            </div>

            <div className="col-span-12 lg:col-span-5 flex flex-col gap-2.5">
              {/* Captura rápida / búsqueda */}
              <button
                onClick={() => {
                  const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
                  window.dispatchEvent(event);
                }}
                className="group flex items-center justify-between rounded-2xl bg-background/10 hover:bg-background/15 border border-background/10 px-4 py-3 text-left transition-colors backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
                    <Command className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">Buscar o registrar</p>
                    <p className="text-[10px] text-background/55">Captura rápida</p>
                  </div>
                </div>
                <kbd className="inline-flex items-center rounded-md border border-background/20 bg-background/5 px-2 py-1 text-[10px] font-mono text-background/70">⌘K</kbd>
              </button>

              {isSuperAdmin && (
                <Link
                  to="/comando"
                  className="flex items-center justify-between rounded-2xl bg-background/5 hover:bg-background/10 border border-background/10 px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Radar className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-[13px] font-semibold">Comando · LIVE</p>
                      <p className="text-[10px] text-background/55">Vista de fundador</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-background/60" />
                </Link>
              )}
            </div>
          </div>

          {/* TU DÍA — barra integrada al hero */}
          <div className="relative mt-7">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-background/55">Tu día</p>
              <p className="text-[10px] tabular-nums text-background/45">08h → 19h</p>
            </div>
            {data.loading ? (
              <Skeleton className="h-3 w-full bg-background/15 rounded-full" />
            ) : (
              <DayRail blocks={data.blocks} height="h-3.5" />
            )}
            {data.topClients.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {data.topClients.slice(0, 4).map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-background/60" />
                    <span className="text-[11px] text-background/70">{c.name}</span>
                    <span className="text-[11px] tabular-nums font-semibold text-background">{formatDuration(c.min)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <WelcomeChecklist />

      {/* BENTO ROW — Timer activo (hero) + KPIs verticales */}
      <div className="grid grid-cols-12 gap-4">
        {/* TIMER widget — span grande */}
        <div className="col-span-12 lg:col-span-7">
          {isRunning ? (
            <div className="relative h-full overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 via-card to-card p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">En curso</p>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-foreground leading-tight max-w-md truncate">
                    {activeTask?.title || activeEntry?.description || "Actividad sin nombre"}
                  </p>
                  <p className="mt-1 text-sm text-foreground-secondary truncate">
                    {activeClient?.name || "Sin cliente"}
                  </p>
                </div>
                <p className="text-5xl font-bold tabular-nums text-foreground leading-none">
                  {formatElapsedShort(elapsedSeconds)}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <button
                  onClick={() => stopTimer()}
                  disabled={isStopping}
                  className="flex h-10 items-center gap-2 rounded-xl bg-foreground text-background px-4 text-sm font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-60"
                >
                  <Pause className="h-3.5 w-3.5" /> Detener registro
                </button>
                <button
                  onClick={() => setSheetOpen(true)}
                  className="flex h-10 items-center rounded-xl bg-muted text-foreground px-4 text-sm font-semibold hover:bg-muted/80 transition-colors"
                >
                  Cambiar actividad
                </button>
                <button
                  onClick={() => navigate("/bitacora")}
                  className="ml-auto flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Ver bitácora <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setSheetOpen(true)}
              className="group h-full w-full rounded-2xl border border-border/60 bg-card p-6 text-left hover:border-accent/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">Empieza un registro</p>
                  <p className="mt-0.5 text-sm text-foreground-secondary">Captura rápida — actividad, cliente, tarea</p>
                </div>
                <Play className="ml-auto h-5 w-5 text-foreground-muted group-hover:text-accent transition-colors" />
              </div>
            </button>
          )}
        </div>

        {/* KPIs columna 5/12 — 2 widgets compactos */}
        <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-foreground text-background p-5 shadow-sm">
            <div className="flex items-center gap-1.5 text-background/55">
              <Clock className="h-3 w-3" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Hoy</span>
            </div>
            {data.loading ? (
              <Skeleton className="mt-3 h-9 w-20 bg-background/20" />
            ) : (
              <>
                <p className="mt-3 text-[34px] font-bold leading-none tabular-nums">
                  {formatDuration(data.minutesToday)}
                </p>
                <div className="mt-3 h-1 w-full rounded-full bg-background/15 overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${Math.min((data.minutesToday / 480) * 100, 100)}%` }} />
                </div>
                <p className="mt-2 text-[11px] text-background/60 tabular-nums">
                  {billablePct}% fact · /8h meta
                </p>
              </>
            )}
          </div>

          {hasEconomicProfile && target > 0 ? (
            <div className="rounded-2xl bg-accent text-accent-foreground p-5 shadow-sm">
              <div className="flex items-center gap-1.5 opacity-75">
                <Target className="h-3 w-3" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Meta del mes</span>
              </div>
              <p className="mt-3 text-[34px] font-bold leading-none tabular-nums">{incomePct}%</p>
              <div className="mt-3 h-1 w-full rounded-full bg-accent-foreground/20 overflow-hidden">
                <div className="h-full bg-accent-foreground" style={{ width: `${Math.min(incomePct, 100)}%` }} />
              </div>
              <p className="mt-2 text-[11px] opacity-75 tabular-nums">
                ${Math.round(data.monthIncome / 1000)}k / ${Math.round(target / 1000)}k
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-1.5 text-foreground-muted">
                <Target className="h-3 w-3" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Facturable</span>
              </div>
              {data.loading ? (
                <Skeleton className="mt-3 h-9 w-16" />
              ) : (
                <>
                  <p className="mt-3 text-[34px] font-bold leading-none tabular-nums text-accent">
                    {billablePct}%
                  </p>
                  <p className="mt-3 text-[11px] text-foreground-secondary tabular-nums">
                    {formatDuration(data.billableMin)} de hoy
                  </p>
                </>
              )}
            </div>
          )}

          {/* Hueco / Equipo */}
          {!data.loading && data.gapMin >= 15 ? (
            <Link
              to="/bitacora"
              className="col-span-2 flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/10 p-4 hover:bg-accent/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Hueco sin registrar</p>
                  <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
                    {data.gapMin}m · {data.gapStart} — {data.gapEnd}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold text-accent-foreground">+ Llenar hueco</span>
            </Link>
          ) : (
            <Link
              to="/hub"
              className="col-span-2 flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UsersIcon className="h-4 w-4 text-foreground-muted" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">Equipo ahora</p>
                  <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
                    {data.teamActive} {data.teamActive === 1 ? "persona activa" : "personas activas"}
                  </p>
                </div>
              </div>
              {data.topMembers.length > 0 && (
                <div className="flex -space-x-2">
                  {data.topMembers.slice(0, 4).map((m) => (
                    <div key={m.id} className="relative flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold border-2 border-card">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
            </Link>
          )}
        </div>
      </div>

      {/* BENTO ROW — Tareas + Ideas + Equipo (3 columnas balanceadas) */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7">
          <DayTasksWidget />
        </div>
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <IdeasWidget refreshTrigger={0} />
          {!isFree && <GapsWidget />}
        </div>
      </div>

      {/* EQUIPO con detalle — solo si hay miembros activos y no es free */}
      {!isFree && data.topMembers.length > 0 && (
        <Link to="/hub" className="block rounded-2xl border border-border/60 bg-card p-5 hover:border-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-3.5 w-3.5 text-foreground-muted" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground-muted">Equipo en vivo</p>
            </div>
            <span className="text-[11px] tabular-nums text-foreground-secondary">
              {data.teamActive} {data.teamActive === 1 ? "activo" : "activos"}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {data.topMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-bold flex-shrink-0">
                  {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-foreground truncate">{m.name.split(" ")[0]}</p>
                  {m.clientName && (
                    <p className="text-[10px] text-foreground-muted truncate">{m.clientName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Link>
      )}

      <QuickSheet open={sheetOpen} onOpenChange={setSheetOpen} mode="start" />
    </div>
  );
}
