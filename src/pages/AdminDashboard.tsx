import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, DollarSign, CheckSquare, Activity, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Task = Tables<"tasks">;

interface PresenceRow {
  user_id: string;
  status: string;
  last_seen_at: string;
}

interface ConnectionDay {
  date: string;
  user_id: string;
  minutes: number;
}

export default function AdminDashboard() {
  const { isAdmin, loading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [presence, setPresence] = useState<PresenceRow[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (roleLoading || !isAdmin) return;
    const load = async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const [profilesRes, presenceRes, entriesRes, clientsRes, invoicesRes, tasksRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("member_presence").select("user_id, status, last_seen_at"),
        supabase.from("time_entries").select("user_id, started_at, ended_at, duration_min, description").gte("started_at", ninetyDaysAgo).order("started_at", { ascending: false }),
        supabase.from("clients").select("id, name, monthly_rate, status, billing_type, currency"),
        supabase.from("invoices").select("id, amount, currency, status, due_date, client_id"),
        supabase.from("tasks").select("*"),
      ]);
      setProfiles((profilesRes.data || []) as Profile[]);
      setPresence((presenceRes.data || []) as PresenceRow[]);
      setTimeEntries(entriesRes.data || []);
      setClients(clientsRes.data || []);
      setInvoices(invoicesRes.data || []);
      setTasks((tasksRes.data || []) as Task[]);
      setLoading(false);
    };
    load();
  }, [isAdmin, roleLoading]);

  // Finance KPIs
  const mrr = useMemo(() => {
    return clients
      .filter((c: any) => c.status === "active" && c.billing_type === "monthly")
      .reduce((sum: number, c: any) => sum + (Number(c.monthly_rate) || 0), 0);
  }, [clients]);

  const accountsReceivable = useMemo(() => {
    return invoices
      .filter((i: any) => i.status === "sent" || i.status === "overdue")
      .reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);
  }, [invoices]);

  const overdueInvoices = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return invoices.filter((i: any) => i.status === "sent" && i.due_date && i.due_date < today);
  }, [invoices]);

  // Task KPIs
  const today = new Date().toISOString().split("T")[0];
  const overdueTasks = useMemo(() => tasks.filter(t => t.due_date && t.due_date < today && t.status !== "done"), [tasks, today]);
  const staleTasks = useMemo(() => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    return tasks.filter(t => t.status !== "done" && t.updated_at < fourteenDaysAgo);
  }, [tasks]);
  const tasksByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return counts;
  }, [tasks]);

  // Connection history: daily hours per user (last 90 days)
  const connectionData = useMemo(() => {
    const byUserByDay: Record<string, Record<string, number>> = {};
    timeEntries.forEach((e: any) => {
      if (!e.ended_at) return;
      const day = e.started_at.split("T")[0];
      const mins = e.duration_min ?? (new Date(e.ended_at).getTime() - new Date(e.started_at).getTime()) / 60000;
      if (!byUserByDay[e.user_id]) byUserByDay[e.user_id] = {};
      byUserByDay[e.user_id][day] = (byUserByDay[e.user_id][day] || 0) + mins;
    });
    return byUserByDay;
  }, [timeEntries]);

  // Chart: weekly total hours (last 12 weeks)
  const weeklyChart = useMemo(() => {
    const weeks: Record<string, number> = {};
    timeEntries.forEach((e: any) => {
      if (!e.ended_at) return;
      const d = new Date(e.started_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split("T")[0];
      const mins = e.duration_min ?? (new Date(e.ended_at).getTime() - new Date(e.started_at).getTime()) / 60000;
      weeks[key] = (weeks[key] || 0) + mins;
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, mins]) => ({ week: week.slice(5), hours: Math.round(mins / 60 * 10) / 10 }));
  }, [timeEntries]);

  // Per-user stats for the connection table
  const userStats = useMemo(() => {
    return profiles.map(p => {
      const userEntries = timeEntries.filter((e: any) => e.user_id === p.id && e.ended_at);
      const totalMins = userEntries.reduce((sum: number, e: any) => {
        const mins = e.duration_min ?? (new Date(e.ended_at).getTime() - new Date(e.started_at).getTime()) / 60000;
        return sum + mins;
      }, 0);
      const daysActive = new Set(userEntries.map((e: any) => e.started_at.split("T")[0])).size;
      const pres = presence.find(pr => pr.user_id === p.id);
      const userTasks = tasks.filter(t => t.assignee_id === p.id);
      const doneTasks = userTasks.filter(t => t.status === "done").length;
      const pendingTasks = userTasks.filter(t => t.status !== "done").length;

      return {
        id: p.id,
        name: p.name || p.email?.split("@")[0] || "—",
        role: p.role,
        lastSeen: pres?.last_seen_at,
        status: pres?.status || "offline",
        totalHours: Math.round(totalMins / 60 * 10) / 10,
        daysActive,
        avgHoursPerDay: daysActive > 0 ? Math.round((totalMins / 60 / daysActive) * 10) / 10 : 0,
        doneTasks,
        pendingTasks,
      };
    });
  }, [profiles, timeEntries, presence, tasks]);

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/timer" replace />;

  const statusLabel: Record<string, string> = {
    backlog: "Backlog", todo: "To do", in_progress: "In progress", review: "Review", done: "Done",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Panel de Administración</h1>
        <p className="text-sm text-foreground-muted mt-1">Vista general de la agencia — últimos 90 días</p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-foreground-muted mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">MRR</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${mrr.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-foreground-muted mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Por cobrar</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${accountsReceivable.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-foreground-muted mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">MRR + Cobrar</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${(mrr + accountsReceivable).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-foreground-muted mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Miembros</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Equipo</TabsTrigger>
          <TabsTrigger value="finances" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Finanzas</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5"><CheckSquare className="h-3.5 w-3.5" /> Tareas</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Actividad</TabsTrigger>
        </TabsList>

        {/* TEAM TAB */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conexión de miembros — últimos 90 días</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última vez</TableHead>
                    <TableHead className="text-right">Horas totales</TableHead>
                    <TableHead className="text-right">Días activos</TableHead>
                    <TableHead className="text-right">Prom h/día</TableHead>
                    <TableHead className="text-right">Tareas hechas</TableHead>
                    <TableHead className="text-right">Pendientes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userStats.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${u.status === "offline" ? "bg-foreground-muted" : u.status === "working" ? "bg-success" : "bg-primary"}`} />
                          <span className="text-xs">{u.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-foreground-muted">
                        {u.lastSeen ? new Date(u.lastSeen).toLocaleString("es-MX", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.totalHours}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.daysActive}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.avgHoursPerDay}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.doneTasks}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.pendingTasks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FINANCES TAB */}
        <TabsContent value="finances" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted mb-1">MRR</p>
                <p className="text-2xl font-bold">${mrr.toLocaleString()}</p>
                <p className="text-xs text-foreground-muted mt-1">{clients.filter((c: any) => c.status === "active" && c.billing_type === "monthly").length} clientes activos con retainer</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted mb-1">Cuentas por cobrar</p>
                <p className="text-2xl font-bold">${accountsReceivable.toLocaleString()}</p>
                <p className="text-xs text-foreground-muted mt-1">{invoices.filter((i: any) => i.status === "sent" || i.status === "overdue").length} facturas pendientes</p>
              </CardContent>
            </Card>
            <Card className="bg-accent/10 border-accent/30">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted mb-1">Total esperado</p>
                <p className="text-2xl font-bold text-accent">${(mrr + accountsReceivable).toLocaleString()}</p>
                <p className="text-xs text-foreground-muted mt-1">MRR + cuentas por cobrar</p>
              </CardContent>
            </Card>
          </div>

          {overdueInvoices.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Facturas vencidas ({overdueInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Vencimiento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueInvoices.map((inv: any) => {
                      const client = clients.find((c: any) => c.id === inv.client_id);
                      return (
                        <TableRow key={inv.id}>
                          <TableCell>{client?.name || "—"}</TableCell>
                          <TableCell className="font-mono">${Number(inv.amount).toLocaleString()} {inv.currency}</TableCell>
                          <TableCell className="text-destructive text-sm">{inv.due_date}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(["backlog", "todo", "in_progress", "review", "done"] as const).map(s => (
              <Card key={s}>
                <CardContent className="pt-3 pb-2 px-4 text-center">
                  <p className="text-xs text-foreground-muted uppercase tracking-wider">{statusLabel[s]}</p>
                  <p className="text-2xl font-bold mt-1">{tasksByStatus[s] || 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Vencidas ({overdueTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overdueTasks.length === 0 ? (
                  <p className="text-sm text-foreground-muted">No hay tareas vencidas 🎉</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {overdueTasks.map(t => {
                      const assignee = profiles.find(p => p.id === t.assignee_id);
                      return (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-destructive/5 border border-destructive/20">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{t.title}</p>
                            <p className="text-xs text-foreground-muted">{assignee?.name || "Sin asignar"} · Venció {t.due_date}</p>
                          </div>
                          <Badge variant="destructive" className="text-[10px] shrink-0">{t.status.replace("_", " ")}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" /> Estancadas +14 días ({staleTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staleTasks.length === 0 ? (
                  <p className="text-sm text-foreground-muted">Todo se mueve bien 👍</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {staleTasks.map(t => {
                      const assignee = profiles.find(p => p.id === t.assignee_id);
                      const daysSince = Math.floor((Date.now() - new Date(t.updated_at).getTime()) / 86400000);
                      return (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{t.title}</p>
                            <p className="text-xs text-foreground-muted">{assignee?.name || "Sin asignar"} · {daysSince}d sin cambios</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">{t.status.replace("_", " ")}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Horas registradas por semana</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={weeklyChart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} className="fill-foreground-muted" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-foreground-muted" />
                    <Tooltip formatter={(v: number) => [`${v}h`, "Horas"]} />
                    <Bar dataKey="hours" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-foreground-muted">No hay datos de actividad aún.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3 px-4 text-center">
                <p className="text-xs text-foreground-muted uppercase tracking-wider">Entradas de tiempo</p>
                <p className="text-2xl font-bold mt-1">{timeEntries.length}</p>
                <p className="text-xs text-foreground-muted">últimos 90 días</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4 text-center">
                <p className="text-xs text-foreground-muted uppercase tracking-wider">Clientes activos</p>
                <p className="text-2xl font-bold mt-1">{clients.filter((c: any) => c.status === "active").length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4 text-center">
                <p className="text-xs text-foreground-muted uppercase tracking-wider">Total tareas</p>
                <p className="text-2xl font-bold mt-1">{tasks.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4 text-center">
                <p className="text-xs text-foreground-muted uppercase tracking-wider">Tareas completadas</p>
                <p className="text-2xl font-bold mt-1">{tasksByStatus["done"] || 0}</p>
                <p className="text-xs text-foreground-muted">{tasks.length > 0 ? Math.round(((tasksByStatus["done"] || 0) / tasks.length) * 100) : 0}% del total</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
