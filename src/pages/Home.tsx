import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { useRole } from "@/hooks/useRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { formatDuration, getClientColor } from "@/lib/timer-utils";
import {
  Timer, Square, ArrowRight, Zap, CheckSquare, Clock,
  DollarSign, TrendingUp, Users, ChevronRight,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

interface MemberPresence {
  user_id: string;
  status: string;
  current_client: string | null;
  current_task: string | null;
}

interface ProfileMin {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

interface PaymentMin {
  id: string;
  amount_received: number;
  currency_received: string;
  date_received: string;
  client_id: string;
}

interface ClientMin {
  id: string;
  name: string;
  monthly_rate: number | null;
}

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function HomePage() {
  const { user } = useAuth();
  const { isRunning, activeEntry, activeClient, activeTask, elapsedSeconds, stopTimer } = useTimer();
  const { isAdmin } = useRole();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<{ name: string | null }>({ name: null });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<ClientMin[]>([]);
  const [members, setMembers] = useState<MemberPresence[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileMin>>({});
  const [payments, setPayments] = useState<PaymentMin[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [profileRes, tasksRes, clientsRes, presenceRes, profilesRes, paymentsRes] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", user.id).single(),
        supabase.from("tasks").select("*").in("status", ["todo", "in_progress"]).eq("assignee_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("clients").select("id, name, monthly_rate").eq("status", "active"),
        supabase.from("member_presence").select("user_id, status, current_client, current_task"),
        supabase.from("profiles").select("id, name, avatar_url"),
        supabase.from("payments").select("id, amount_received, currency_received, date_received, client_id").order("date_received", { ascending: false }).limit(3),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setTasks((tasksRes.data || []) as Task[]);
      setClients((clientsRes.data || []) as ClientMin[]);
      setMembers((presenceRes.data || []) as MemberPresence[]);
      const pMap: Record<string, ProfileMin> = {};
      ((profilesRes.data || []) as ProfileMin[]).forEach(p => { pMap[p.id] = p; });
      setProfiles(pMap);
      setPayments((paymentsRes.data || []) as PaymentMin[]);
    };

    loadData();
  }, [user?.id]);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [clients]);

  const sortedTasks = useMemo(() =>
    [...tasks].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)).slice(0, 5),
    [tasks]
  );

  const mrr = useMemo(() => clients.reduce((s, c) => s + (c.monthly_rate || 0), 0), [clients]);

  const collectedThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return payments
      .filter(p => new Date(p.date_received + "T00:00:00") >= monthStart)
      .reduce((s, p) => s + p.amount_received, 0);
  }, [payments]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const displayName = profile?.name || user?.email?.split("@")[0] || "";
  const firstName = displayName.split(" ")[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  const openTimerForTask = (taskId: string, clientId: string) => {
    window.dispatchEvent(new CustomEvent("open-timer-for-task", { detail: { taskId, clientId } }));
  };

  const PRIORITY_BADGE: Record<string, string> = {
    urgent: "bg-destructive/10 text-destructive",
    high: "bg-accent/10 text-accent",
    medium: "bg-foreground-muted/10 text-foreground-secondary",
    low: "bg-background-secondary text-foreground-muted",
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Timer / Morning briefing */}
      {isRunning && activeEntry ? (
        <div className="rounded-2xl border-2 border-accent bg-accent/5 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Timer className="h-5 w-5 text-accent animate-pulse" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Trabajando en</p>
                <p className="text-lg font-semibold text-foreground">
                  {activeEntry.description || activeTask?.title || "Sin descripción"}
                  {activeClient && <span className="text-foreground-secondary font-normal"> · {activeClient.name}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold tabular-nums text-accent">
                {formatDuration(Math.floor(elapsedSeconds / 60))}
              </span>
              <Button variant="secondary" size="sm" onClick={() => navigate("/bitacora")}>
                Cambiar
              </Button>
              <Button variant="danger" size="sm" onClick={stopTimer}>
                <Square className="h-3.5 w-3.5" /> Detener
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{greeting}, {firstName} 👋</h1>
              <p className="text-sm text-foreground-secondary mt-1">
                {sortedTasks.length > 0
                  ? `Tienes ${sortedTasks.length} tarea${sortedTasks.length > 1 ? "s" : ""} pendiente${sortedTasks.length > 1 ? "s" : ""}`
                  : "Sin tareas pendientes para hoy"}
              </p>
            </div>
            <Button onClick={() => navigate("/bitacora")} className="gap-2">
              <Timer className="h-4 w-4" /> Iniciar sesión <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Grid: Tasks + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks (2/3) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-foreground-secondary" /> Mis tareas
            </h2>
            <Link to="/tasks" className="text-sm text-foreground-secondary hover:text-foreground transition-colors flex items-center gap-1">
              Ver todas <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {sortedTasks.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <CheckSquare className="h-8 w-8 text-border mx-auto mb-2" />
              <p className="text-sm text-foreground-secondary">Sin tareas para hoy</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate("/tasks")}>
                Crear tarea
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedTasks.map(task => {
                const cl = task.client_id ? clientMap[task.client_id] : null;
                const isOverdue = task.due_date && new Date(task.due_date) < today && task.status !== "done";
                return (
                  <div
                    key={task.id}
                    className={`rounded-xl border bg-card p-4 flex items-center gap-3 group hover:border-border transition-all ${isOverdue ? "border-l-4 border-l-destructive" : "border-border/60"}`}
                  >
                    <div className="flex-1 min-w-0" onClick={() => navigate("/tasks")} style={{ cursor: "pointer" }}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority] || ""}`}>
                          {task.priority === "urgent" ? "⚡" : task.priority === "high" ? "↑" : ""} {task.priority}
                        </span>
                        <span className="text-sm font-semibold text-foreground truncate">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {cl && (
                          <>
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getClientColor(cl) }} />
                            <span className="text-xs text-foreground-secondary">{cl}</span>
                          </>
                        )}
                        {task.due_date && (
                          <span className={`text-xs ${isOverdue ? "text-destructive font-semibold" : "text-foreground-muted"}`}>
                            · {new Date(task.due_date).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.client_id && (
                      <button
                        onClick={() => openTimerForTask(task.id, task.client_id!)}
                        className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium text-foreground-secondary hover:text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Zap className="h-3.5 w-3.5" /> Iniciar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team (1/3) — admin only */}
        {isAdmin && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-foreground-secondary" /> Equipo ahora
              </h2>
              <Link to="/hub" className="text-sm text-foreground-secondary hover:text-foreground transition-colors flex items-center gap-1">
                Ver Hub <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              {members.filter(m => m.user_id !== user?.id).length === 0 ? (
                <p className="text-sm text-foreground-muted text-center py-4">Sin miembros activos</p>
              ) : (
                members.filter(m => m.user_id !== user?.id).map(m => {
                  const p = profiles[m.user_id];
                  const name = p?.name || "Usuario";
                  const statusColor = m.status === "working" ? "bg-success" : m.status === "online" ? "bg-accent" : "bg-foreground-muted";
                  return (
                    <div key={m.user_id} className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-background"
                          style={{ backgroundColor: getClientColor(name) }}
                        >
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${statusColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <p className="text-xs text-foreground-muted truncate">
                          {m.status === "working" && m.current_client ? m.current_client : m.status === "working" ? "Trabajando" : m.status === "online" ? "Disponible" : "Offline"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Financial summary — admin only */}
      {isAdmin && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-foreground-secondary" /> Finanzas
            </h2>
            <Link to="/finances" className="text-sm text-foreground-secondary hover:text-foreground transition-colors flex items-center gap-1">
              Ver Finanzas <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-foreground-muted" />
                <p className="text-xs text-foreground-muted">MRR</p>
              </div>
              <p className="text-xl font-bold text-foreground">${mrr.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-foreground-muted" />
                <p className="text-xs text-foreground-muted">Cobrado este mes</p>
              </div>
              <p className="text-xl font-bold text-foreground">${collectedThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            {payments.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-foreground-muted mb-2">Últimos pagos</p>
                <div className="space-y-2">
                  {payments.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground-secondary truncate">
                        {clientMap[p.client_id] || "—"} · {new Date(p.date_received + "T00:00:00").toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                      </span>
                      <span className="font-semibold text-foreground">${p.amount_received.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
