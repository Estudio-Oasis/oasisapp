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
import { TimerLauncherWidget } from "@/components/dashboard/TimerLauncherWidget";
import { IdeasWidget } from "@/components/dashboard/IdeasWidget";
import { TeamWidget } from "@/components/dashboard/TeamWidget";
import { GapsWidget } from "@/components/dashboard/GapsWidget";
import { FinanceSummaryWidget } from "@/components/dashboard/FinanceSummaryWidget";
import { WelcomeChecklist } from "@/components/dashboard/WelcomeChecklist";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Radar, ArrowRight, Clock, Target, TrendingUp, Users as UsersIcon,
  Sparkles, Command,
} from "lucide-react";

interface DayBlock { start: number; end: number; billable: boolean }

function useHomeData() {
  const { user } = useAuth();
  const [data, setData] = useState({
    minutesToday: 0, billableMin: 0, blocks: [] as DayBlock[],
    teamActive: 0, monthIncome: 0, topClient: null as { name: string; hours: number } | null,
  });
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [entries, presence, payments, monthEntries] = await Promise.all([
      supabase.from("time_entries")
        .select("started_at, ended_at, duration_min, client_id, clients(name, monthly_rate)")
        .eq("user_id", user.id).gte("started_at", todayStart.toISOString()).order("started_at"),
      supabase.from("member_presence").select("user_id, status, last_seen_at"),
      supabase.from("payments").select("amount_received").gte("date_received", monthStart),
      supabase.from("time_entries")
        .select("duration_min, clients(name)")
        .eq("user_id", user.id).gte("started_at", monthStart).not("ended_at", "is", null),
    ]);

    const list = entries.data || [];
    let totalMin = 0, billableMin = 0;
    const blocks: DayBlock[] = [];
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
      if (e.ended_at) {
        const s = new Date(e.started_at), en = new Date(e.ended_at);
        blocks.push({
          start: s.getHours() * 60 + s.getMinutes(),
          end: en.getHours() * 60 + en.getMinutes(),
          billable,
        });
      }
    });

    const byClient = new Map<string, number>();
    (monthEntries.data || []).forEach((e: any) => {
      const name = e?.clients?.name;
      if (!name) return;
      byClient.set(name, (byClient.get(name) || 0) + (Number(e.duration_min) || 0));
    });
    const topEntry = [...byClient.entries()].sort((a, b) => b[1] - a[1])[0];

    const nowMs = Date.now();
    const teamActive = (presence.data || []).filter((p: any) =>
      p.user_id !== user.id &&
      p.status !== "offline" &&
      nowMs - new Date(p.last_seen_at).getTime() < 2 * 60 * 1000
    ).length;

    setData({
      minutesToday: totalMin, billableMin, blocks,
      teamActive,
      monthIncome: (payments.data || []).reduce((s: number, p: any) => s + Number(p.amount_received), 0),
      topClient: topEntry ? { name: topEntry[0], hours: Math.round(topEntry[1] / 6) / 10 } : null,
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


function DayRail({ blocks }: { blocks: DayBlock[] }) {
  const startH = 8, endH = 19;
  const total = (endH - startH) * 60;
  return (
    <div className="relative h-2.5 w-full rounded-full bg-white/15 overflow-hidden">
      {blocks.map((b, i) => {
        const left = Math.max(0, ((b.start - startH * 60) / total) * 100);
        const width = Math.max(0.5, ((b.end - b.start) / total) * 100);
        if (left > 100) return null;
        return (
          <div
            key={i}
            className={b.billable ? "absolute top-0 h-full rounded-full bg-accent-foreground" : "absolute top-0 h-full rounded-full bg-accent-foreground/40"}
            style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
          />
        );
      })}
    </div>
  );
}

export function DesktopBentoHome({ onIdea }: { onIdea?: () => void }) {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { isFree } = usePlan();
  const { economic, hasEconomicProfile } = useHourlyRate();
  const { isRunning, activeTask, activeClient, activeEntry, elapsedSeconds } = useTimer();
  const navigate = useNavigate();
  const data = useHomeData();
  const [name, setName] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName((data?.name || "").split(" ")[0] || ""));
    supabase.from("super_admin_users" as any).select("id").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsSuperAdmin(!!data));
  }, [user?.id]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const billablePct = data.minutesToday > 0
    ? Math.round((data.billableMin / data.minutesToday) * 100) : 0;
  const target = economic?.income_target || 0;
  const incomePct = target > 0 ? Math.min(Math.round((data.monthIncome / target) * 100), 999) : 0;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* HERO ÁMBAR */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/95 via-accent to-accent/85 p-7 text-accent-foreground shadow-xl">
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative grid grid-cols-12 gap-6 items-center">
          <div className="col-span-12 lg:col-span-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">
              {new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="mt-1.5 text-4xl lg:text-5xl font-bold leading-tight">
              {greeting}{name ? `, ${name}` : ""}
            </h1>
            <p className="mt-3 text-base opacity-90 max-w-lg min-h-[24px]">
              {data.loading ? (
                <Skeleton className="h-5 w-72 bg-accent-foreground/20" />
              ) : data.minutesToday > 0
                ? <>Llevas <span className="font-bold tabular-nums">{formatDuration(data.minutesToday)}</span> registradas hoy · <span className="font-bold tabular-nums">{billablePct}%</span> facturable</>
                : "Sin actividad registrada todavía. Empieza el día."}
            </p>
            <div className="mt-5 max-w-lg">
              <DayRail blocks={data.blocks} />
              <p className="mt-1.5 text-[10px] uppercase tracking-widest opacity-60 tabular-nums">08h → 19h</p>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
            {isRunning ? (
              <button
                onClick={() => navigate("/bitacora")}
                className="rounded-2xl bg-accent-foreground/95 text-foreground p-4 text-left hover:bg-accent-foreground transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent">En curso</span>
                  </div>
                  <span className="text-2xl font-bold tabular-nums">{formatElapsedShort(elapsedSeconds)}</span>
                </div>
                <p className="mt-2 text-base font-semibold truncate">
                  {activeTask?.title || activeEntry?.description || "Actividad"}
                </p>
                <p className="text-xs text-foreground-secondary truncate">
                  {activeClient?.name || "Sin cliente"}
                </p>
              </button>
            ) : (
              <button
                onClick={() => {
                  const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
                  window.dispatchEvent(event);
                }}
                className="rounded-2xl bg-foreground/95 text-background p-4 text-left hover:bg-foreground transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                      <Command className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Captura rápida</p>
                      <p className="text-[11px] text-background/60">Inicia un registro</p>
                    </div>
                  </div>
                  <kbd className="hidden lg:inline-flex items-center gap-1 rounded-md border border-background/20 bg-background/10 px-2 py-1 text-[10px] font-mono opacity-70 group-hover:opacity-100 transition-opacity">
                    ⌘K
                  </kbd>
                </div>
              </button>
            )}

            {isSuperAdmin && (
              <Link
                to="/comando"
                className="flex items-center justify-between rounded-2xl bg-accent-foreground/10 backdrop-blur-sm border border-accent-foreground/20 px-4 py-3 hover:bg-accent-foreground/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Radar className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-semibold">Panel Comando</p>
                    <p className="text-[11px] opacity-70">Pulso de toda la agencia</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* WELCOME CHECKLIST */}
      <WelcomeChecklist />

      {/* BENTO ROW 1 — KPIs heroicos (admin) */}
      {isAdmin && !isFree && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-3 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 text-foreground-muted">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Mi día</span>
            </div>
            <p className="mt-3 text-4xl font-bold tabular-nums text-foreground">
              {formatDuration(data.minutesToday)}
            </p>
            <p className="mt-1 text-xs text-foreground-secondary tabular-nums">
              {billablePct}% facturable
            </p>
          </div>

          <div className="col-span-12 md:col-span-3 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 text-foreground-muted">
              <UsersIcon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Equipo activo</span>
            </div>
            <p className="mt-3 text-4xl font-bold tabular-nums text-foreground">
              {data.teamActive}
            </p>
            <p className="mt-1 text-xs text-foreground-secondary">
              {data.teamActive === 1 ? "persona ahora" : "personas ahora"}
            </p>
          </div>

          {hasEconomicProfile && target > 0 && (
            <div className="col-span-12 md:col-span-3 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-transparent p-5">
              <div className="flex items-center gap-2 text-accent">
                <Target className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-widest">Meta del mes</span>
              </div>
              <p className="mt-3 text-4xl font-bold tabular-nums text-accent">
                {incomePct}%
              </p>
              <p className="mt-1 text-xs text-foreground-secondary tabular-nums">
                ${data.monthIncome.toLocaleString()} / ${target.toLocaleString()}
              </p>
            </div>
          )}

          {data.topClient && (
            <div className={`col-span-12 ${hasEconomicProfile && target > 0 ? "md:col-span-3" : "md:col-span-6"} rounded-2xl border border-border/60 bg-card p-5`}>
              <div className="flex items-center gap-2 text-foreground-muted">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-widest">Cliente del mes</span>
              </div>
              <p className="mt-3 text-xl font-bold text-foreground truncate">
                {data.topClient.name}
              </p>
              <p className="mt-1 text-xs text-foreground-secondary tabular-nums">
                {data.topClient.hours}h registradas
              </p>
            </div>
          )}
        </div>
      )}

      {/* BENTO ROW 2 — Tareas + Timer */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7">
          <DayTasksWidget />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <TimerLauncherWidget onIdea={onIdea} />
        </div>
      </div>

      {/* BENTO ROW 3 — Ideas / Gaps / Equipo */}
      <div className={`grid grid-cols-12 gap-4`}>
        <div className={`col-span-12 ${isFree ? "md:col-span-6" : "md:col-span-4"}`}>
          <IdeasWidget refreshTrigger={0} />
        </div>
        <div className={`col-span-12 ${isFree ? "md:col-span-6" : "md:col-span-4"}`}>
          <GapsWidget />
        </div>
        {!isFree && (
          <div className="col-span-12 md:col-span-4">
            <TeamWidget />
          </div>
        )}
      </div>

      {/* FINANCE — admin only */}
      {isAdmin && !isFree && <FinanceSummaryWidget />}

      {/* BRIEFING */}
      {data.minutesToday > 0 && (
        <div className="rounded-2xl border border-border/40 bg-muted/30 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
              Briefing del día
            </p>
          </div>
          <p className="mt-2 text-sm text-foreground-secondary leading-relaxed">
            {billablePct >= 60
              ? <>Buena densidad facturable hoy ({billablePct}%). Sigue así.</>
              : billablePct >= 30
                ? <>Vas en {billablePct}% facturable. Considera priorizar trabajo de cliente.</>
                : <>Solo {billablePct}% facturable. Revisa qué actividad puede generar valor.</>}
          </p>
        </div>
      )}
    </div>
  );
}
