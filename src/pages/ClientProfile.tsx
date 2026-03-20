import { useState, useEffect, useCallback } from "react";
import { NewInvoiceModal } from "@/components/NewInvoiceModal";
import { LogPaymentModal } from "@/components/LogPaymentModal";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, X, AlertTriangle, Loader2, Eye, EyeOff, Copy, Key, CheckSquare } from "lucide-react";
import { getClientColor, formatDuration, formatTime } from "@/lib/timer-utils";
import {
  calculateCompleteness,
  getMissingFields,
  getCompletenessLevel,
} from "@/lib/clientCompleteness";
import { AiFieldHelper } from "@/components/AiFieldHelper";
import { RateBreakdown } from "@/components/RateBreakdown";
import { toast } from "sonner";

interface ClientFull {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  contact_name: string | null;
  billing_entity: string | null;
  monthly_rate: number | null;
  currency: string;
  status: string;
  notes: string | null;
  payment_method: string | null;
  payment_frequency: string | null;
  communication_channel: string | null;
  completeness_score: number | null;
}

interface TimeEntryRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_min: number | null;
  description: string | null;
  task_id: string | null;
  user_id: string;
}

interface ProfileInfo { id: string; name: string | null; }

interface InteractionRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  happened_at: string;
  user_id: string;
}

interface CredentialRow {
  id: string;
  service: string;
  url: string | null;
  username: string | null;
  password: string | null;
  notes: string | null;
  created_at: string;
}

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [client, setClient] = useState<ClientFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntryRow[]>([]);
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [credentials, setCredentials] = useState<CredentialRow[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, ProfileInfo>>({});
  const [timeFilter, setTimeFilter] = useState<"mine" | "all">(isAdmin ? "all" : "mine");
  const [stats, setStats] = useState({ weekHours: 0, monthHours: 0, totalHours: 0 });

  const fetchClient = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();
    setClient(data as ClientFull | null);
    setLoading(false);
  }, [id]);

  const fetchTimeEntries = useCallback(async () => {
    if (!id) return;
    let query = supabase
      .from("time_entries")
      .select("id, started_at, ended_at, duration_min, description, task_id, user_id")
      .eq("client_id", id)
      .order("started_at", { ascending: false })
      .limit(100);
    if (timeFilter === "mine" && user) {
      query = query.eq("user_id", user.id);
    }
    const { data } = await query;
    setTimeEntries((data as TimeEntryRow[]) || []);

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let weekMin = 0, monthMin = 0, totalMin = 0;
    (data || []).forEach((e: TimeEntryRow) => {
      const min = e.duration_min || 0;
      totalMin += min;
      const d = new Date(e.started_at);
      if (d >= weekStart) weekMin += min;
      if (d >= monthStart) monthMin += min;
    });
    setStats({
      weekHours: Math.round((weekMin / 60) * 10) / 10,
      monthHours: Math.round((monthMin / 60) * 10) / 10,
      totalHours: Math.round((totalMin / 60) * 10) / 10,
    });
  }, [id, user, timeFilter]);

  const fetchInteractions = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("client_interactions")
      .select("*")
      .eq("client_id", id)
      .order("happened_at", { ascending: false });
    setInteractions((data as InteractionRow[]) || []);
  }, [id]);

  const fetchCredentials = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("client_credentials")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });
    setCredentials((data as CredentialRow[]) || []);
  }, [id]);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("id, name");
    const map: Record<string, ProfileInfo> = {};
    ((data || []) as ProfileInfo[]).forEach((p) => { map[p.id] = p; });
    setProfileMap(map);
  }, []);

  useEffect(() => {
    fetchClient();
    fetchTimeEntries();
    fetchInteractions();
    fetchCredentials();
    fetchProfiles();
  }, [fetchClient, fetchTimeEntries, fetchInteractions, fetchCredentials, fetchProfiles]);

  if (loading) return <div className="flex items-center justify-center py-16 text-foreground-muted text-sm">Cargando...</div>;
  if (!client) return <div className="flex items-center justify-center py-16 text-foreground-muted text-sm">Cliente no encontrado.</div>;

  const score = client.completeness_score ?? 0;
  const level = getCompletenessLevel(score);
  const missing = getMissingFields({
    name: client.name,
    email: client.email,
    phone: client.phone,
    monthly_rate: client.monthly_rate,
    contact_name: client.contact_name,
    payment_method: client.payment_method,
    communication_channel: client.communication_channel,
    billing_entity: client.billing_entity,
  });
  const color = getClientColor(client.name);
  const initials = client.name.slice(0, 2).toUpperCase();

  const freqLabel: Record<string, string> = { monthly: "/mes", biweekly: "/qna", weekly: "/sem", project: "/proy" };

  return (
    <div>
      <button onClick={() => navigate("/clients")} className="flex items-center gap-1.5 text-sm text-foreground-secondary hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Clientes
      </button>

      <div className={`flex flex-col ${tab === "overview" ? "lg:flex-row" : ""} gap-6`}>
        {/* Left column */}
        <div className="flex-1 min-w-0">
          {score < 80 && (
            <div className={`mb-6 border rounded-lg p-4 ${level === "critical" ? "bg-destructive-light border-destructive" : "bg-accent-light border-accent"}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${level === "critical" ? "text-destructive" : "text-accent"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {level === "critical" ? "Este cliente tiene información incompleta" : "Completa el perfil del cliente para activar el seguimiento completo"}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {missing.map((m) => (
                      <span key={m} className="inline-flex items-center gap-1 bg-background border border-border rounded-pill px-2.5 py-0.5 text-small">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <Button variant="accent" size="sm" onClick={() => setEditOpen(true)}>
                  Completar perfil →
                </Button>
              </div>
            </div>
          )}

          {/* Client header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-background"
                style={{ backgroundColor: color }}
              >
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-h1 text-foreground">{client.name}</h1>
                  <span className={`text-micro px-2 py-0.5 rounded-pill ${client.status === "active" ? "bg-success-light text-success" : "bg-background-tertiary text-foreground-muted"}`}>
                    {client.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-foreground-secondary mt-1 flex-wrap">
                  {client.contact_name && <span>{client.contact_name}</span>}
                  {client.contact_name && client.email && <span>·</span>}
                  {client.email && <span>{client.email}</span>}
                  {client.phone && <span>· {client.phone}</span>}
                </div>
                <div className="flex items-center gap-3 text-small text-foreground-muted mt-1">
                  {client.communication_channel && <span>📱 {client.communication_channel}</span>}
                  {client.billing_entity && client.billing_entity !== client.name && <span>💰 via {client.billing_entity}</span>}
                </div>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto gap-4 flex-wrap">
              {[
                { key: "overview", label: "Resumen" },
                { key: "time", label: "Tiempo" },
                { key: "tasks", label: "Tareas" },
                { key: "credentials", label: "Credenciales" },
                { key: "interactions", label: "Interacciones" },
                ...(isAdmin ? [{ key: "finances", label: "Finanzas" }] : []),
              ].map((t) => (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 pt-0 text-sm"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {isAdmin && (
                  <div className="border border-border rounded-lg p-5">
                    <p className="text-micro text-foreground-muted mb-2">Tarifa</p>
                    {client.monthly_rate ? (
                      <>
                        <p className="text-h2 text-foreground">${client.monthly_rate.toLocaleString()}{freqLabel[client.payment_frequency || "monthly"]}</p>
                        <RateBreakdown monthlyRate={client.monthly_rate} paymentFrequency={client.payment_frequency || "monthly"} currency={client.currency} />
                      </>
                    ) : (
                      <p className="text-sm text-foreground-muted">Sin definir</p>
                    )}
                    {client.payment_method && <p className="text-small text-foreground-secondary mt-1">via {client.payment_method}</p>}
                  </div>
                )}
                <div className="border border-border rounded-lg p-5">
                  <p className="text-micro text-foreground-muted mb-2">Este mes</p>
                  <p className="text-h2 text-foreground">{stats.monthHours}h</p>
                  {isAdmin && client.monthly_rate && stats.monthHours > 0 && (
                    <p className="text-small text-foreground-secondary mt-1">
                      ~${Math.round(client.monthly_rate / stats.monthHours)}/hr effective
                    </p>
                  )}
                </div>
              </div>
              {client.notes && (
                <div className="border border-border rounded-lg p-5">
                  <p className="text-micro text-foreground-muted mb-2">Notas</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="time" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-foreground-secondary">Esta semana: <strong className="text-foreground">{stats.weekHours}h</strong></span>
                  <span className="text-sm text-foreground-secondary">Este mes: <strong className="text-foreground">{stats.monthHours}h</strong></span>
                </div>
                <div className="inline-flex rounded-lg bg-background-secondary p-1">
                  {(["mine", "all"] as const).map((f) => (
                    <button key={f} onClick={() => setTimeFilter(f)} className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${timeFilter === f ? "bg-foreground text-background" : "text-foreground-secondary hover:text-foreground"}`}>
                      {f === "mine" ? "Mis registros" : "Todos"}
                    </button>
                  ))}
                </div>
              </div>
              {timeEntries.length === 0 ? (
                <p className="text-sm text-foreground-muted py-8 text-center">No time tracked for this client yet.</p>
              ) : (
                <div className="flex flex-col">
                  {timeEntries.map((e) => {
                    const start = new Date(e.started_at);
                    const end = e.ended_at ? new Date(e.ended_at) : null;
                    const loggerName = profileMap[e.user_id]?.name || "Unknown";
                    return (
                      <div key={e.id} className="flex items-center gap-3 py-3 border-b border-border">
                        <div className="w-[3px] h-8 rounded-full" style={{ backgroundColor: color }} />
                        {timeFilter === "all" && (
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-background shrink-0"
                            style={{ backgroundColor: getClientColor(loggerName) }}
                            title={loggerName}
                          >
                            {loggerName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{e.description || "No description"}</p>
                          <p className="text-small text-foreground-muted">
                            {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {timeFilter === "all" && <span> · {loggerName}</span>}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-small text-foreground-secondary">
                            {formatTime(start)}{end ? ` – ${formatTime(end)}` : " – running"}
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {e.duration_min ? formatDuration(e.duration_min) : "—"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <ClientTasksTab clientId={client.id} clientName={client.name} />
            </TabsContent>

            <TabsContent value="credentials" className="mt-6">
              <CredentialsTab clientId={client.id} credentials={credentials} onRefresh={fetchCredentials} />
            </TabsContent>

            <TabsContent value="interactions" className="mt-6">
              <InteractionsTab clientId={client.id} interactions={interactions} onRefresh={fetchInteractions} />
            </TabsContent>

            <TabsContent value="finances" className="mt-6">
              <ClientFinancesTab clientId={client.id} clientName={client.name} monthlyRate={client.monthly_rate} currency={client.currency} monthHours={stats.monthHours} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column - only in Overview */}
        {tab === "overview" && (
          <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4">
            <div className="border border-border rounded-lg p-5">
              <p className="text-micro text-foreground-muted mb-3">Quick stats</p>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-h2 text-foreground">{stats.weekHours}h</p>
                  <p className="text-small text-foreground-secondary">This week</p>
                </div>
                <div>
                  <p className="text-h2 text-foreground">{stats.monthHours}h</p>
                  <p className="text-small text-foreground-secondary">This month</p>
                </div>
                <div>
                  <p className="text-h2 text-foreground">{stats.totalHours}h</p>
                  <p className="text-small text-foreground-secondary">All time</p>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg p-5">
              <p className="text-micro text-foreground-muted mb-3">Contact</p>
              <div className="flex flex-col gap-2 text-sm">
                {client.contact_name && <p><span className="text-foreground-secondary">Contact:</span> {client.contact_name}</p>}
                {client.email && <p><span className="text-foreground-secondary">Email:</span> {client.email}</p>}
                {client.phone && <p><span className="text-foreground-secondary">Phone:</span> {client.phone}</p>}
                {client.website && <p><span className="text-foreground-secondary">Web:</span> <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{client.website}</a></p>}
                {client.communication_channel && <p><span className="text-foreground-secondary">Channel:</span> {client.communication_channel}</p>}
              </div>
            </div>

            {isAdmin && (
              <div className="border border-border rounded-lg p-5">
                <p className="text-micro text-foreground-muted mb-3">Payment</p>
                <div className="flex flex-col gap-2 text-sm">
                  <p><span className="text-foreground-secondary">Rate:</span> {client.monthly_rate ? `$${client.monthly_rate.toLocaleString()}` : "—"}</p>
                  <p><span className="text-foreground-secondary">Frequency:</span> {client.payment_frequency || "monthly"}</p>
                  <p><span className="text-foreground-secondary">Method:</span> {client.payment_method || "—"}</p>
                  {client.billing_entity && <p><span className="text-foreground-secondary">Billed by:</span> {client.billing_entity}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editOpen && <EditClientPanel client={client} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); fetchClient(); }} />}
    </div>
  );
}

/* ─── Client Finances Tab ─── */
function ClientFinancesTab({ clientId, clientName, monthlyRate, currency, monthHours }: { clientId: string; clientName: string; monthlyRate: number | null; currency: string; monthHours: number }) {
  const [invoices, setInvoices] = useState<{ id: string; number: string; amount: number; currency: string; status: string; due_date: string | null; paid_at: string | null; period_start: string | null; period_end: string | null; notes: string | null; created_at: string }[]>([]);
  const [expenses, setExpenses] = useState<{ id: string; category: string; description: string | null; amount: number; currency: string; date: string }[]>([]);
  const [payments, setPayments] = useState<{ id: string; amount_received: number; currency_received: string; date_received: string; sender_name: string | null; reference: string | null; bank_amount: number | null; bank_currency: string | null; exchange_rate: number | null }[]>([]);
  const [newInvOpen, setNewInvOpen] = useState(false);
  const [newPayOpen, setNewPayOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const [invRes, expRes, payRes] = await Promise.all([
      supabase.from("invoices").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").eq("client_id", clientId).order("date", { ascending: false }),
      supabase.from("payments").select("*").eq("client_id", clientId).order("date_received", { ascending: false }),
    ]);
    setInvoices((invRes.data || []) as typeof invoices);
    setExpenses((expRes.data || []) as typeof expenses);
    setPayments((payRes.data || []) as typeof payments);
  }, [clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const outstanding = totalInvoiced - totalPaid;
  const effectiveRate = monthlyRate && monthHours > 0 ? Math.round(monthlyRate / monthHours) : null;

  // Payment totals by currency
  const totalReceivedUSD = payments.filter(p => p.currency_received === "USD").reduce((s, p) => s + p.amount_received, 0);
  const totalReceivedMXN = payments.reduce((s, p) => {
    if (p.bank_currency === "MXN" && p.bank_amount) return s + p.bank_amount;
    if (p.currency_received === "MXN") return s + p.amount_received;
    return s;
  }, 0);

  const STATUS_BADGE: Record<string, string> = {
    draft: "bg-background-tertiary text-foreground-secondary",
    sent: "bg-accent-light text-accent-foreground",
    paid: "bg-success-light text-success",
    overdue: "bg-destructive-light text-destructive",
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="border border-border rounded-lg p-4">
          <p className="text-micro text-foreground-muted mb-1">Total invoiced</p>
          <p className="text-h2 text-foreground">${totalInvoiced.toLocaleString()}</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-micro text-foreground-muted mb-1">Outstanding</p>
          <p className={`text-h2 ${outstanding > 0 ? "text-destructive" : "text-foreground"}`}>${outstanding.toLocaleString()}</p>
        </div>
        {effectiveRate && (
          <div className="border border-border rounded-lg p-4">
            <p className="text-micro text-foreground-muted mb-1">Effective $/hr</p>
            <p className="text-h2 text-foreground">${effectiveRate}</p>
            <p className="text-small text-foreground-muted">{monthHours}h this month</p>
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-h3 text-foreground">Invoices</h3>
        <Button variant="secondary" size="sm" onClick={() => setNewInvOpen(true)}>
          + New invoice for {clientName}
        </Button>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-foreground-muted py-6 text-center">No invoices for this client yet.</p>
      ) : (
        <div className="flex flex-col mb-6">
          {invoices.map((inv) => {
            const isOD = inv.status === "overdue" || (inv.status === "sent" && inv.due_date && new Date(inv.due_date) < todayDate);
            const ds = isOD ? "overdue" : inv.status;
            return (
              <div key={inv.id} className="flex items-center gap-3 py-3 border-b border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{inv.number}</p>
                  {inv.period_start && inv.period_end && (
                    <p className="text-small text-foreground-muted">
                      {new Date(inv.period_start + "T00:00:00").toLocaleDateString("en-US", { month: "short" })} – {new Date(inv.period_end + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[ds] || ""}`}>{ds}</span>
                <p className="text-sm font-semibold text-foreground shrink-0">{inv.currency} ${inv.amount.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Payments received */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-h3 text-foreground">Payments received</h3>
        <Button variant="secondary" size="sm" onClick={() => setNewPayOpen(true)}>
          + Log payment for {clientName}
        </Button>
      </div>

      {payments.length > 0 && (
        <div className="border border-border rounded-lg p-3 mb-3 text-sm text-foreground-secondary">
          Total received: {totalReceivedUSD > 0 && <span className="font-medium text-foreground">${totalReceivedUSD.toLocaleString()} USD</span>}
          {totalReceivedUSD > 0 && totalReceivedMXN > 0 && " · "}
          {totalReceivedMXN > 0 && <span className="font-medium text-foreground">${totalReceivedMXN.toLocaleString()} MXN</span>}
        </div>
      )}

      {payments.length === 0 ? (
        <p className="text-sm text-foreground-muted py-6 text-center mb-6">No payments recorded for this client yet.</p>
      ) : (
        <div className="flex flex-col mb-6">
          {payments.slice(0, 10).map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-3 border-b border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{p.sender_name || "Payment"}</p>
                <p className="text-small text-foreground-muted">
                  {new Date(p.date_received + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {p.reference && ` · ${p.reference}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">${p.amount_received.toLocaleString(undefined, { minimumFractionDigits: 2 })} {p.currency_received}</p>
                {p.bank_amount && p.bank_currency && (
                  <p className="text-small text-foreground-muted">≈ ${p.bank_amount.toLocaleString()} {p.bank_currency}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {expenses.length > 0 && (
        <>
          <h3 className="text-h3 text-foreground mb-3">Linked expenses</h3>
          <div className="flex flex-col">
            {expenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-3 py-3 border-b border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{exp.category}</p>
                  <p className="text-small text-foreground-muted">{exp.description || "—"}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{exp.currency} ${exp.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {newInvOpen && (
        <NewInvoiceModal open={newInvOpen} onOpenChange={setNewInvOpen} onCreated={fetchData} prefillClientId={clientId} />
      )}
      {newPayOpen && (
        <LogPaymentModal open={newPayOpen} onOpenChange={setNewPayOpen} onCreated={fetchData} prefillClientId={clientId} />
      )}
    </div>
  );
}


/* ─── Client Tasks Tab ─── */
function ClientTasksTab({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [tasks, setTasks] = useState<{ id: string; title: string; status: string; priority: string; due_date: string | null; description: string | null }[]>([]);
  const [filter, setFilter] = useState<"active" | "done" | "all">("active");
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase.from("tasks").select("id, title, status, priority, due_date, description")
      .eq("client_id", clientId).order("created_at", { ascending: false });
    setTasks(data || []);
  }, [clientId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filtered = tasks.filter((t) => {
    if (filter === "done") return t.status === "done";
    if (filter === "active") return t.status !== "done";
    return true;
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isOverdue = (t: { due_date: string | null; status: string }) =>
    t.due_date && new Date(t.due_date) < today && t.status !== "done";

  const STATUS_COLORS: Record<string, string> = {
    backlog: "border-foreground-muted border-dashed",
    todo: "border-foreground-secondary",
    in_progress: "border-accent",
    review: "border-foreground-secondary",
    done: "border-success bg-success",
  };

  const STATUSES_ORDER = ["backlog", "todo", "in_progress", "review", "done"];
  const cycleStatus = async (task: typeof tasks[0]) => {
    const idx = STATUSES_ORDER.indexOf(task.status);
    const next = STATUSES_ORDER[(idx + 1) % STATUSES_ORDER.length];
    await supabase.from("tasks").update({ status: next as "backlog" | "todo" | "in_progress" | "review" | "done" }).eq("id", task.id);
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {(["active", "done", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "border border-border text-foreground-secondary hover:bg-background-secondary"
              }`}
            >
              {f === "active" ? "Active" : f === "done" ? "Done" : "All"}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={() => setNewTaskOpen(true)}>
          + New task for {clientName}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CheckSquare className="h-8 w-8 text-border mb-3" />
          <p className="text-sm text-foreground-muted">No tasks for this client yet</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setNewTaskOpen(true)}>
            + New task
          </Button>
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((task) => {
            const overdue = isOverdue(task);
            const isDone = task.status === "done";
            return (
              <div key={task.id} className="flex items-center gap-3 py-3 border-b border-border">
                <button
                  onClick={() => cycleStatus(task)}
                  className={`h-6 w-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${STATUS_COLORS[task.status] || ""}`}
                >
                  {task.status === "in_progress" && <div className="h-2 w-2 rounded-full bg-accent" />}
                  {task.status === "review" && <div className="h-2 w-2 rounded-full bg-foreground-secondary" />}
                  {task.status === "done" && (
                    <svg className="h-3 w-3 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${isDone ? "line-through opacity-50" : "text-foreground"}`}>{task.title}</span>
                  {overdue && <span className="ml-2 text-[11px] font-medium bg-destructive-light text-destructive px-2 py-0.5 rounded-full">Overdue</span>}
                </div>
                {(task.priority === "urgent" || task.priority === "high") && (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    task.priority === "urgent" ? "bg-destructive-light text-destructive" : "bg-accent-light text-accent-foreground"
                  }`}>
                    {task.priority === "urgent" ? "⚡ Urgent" : "↑ High"}
                  </span>
                )}
                {task.due_date && (
                  <span className={`text-small ${overdue ? "text-destructive" : "text-foreground-muted"}`}>
                    {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {newTaskOpen && (
        <NewTaskModalInline clientId={clientId} onClose={() => setNewTaskOpen(false)} onCreated={() => { setNewTaskOpen(false); fetchTasks(); }} />
      )}
    </div>
  );
}

/* Simple inline new task for client profile — uses Dialog */
function NewTaskModalInline({ clientId, onClose, onCreated }: { clientId: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await supabase.from("tasks").insert({ title: title.trim(), client_id: clientId, status: "todo" as const, priority: "medium" as const });
    setSaving(false);
    onCreated();
  };

  return (
    <div className="border border-border rounded-lg p-4 mt-4 flex gap-3 items-end">
      <div className="flex-1">
        <label className="text-label mb-1 block">Task title</label>
        <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" onKeyDown={(e) => e.key === "Enter" && handleSave()} />
      </div>
      <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
      </Button>
      <Button size="sm" variant="secondary" onClick={onClose}>Cancel</Button>
    </div>
  );
}


function CredentialsTab({ clientId, credentials, onRefresh }: { clientId: string; credentials: CredentialRow[]; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ service: "", url: "", username: "", password: "", notes: "" });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) =>
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));

  const copyPassword = async (pw: string) => {
    await navigator.clipboard.writeText(pw);
    toast.success("Password copied!");
  };

  const handleSave = async () => {
    if (!form.service.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("client_credentials").insert([{
      client_id: clientId,
      service: form.service.trim(),
      url: form.url || null,
      username: form.username || null,
      password: form.password || null,
      notes: form.notes || null,
    }] as never);
    setSaving(false);
    if (error) {
      toast.error("Failed to save credential");
      return;
    }
    setAdding(false);
    setForm({ service: "", url: "", username: "", password: "", notes: "" });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("client_credentials").delete().eq("id", id);
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-foreground">Access & Credentials</h3>
        <Button variant="secondary" size="sm" onClick={() => setAdding(!adding)}>
          + Add credential
        </Button>
      </div>

      {adding && (
        <div className="border border-border rounded-lg p-4 mb-4 flex flex-col gap-3">
          <Input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="Service (e.g. Slack, GitHub)" />
          <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL (optional)" />
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" />
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
          </div>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" rows={2} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.service.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {credentials.length === 0 && !adding ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Key className="h-8 w-8 text-border mb-3" />
          <p className="text-sm text-foreground-muted">No credentials saved yet</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setAdding(true)}>
            + Add credential
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {credentials.map((c) => (
            <div key={c.id} className="flex items-start gap-3 bg-background border border-border rounded-lg p-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-secondary text-sm font-semibold text-foreground-secondary">
                {c.service.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{c.service}</p>
                {c.username && <p className="text-small text-foreground-secondary">{c.username}</p>}
                {c.url && (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-small text-foreground-muted hover:text-accent truncate block">
                    {c.url}
                  </a>
                )}
                {c.notes && <p className="text-small text-foreground-muted mt-1">{c.notes}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {c.password && (
                  <>
                    <span className="text-sm text-foreground-secondary font-mono mr-1">
                      {visiblePasswords[c.id] ? c.password : "••••••••"}
                    </span>
                    <button onClick={() => togglePassword(c.id)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:text-foreground">
                      {visiblePasswords[c.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => copyPassword(c.password!)} className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Interactions Tab ─── */
function InteractionsTab({ clientId, interactions, onRefresh }: { clientId: string; interactions: InteractionRow[]; onRefresh: () => void }) {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "note", title: "", body: "" });

  const handleSave = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    await supabase.from("client_interactions").insert({
      client_id: clientId,
      user_id: user.id,
      type: form.type as "meeting" | "note" | "call" | "payment",
      title: form.title.trim(),
      body: form.body || null,
    });
    setSaving(false);
    setAdding(false);
    setForm({ type: "note", title: "", body: "" });
    onRefresh();
  };

  const typeEmoji: Record<string, string> = { meeting: "📅", note: "📝", call: "📞", payment: "💰" };

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={() => setAdding(!adding)} className="mb-4">
        + Add interaction
      </Button>

      {adding && (
        <div className="border border-border rounded-lg p-4 mb-4 flex flex-col gap-3">
          <div className="flex gap-3">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="note">Note</option>
              <option value="meeting">Meeting</option>
              <option value="call">Call</option>
              <option value="payment">Payment</option>
            </select>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="flex-1" />
          </div>
          <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Details (optional)" rows={2} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {interactions.length === 0 ? (
        <p className="text-sm text-foreground-muted py-8 text-center">No interactions recorded yet.</p>
      ) : (
        <div className="flex flex-col">
          {interactions.map((i) => (
            <div key={i.id} className="flex items-start gap-3 py-3 border-b border-border">
              <span className="text-lg">{typeEmoji[i.type] || "📝"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{i.title}</p>
                {i.body && <p className="text-small text-foreground-secondary mt-0.5 line-clamp-2">{i.body}</p>}
              </div>
              <span className="text-small text-foreground-muted shrink-0">
                {new Date(i.happened_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Edit Panel ─── */
function EditClientPanel({ client, onClose, onSaved }: { client: ClientFull; onClose: () => void; onSaved: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: client.name,
    contact_name: client.contact_name || "",
    email: client.email || "",
    phone: client.phone || "",
    website: client.website || "",
    billing_entity: client.billing_entity || "",
    monthly_rate: client.monthly_rate ? String(client.monthly_rate) : "",
    currency: client.currency || "USD",
    payment_frequency: client.payment_frequency || "monthly",
    payment_method: client.payment_method || "",
    communication_channel: client.communication_channel || "",
    notes: client.notes || "",
    status: client.status,
  });
  const [saving, setSaving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    const score = calculateCompleteness({
      ...form,
      monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
    });

    const { error } = await supabase
      .from("clients")
      .update({
        name: form.name.trim(),
        contact_name: form.contact_name || null,
        email: form.email || null,
        phone: form.phone || null,
        website: form.website || null,
        billing_entity: form.billing_entity || null,
        monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
        currency: form.currency || "USD",
        payment_method: form.payment_method || null,
        payment_frequency: form.payment_frequency || "monthly",
        communication_channel: form.communication_channel || null,
        notes: form.notes || null,
        status: form.status as "active" | "inactive",
        completeness_score: score,
      } as Record<string, unknown>)
      .eq("id", client.id);

    setSaving(false);
    if (error) {
      toast.error("No se pudo actualizar el cliente");
      return;
    }
    toast.success("Cliente actualizado");
    onSaved();
  };

  const handleArchive = async () => {
    setArchiving(true);
    // Unlink time entries, tasks, projects
    await supabase.from("time_entries").update({ client_id: null }).eq("client_id", client.id);
    await supabase.from("tasks").update({ client_id: null }).eq("client_id", client.id);
    // Delete projects (they are client-specific)
    await supabase.from("projects").delete().eq("client_id", client.id);
    // Delete the client
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    setArchiving(false);
    if (error) {
      // If delete fails (FK constraints), archive instead
      await supabase.from("clients").update({ status: "inactive" as const }).eq("id", client.id);
      toast.success("Cliente archivado");
    } else {
      toast.success("Cliente eliminado");
    }
    onClose();
    navigate("/clients");
  };

  const formContext = { ...form, monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : 0 };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/20" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[400px] bg-background border-l border-border overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 text-foreground">Editar cliente</h2>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-tertiary">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-label mb-1 block">Estado</label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
            <div>
              <label className="text-label mb-1 block">Nombre del cliente *</label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <label className="text-label mb-1 block">Nombre de contacto</label>
              <Input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
            </div>
            <div>
              <label className="text-label mb-1 block">Correo</label>
              <Input value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div>
              <label className="text-label mb-1 block">Teléfono</label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <label className="text-label mb-1 block">Sitio web</label>
              <Input value={form.website} onChange={(e) => update("website", e.target.value)} />
            </div>

            <div className="h-px bg-border" />

            <div>
              <label className="text-label mb-1 block">Entidad de facturación</label>
              <Input value={form.billing_entity} onChange={(e) => update("billing_entity", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="text-label">Tarifa mensual</label>
                  <AiFieldHelper
                    action="rate_context"
                    context={{ monthly_rate: formContext.monthly_rate, currency: form.currency, payment_frequency: form.payment_frequency }}
                    readOnly
                    label="Contexto de tarifa"
                  />
                </div>
                <Input type="number" value={form.monthly_rate} onChange={(e) => update("monthly_rate", e.target.value)} />
                <RateBreakdown monthlyRate={form.monthly_rate ? parseFloat(form.monthly_rate) : null} paymentFrequency={form.payment_frequency} currency={form.currency} />
              </div>
              <div>
                <label className="text-label mb-1 block">Moneda</label>
                <Input value={form.currency} onChange={(e) => update("currency", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Frecuencia</label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.payment_frequency} onChange={(e) => update("payment_frequency", e.target.value)}>
                  <option value="monthly">Mensual</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="weekly">Semanal</option>
                  <option value="project">Por proyecto</option>
                </select>
              </div>
              <div>
                <label className="text-label mb-1 block">Método</label>
                <Input value={form.payment_method} onChange={(e) => update("payment_method", e.target.value)} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-label">Canal</label>
                <AiFieldHelper
                  action="channel_tips"
                  context={{ communication_channel: form.communication_channel, name: form.name }}
                  label="Tips de canal"
                />
              </div>
              <Input value={form.communication_channel} onChange={(e) => update("communication_channel", e.target.value)} />
            </div>

            <div className="h-px bg-border" />

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-label">Notas</label>
                <AiFieldHelper
                  action="enrich_notes"
                  context={formContext}
                  onResult={(r) => update("notes", r)}
                  label="Enriquecer con IA"
                />
              </div>
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={4} />
            </div>

            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full h-11">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
            </Button>

            {/* Archive / Delete section */}
            <div className="border-t border-border pt-4 mt-2">
              {!showArchiveConfirm ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowArchiveConfirm(true)}
                >
                  Eliminar cliente
                </Button>
              ) : (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-3">
                  <p className="text-sm text-foreground">
                    ¿Eliminar <strong>{client.name}</strong>? Se desvincularán todos los registros de actividad, proyectos y tareas asociadas. Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={handleArchive}
                      disabled={archiving}
                    >
                      {archiving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sí, eliminar"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowArchiveConfirm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
