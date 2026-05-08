import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { supabase } from "@/integrations/supabase/client";
import { formatElapsedShort, formatDuration } from "@/lib/timer-utils";
import {
  Zap, Play, Clock, Users, ListTodo, Sparkles, ArrowRight, Radar,
} from "lucide-react";
import { QuickSheet } from "@/components/timer/QuickSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DayBlock {
  start: number; // minutes from 0:00
  end: number;
  billable: boolean;
}

interface DayData {
  minutesToday: number;
  billableMin: number;
  blocks: DayBlock[];
  nextTask: { title: string; client: string | null } | null;
  activeMembers: number;
  gapMin: number;
  gapStart: string | null;
}

const EMPTY: DayData = {
  minutesToday: 0, billableMin: 0, blocks: [], nextTask: null,
  activeMembers: 0, gapMin: 0, gapStart: null,
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
        .select("started_at, ended_at, duration_min, client_id, clients(monthly_rate)")
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
        .select("user_id, status, last_seen_at"),
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
        const s = new Date(e.started_at);
        const en = new Date(e.ended_at);
        blocks.push({
          start: s.getHours() * 60 + s.getMinutes(),
          end: en.getHours() * 60 + en.getMinutes(),
          billable,
        });
      }
    });

    let gapMin = 0, gapStart: string | null = null;
    const sorted = [...blocks].sort((a, b) => a.start - b.start);
    let prevEnd = 8 * 60;
    for (const b of sorted) {
      if (b.start > prevEnd && b.start - prevEnd >= 15) {
        if (b.start - prevEnd > gapMin) {
          gapMin = b.start - prevEnd;
          const h = Math.floor(prevEnd / 60); const m = prevEnd % 60;
          gapStart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
      }
      prevEnd = Math.max(prevEnd, b.end);
    }

    const t = tasks.data?.[0] as any;
    const now = Date.now();
    const activeMembers = (presence.data || []).filter((p: any) =>
      p.user_id !== user.id &&
      p.status !== "offline" &&
      now - new Date(p.last_seen_at).getTime() < 2 * 60 * 1000
    ).length;

    setData({
      minutesToday: totalMin,
      billableMin,
      blocks,
      nextTask: t ? { title: t.title, client: t.clients?.name || null } : null,
      activeMembers,
      gapMin,
      gapStart,
    });
    setLoading(false);
  }, [user?.id]);

  // Debounced reload to coalesce realtime bursts
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


function DayRail({ blocks }: { blocks: DayBlock[] }) {
  const startH = 8, endH = 19;
  const total = (endH - startH) * 60;
  return (
    <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
      {blocks.map((b, i) => {
        const left = Math.max(0, ((b.start - startH * 60) / total) * 100);
        const width = Math.max(0.5, ((b.end - b.start) / total) * 100);
        if (left > 100) return null;
        return (
          <div
            key={i}
            className={cn(
              "absolute top-0 h-full rounded-full",
              b.billable ? "bg-accent" : "bg-foreground/40"
            )}
            style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
          />
        );
      })}
    </div>
  );
}

export function MobileBentoHome() {
  const { user } = useAuth();
  const { isRunning, activeClient, activeTask, activeEntry, elapsedSeconds } = useTimer();
  const { loading, ...data } = useDayData();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  return (
    <div className="space-y-3 pb-4">
      {/* HERO — saludo ámbar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/95 via-accent to-accent/80 p-5 text-accent-foreground shadow-lg">
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70">
            {new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "short" })}
          </p>
          <h1 className="mt-1 text-3xl font-bold leading-tight">
            {greeting}{name ? `, ${name}` : ""}
          </h1>
          <p className="mt-2 text-sm opacity-90 min-h-[20px]">
            {loading ? (
              <Skeleton className="h-4 w-48 bg-accent-foreground/20" />
            ) : data.minutesToday > 0
              ? <>Llevas <span className="font-bold tabular-nums">{formatDuration(data.minutesToday)}</span> hoy · <span className="font-bold tabular-nums">{billablePct}%</span> facturable</>
              : "Sin actividad registrada todavía. Empieza a registrar."}
          </p>
        </div>
      </div>

      {/* SUPER ADMIN — Comando shortcut */}
      {isSuperAdmin && (
        <Link to="/comando" className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
              <Radar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Comando</p>
              <p className="text-[11px] text-foreground-muted">Pulso de toda la agencia</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-foreground-muted" />
        </Link>
      )}

      {/* TIMER ACTIVO o CTA — fila completa hero */}
      {isRunning ? (
        <button
          onClick={() => navigate("/bitacora")}
          className="w-full rounded-2xl border-2 border-accent/60 bg-accent/10 p-4 text-left active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">En curso</p>
            </div>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {formatElapsedShort(elapsedSeconds)}
            </p>
          </div>
          <p className="mt-1.5 text-base font-semibold text-foreground truncate">
            {activeTask?.title || activeEntry?.description || "Actividad sin nombre"}
          </p>
          <p className="text-xs text-foreground-secondary truncate">
            {activeClient?.name || "Sin cliente"}
          </p>
        </button>
      ) : (
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full rounded-2xl bg-foreground p-4 text-left active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <Zap className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-background">Iniciar registro</p>
              <p className="text-[11px] text-background/60">Captura rápida</p>
            </div>
          </div>
        </button>
      )}

      {/* BENTO 2x2: Día / KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">Tu día</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatDuration(data.minutesToday)}
          </p>
          <div className="mt-3"><DayRail blocks={data.blocks} /></div>
          <p className="mt-2 text-[10px] text-foreground-muted tabular-nums">08h → 19h</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">Facturable</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-accent">{billablePct}%</p>
          <p className="mt-3 text-[11px] text-foreground-secondary tabular-nums">
            {formatDuration(data.billableMin)}
          </p>
          <p className="mt-1 text-[10px] text-foreground-muted">de horas registradas</p>
        </div>
      </div>

      {/* HUECO — fila completa si existe */}
      {data.gapMin >= 15 && (
        <Link
          to="/bitacora"
          className="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20">
              <Clock className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Hueco de {data.gapMin} min
              </p>
              <p className="text-[11px] text-foreground-muted">
                desde las {data.gapStart} · llenar
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-accent" />
        </Link>
      )}

      {/* BENTO: Próxima tarea / Equipo */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/tasks" className="rounded-2xl border border-border/60 bg-card p-4 active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2">
            <ListTodo className="h-3.5 w-3.5 text-foreground-muted" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">Próxima</p>
          </div>
          {data.nextTask ? (
            <>
              <p className="mt-2 text-sm font-semibold text-foreground line-clamp-2">
                {data.nextTask.title}
              </p>
              {data.nextTask.client && (
                <p className="mt-1 text-[11px] text-foreground-muted truncate">{data.nextTask.client}</p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-foreground-muted">Sin tareas pendientes</p>
          )}
        </Link>

        <Link to="/hub" className="rounded-2xl border border-border/60 bg-card p-4 active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-foreground-muted" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">Equipo</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
            {data.activeMembers}
          </p>
          <p className="mt-1 text-[11px] text-foreground-muted">
            {data.activeMembers === 1 ? "persona activa" : "personas activas"}
          </p>
        </Link>
      </div>

      {/* BRIEFING — muted, solo si tiene info */}
      {data.minutesToday > 0 && (
        <div className="rounded-2xl border border-border/40 bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
              Briefing
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

      <QuickSheet open={sheetOpen} onOpenChange={setSheetOpen} mode="start" />
    </div>
  );
}
