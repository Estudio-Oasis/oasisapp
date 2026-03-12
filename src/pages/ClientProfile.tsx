import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, X, AlertTriangle, Loader2 } from "lucide-react";
import { getClientColor, formatDuration, formatTime } from "@/lib/timer-utils";
import {
  calculateCompleteness,
  getMissingFields,
  getCompletenessLevel,
} from "@/lib/clientCompleteness";
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
}

interface InteractionRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  happened_at: string;
  user_id: string;
}

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState<ClientFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntryRow[]>([]);
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
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
    const { data } = await supabase
      .from("time_entries")
      .select("id, started_at, ended_at, duration_min, description, task_id")
      .eq("client_id", id)
      .order("started_at", { ascending: false })
      .limit(100);
    setTimeEntries((data as TimeEntryRow[]) || []);

    // Compute stats
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
  }, [id]);

  const fetchInteractions = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("client_interactions")
      .select("*")
      .eq("client_id", id)
      .order("happened_at", { ascending: false });
    setInteractions((data as InteractionRow[]) || []);
  }, [id]);

  useEffect(() => {
    fetchClient();
    fetchTimeEntries();
    fetchInteractions();
  }, [fetchClient, fetchTimeEntries, fetchInteractions]);

  if (loading) return <div className="flex items-center justify-center py-16 text-foreground-muted text-sm">Loading...</div>;
  if (!client) return <div className="flex items-center justify-center py-16 text-foreground-muted text-sm">Client not found.</div>;

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

  const freqLabel: Record<string, string> = { monthly: "/mo", biweekly: "/2wk", weekly: "/wk", project: "/proj" };

  return (
    <div>
      {/* Back nav */}
      <button onClick={() => navigate("/clients")} className="flex items-center gap-1.5 text-sm text-foreground-secondary hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Clients
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 min-w-0">
          {/* Completeness alert */}
          {score < 80 && (
            <div className={`mb-6 border rounded-lg p-4 ${level === "critical" ? "bg-destructive-light border-destructive" : "bg-accent-light border-accent"}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${level === "critical" ? "text-destructive" : "text-accent"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {level === "critical" ? "This client is missing critical information" : "Complete this client's profile to unlock full tracking"}
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
                  Complete profile →
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
              Edit
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto gap-4">
              {["Overview", "Time", "Tasks", "Interactions", "Finances"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t.toLowerCase()}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 pt-0 text-sm"
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="border border-border rounded-lg p-5">
                  <p className="text-micro text-foreground-muted mb-2">Rate</p>
                  {client.monthly_rate ? (
                    <p className="text-h2 text-foreground">${client.monthly_rate.toLocaleString()}{freqLabel[client.payment_frequency || "monthly"]}</p>
                  ) : (
                    <p className="text-sm text-foreground-muted">Not set</p>
                  )}
                  {client.payment_method && <p className="text-small text-foreground-secondary mt-1">via {client.payment_method}</p>}
                </div>
                <div className="border border-border rounded-lg p-5">
                  <p className="text-micro text-foreground-muted mb-2">This month</p>
                  <p className="text-h2 text-foreground">{stats.monthHours}h</p>
                  {client.monthly_rate && stats.monthHours > 0 && (
                    <p className="text-small text-foreground-secondary mt-1">
                      ~${Math.round(client.monthly_rate / stats.monthHours)}/hr effective
                    </p>
                  )}
                </div>
              </div>
              {client.notes && (
                <div className="border border-border rounded-lg p-5">
                  <p className="text-micro text-foreground-muted mb-2">Notes</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="time" className="mt-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm text-foreground-secondary">This week: <strong className="text-foreground">{stats.weekHours}h</strong></span>
                <span className="text-sm text-foreground-secondary">This month: <strong className="text-foreground">{stats.monthHours}h</strong></span>
              </div>
              {timeEntries.length === 0 ? (
                <p className="text-sm text-foreground-muted py-8 text-center">No time tracked for this client yet.</p>
              ) : (
                <div className="flex flex-col">
                  {timeEntries.map((e) => {
                    const start = new Date(e.started_at);
                    const end = e.ended_at ? new Date(e.ended_at) : null;
                    return (
                      <div key={e.id} className="flex items-center gap-3 py-3 border-b border-border">
                        <div className="w-[3px] h-8 rounded-full" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{e.description || "No description"}</p>
                          <p className="text-small text-foreground-muted">
                            {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
              <div className="flex flex-col items-center py-16 text-center">
                <p className="text-sm text-foreground-muted">Tasks coming in Phase 4</p>
              </div>
            </TabsContent>

            <TabsContent value="interactions" className="mt-6">
              <InteractionsTab clientId={client.id} interactions={interactions} onRefresh={fetchInteractions} />
            </TabsContent>

            <TabsContent value="finances" className="mt-6">
              <div className="flex flex-col items-center py-16 text-center">
                <p className="text-sm text-foreground-muted">Finances coming in Phase 5</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column */}
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

          <div className="border border-border rounded-lg p-5">
            <p className="text-micro text-foreground-muted mb-3">Payment</p>
            <div className="flex flex-col gap-2 text-sm">
              <p><span className="text-foreground-secondary">Rate:</span> {client.monthly_rate ? `$${client.monthly_rate.toLocaleString()}` : "—"}</p>
              <p><span className="text-foreground-secondary">Frequency:</span> {client.payment_frequency || "monthly"}</p>
              <p><span className="text-foreground-secondary">Method:</span> {client.payment_method || "—"}</p>
              {client.billing_entity && <p><span className="text-foreground-secondary">Billed by:</span> {client.billing_entity}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Edit slide-over */}
      {editOpen && <EditClientPanel client={client} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); fetchClient(); }} />}
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
      toast.error("Failed to update client");
      return;
    }
    toast.success("Client updated!");
    onSaved();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/20" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[400px] bg-background border-l border-border overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 text-foreground">Edit client</h2>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-tertiary">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-label mb-1 block">Status</label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-label mb-1 block">Client name *</label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <label className="text-label mb-1 block">Contact name</label>
              <Input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
            </div>
            <div>
              <label className="text-label mb-1 block">Email</label>
              <Input value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div>
              <label className="text-label mb-1 block">Phone</label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <label className="text-label mb-1 block">Website</label>
              <Input value={form.website} onChange={(e) => update("website", e.target.value)} />
            </div>

            <div className="h-px bg-border" />

            <div>
              <label className="text-label mb-1 block">Billing entity</label>
              <Input value={form.billing_entity} onChange={(e) => update("billing_entity", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Monthly rate</label>
                <Input type="number" value={form.monthly_rate} onChange={(e) => update("monthly_rate", e.target.value)} />
              </div>
              <div>
                <label className="text-label mb-1 block">Currency</label>
                <Input value={form.currency} onChange={(e) => update("currency", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Frequency</label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.payment_frequency} onChange={(e) => update("payment_frequency", e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="weekly">Weekly</option>
                  <option value="project">Per project</option>
                </select>
              </div>
              <div>
                <label className="text-label mb-1 block">Method</label>
                <Input value={form.payment_method} onChange={(e) => update("payment_method", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-label mb-1 block">Channel</label>
              <Input value={form.communication_channel} onChange={(e) => update("communication_channel", e.target.value)} />
            </div>

            <div className="h-px bg-border" />

            <div>
              <label className="text-label mb-1 block">Notes</label>
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={4} />
            </div>

            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full h-11">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
