import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { supabase } from "@/integrations/supabase/client";
import { formatElapsedShort, formatDuration } from "@/lib/timer-utils";
import {
  Zap, Play, Pause, Clock, Users, ListTodo, ArrowRight, Radar, HelpCircle, Bell,
} from "lucide-react";
import { QuickSheet } from "@/components/timer/QuickSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DayBlock { start: number; end: number; billable: boolean; clientName?: string | null; durMin: number }

interface DayData {
  minutesToday: number;
  billableMin: number;
  blocks: DayBlock[];
  nextTask: { title: string; client: string | null } | null;
  activeMembers: number;
  topMembers: { name: string; clientName: string | null }[];
  gapMin: number;
  gapStart: string | null;
  gapEnd: string | null;
  topClients: { name: string; min: number }[];
}

const EMPTY: DayData = {
  minutesToday: 0, billableMin: 0, blocks: [], nextTask: null,
  activeMembers: 0, topMembers: [], gapMin: 0, gapStart: null, gapEnd: null, topClients: [],
};

function useDayData() {
  const { user } = useAuth();
  const [data, setData] = useState<DayData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [entries, tasks, presence] = await Promise.all([
      supabase.from("time_entries")
        .select("started_at, ended_at, duration_min, client_id, clients(name, monthly_rate)")
        .eq("user_id", user.id)
        .gte("started_at", todayStart.toISOString())
        .order("started_at", { ascending: true }),
      supabase.from("tasks")
        .select("title, client_id, clients(name)")
        .eq("assignee_id", user.id)
        .in("status", ["backlog", "todo"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(1),
      supabase.from("member_presence")
        .select("user_id, status, last_seen_at, current_task, current_client"),
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
        const s = new Date(e.started_at);
        const en = new Date(e.ended_at);
        blocks.push({
          start: s.getHours() * 60 + s.getMinutes(),
          end: en.getHours() * 60 + en.getMinutes(),
          billable,
          clientName: cname,
          durMin: dur,
        });
      }
    });

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

    const t = tasks.data?.[0] as any;
    const now = Date.now();
    const activeList = (presence.data || []).filter((p: any) =>
      p.user_id !== user.id &&
      p.status !== "offline" &&
      now - new Date(p.last_seen_at).getTime() < 2 * 60 * 1000
    );

    // Resolve names for active members in parallel
    const activeIds = activeList.map((p: any) => p.user_id);
    const profilesRes = activeIds.length
      ? await supabase.from("profiles").select("id, name").in("id", activeIds)
      : { data: [] as any[] };
    const nameById = new Map<string, string>();
    (profilesRes.data || []).forEach((p: any) => nameById.set(p.id, p.name || ""));

    const topClients = [...byClient.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, min]) => ({ name, min }));

    setData({
      minutesToday: totalMin,
      billableMin,
      blocks,
      nextTask: t ? { title: t.title, client: t.clients?.name || null } : null,
      activeMembers: activeList.length,
      topMembers: activeList.slice(0, 3).map((p: any) => ({
        name: (nameById.get(p.user_id) || "").split(" ")[0] || "Miembro",
        clientName: p.current_task || p.current_client || null,
      })),
      gapMin,
      gapStart,
      gapEnd,
      topClients,
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
      .channel("home-mobile-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "time_entries", filter: `user_id=eq.${user.id}` }, scheduleLoad)
      .on("postgres_changes", { event: "*", schema: "public", table: "member_presence" }, scheduleLoad)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `assignee_id=eq.${user.id}` }, scheduleLoad)
      .subscribe();
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      supabase.removeChannel(ch);
    };
  }, [user?.id, load, scheduleLoad]);

  return { ...data, loading };
}

/** Day rail – stripe of blocks across configurable window, with optional 'now' marker */
function DayRail({ blocks, height = "h-2.5" }: { blocks: DayBlock[]; height?: string }) {
  const startH = 8, endH = 19;
  const total = (endH - startH) * 60;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPct = ((nowMin - startH * 60) / total) * 100;
  const showNow = nowPct >= 0 && nowPct <= 100;

  // Deterministic color per client
  const colors = ["bg-[#3B5BA9]", "bg-[#C8553D]", "bg-[#2E7D6B]", "bg-[#7A4FA1]", "bg-[#B5894C]"];
  const colorFor = (name?: string | null) => {
    if (!name) return "bg-foreground/40";
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return colors[h % colors.length];
  };

  return (
    <div className={cn("relative w-full rounded-full bg-muted overflow-hidden", height)}>
      {blocks.map((b, i) => {
        const left = Math.max(0, ((b.start - startH * 60) / total) * 100);
        const width = Math.max(0.5, ((b.end - b.start) / total) * 100);
        if (left > 100) return null;
        return (
          <div
            key={i}
            className={cn("absolute top-0 h-full", colorFor(b.clientName))}
            style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
          />
        );
      })}
      {showNow && (
        <div className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-accent shadow-[0_0_6px_hsl(var(--accent))]"
          style={{ left: `${nowPct}%` }} />
      )}
    </div>
  );
}

export function MobileBentoHome() {
  const { user } = useAuth();
  const { isRunning, isStopping, activeClient, activeTask, activeEntry, elapsedSeconds, stopTimer } = useTimer();
  const { loading, ...data } = useDayData();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [agencyName, setAgencyName] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name, agency_id, agencies(name)").eq("id", user.id).maybeSingle()
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

  const dateLabel = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  return (
    <div className="space-y-3 pb-6">
      {/* HERO — fondo oscuro con halo ámbar (estilo PDF "Buenas tardes, Roger") */}
      <div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-5 shadow-xl">
        {/* halo ámbar superior derecho */}
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: "radial-gradient(circle at 30% 40%, white 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

        {/* Identity row */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-background text-foreground text-[10px] font-black">
              {(agencyName?.[0] || "O").toUpperCase()}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-background/60">
              {agencyName || "Estudio"} <span className="text-background/30">·</span> {name || "tú"}
            </p>
          </div>
          <Link to="/notificaciones" className="flex h-8 w-8 items-center justify-center rounded-full bg-background/10 text-background/80">
            <Bell className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="relative mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-background/50">
            {dateLabel}
          </p>
          <h1 className="mt-2 text-[34px] font-bold leading-[1.05] tracking-tight">
            {greeting}{name ? `,` : ""}{" "}
            {name && <span className="text-accent">{name}</span>}
          </h1>
          <p className="mt-2 text-[13px] text-background/70 min-h-[18px]">
            {loading ? (
              <Skeleton className="h-4 w-48 bg-background/15" />
            ) : data.minutesToday > 0 ? (
              <>Llevas <span className="font-bold text-background tabular-nums">{formatDuration(data.minutesToday)}</span> hoy · <span className="font-bold text-background tabular-nums">{billablePct}%</span> facturable</>
            ) : (
              "Sin actividad registrada todavía. Empieza tu día."
            )}
          </p>
        </div>
      </div>

      {/* TIMER — widget bento (en curso o CTA) */}
      {isRunning ? (
        <div className="relative overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/15 via-card to-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <button onClick={() => navigate("/bitacora")} className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">En curso</p>
              </div>
              <p className="mt-2 text-[15px] font-bold text-foreground truncate">
                {activeTask?.title || activeEntry?.description || "Actividad sin nombre"}
              </p>
              <p className="text-[11px] text-foreground-secondary truncate">
                {activeClient?.name || "Sin cliente"}
              </p>
            </button>
            <p className="text-[26px] font-bold tabular-nums text-foreground leading-none">
              {formatElapsedShort(elapsedSeconds)}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => stopTimer()}
              disabled={isStopping}
              className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-foreground text-background text-[12px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <Pause className="h-3.5 w-3.5" /> Detener
            </button>
            <button
              onClick={() => setSheetOpen(true)}
              className="flex h-9 items-center justify-center rounded-xl bg-muted text-foreground text-[12px] font-semibold active:scale-[0.98] transition-transform"
            >
              Cambiar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full rounded-2xl bg-foreground text-background p-4 active:scale-[0.99] transition-transform shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                <Zap className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-bold">Iniciar registro</p>
                <p className="text-[11px] text-background/60">Captura rápida</p>
              </div>
            </div>
            <Play className="h-4 w-4 text-background/70" />
          </div>
        </button>
      )}

      {/* TU DÍA — widget de línea con marcador now */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-foreground-muted" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">Tu día</p>
          </div>
          <p className="text-[10px] tabular-nums text-foreground-muted">08h → 19h</p>
        </div>
        {loading ? (
          <Skeleton className="mt-4 h-3 w-full rounded-full" />
        ) : (
          <>
            <div className="mt-4"><DayRail blocks={data.blocks} height="h-3" /></div>
            {data.topClients.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
                {data.topClients.map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-foreground/70" />
                    <span className="text-[11px] text-foreground-secondary">{c.name}</span>
                    <span className="text-[11px] tabular-nums font-semibold text-foreground">{formatDuration(c.min)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* HUECO — destacado ámbar */}
      {!loading && data.gapMin >= 15 && (
        <Link
          to="/bitacora"
          className="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/10 p-4 active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/25 text-accent">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Hueco sin registrar</p>
              <p className="mt-0.5 text-[13px] font-bold text-foreground tabular-nums">
                {data.gapMin}m · {data.gapStart} — {data.gapEnd}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold text-accent-foreground">+ Llenar</span>
        </Link>
      )}

      {/* BENTO 2-COL — Hoy total / Sigue */}
      <div className="grid grid-cols-5 gap-3">
        {/* HOY (2/5) — tarjeta oscura */}
        <div className="col-span-2 rounded-2xl bg-foreground text-background p-4 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-background/60" />
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-background/60">Hoy</p>
          </div>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20 bg-background/20" />
          ) : (
            <>
              <p className="mt-3 text-[28px] font-bold leading-none tabular-nums">
                {formatDuration(data.minutesToday)}
              </p>
              <div className="mt-3 h-1 w-full rounded-full bg-background/15 overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${Math.min((data.minutesToday / 480) * 100, 100)}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-background/60 tabular-nums">{billablePct}% fact · /8h</p>
            </>
          )}
        </div>

        {/* SIGUE (3/5) — próxima tarea */}
        <Link to="/tasks" className="col-span-3 rounded-2xl border border-border/60 bg-card p-4 active:scale-[0.98] transition-transform shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ListTodo className="h-3 w-3 text-foreground-muted" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">Sigue</p>
            </div>
            {data.nextTask && <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent uppercase">High</span>}
          </div>
          {loading ? (
            <>
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-1.5 h-3 w-24" />
            </>
          ) : data.nextTask ? (
            <>
              <p className="mt-3 text-[14px] font-bold text-foreground line-clamp-2 leading-snug">
                {data.nextTask.title}
              </p>
              {data.nextTask.client && (
                <p className="mt-1 text-[11px] text-foreground-muted truncate">{data.nextTask.client}</p>
              )}
              <button
                onClick={(e) => { e.preventDefault(); setSheetOpen(true); }}
                className="mt-3 flex h-7 w-7 items-center justify-center rounded-lg bg-accent active:scale-95 transition-transform"
              >
                <Play className="h-3 w-3 text-accent-foreground" fill="currentColor" />
              </button>
            </>
          ) : (
            <p className="mt-3 text-[13px] text-foreground-muted">Sin tareas pendientes</p>
          )}
        </Link>
      </div>

      {/* EQUIPO AHORA — widget con miembros activos */}
      <Link to="/hub" className="block rounded-2xl border border-border/60 bg-card p-4 shadow-sm active:scale-[0.99] transition-transform">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-foreground-muted" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">Equipo ahora</p>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tabular-nums text-foreground">
            {loading ? "…" : `${data.activeMembers} ${data.activeMembers === 1 ? "activo" : "activos"}`}
          </span>
        </div>

        {loading ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data.topMembers.length > 0 ? (
          <div className="mt-3 space-y-2">
            {data.topMembers.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-bold">
                  {m.name.slice(0, 2).toUpperCase()}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-foreground truncate">{m.name}</p>
                  {m.clientName && (
                    <p className="text-[10px] text-foreground-muted truncate">{m.clientName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[12px] text-foreground-muted">Nadie del equipo activo ahora.</p>
        )}
      </Link>

      {/* SUPER ADMIN — Comando shortcut, al final */}
      {isSuperAdmin && (
        <Link to="/comando" className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
              <Radar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Comando · LIVE</p>
              <p className="text-[11px] text-foreground-muted">Pulso de toda la agencia</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-foreground-muted" />
        </Link>
      )}

      <QuickSheet open={sheetOpen} onOpenChange={setSheetOpen} mode="start" />
    </div>
  );
}
