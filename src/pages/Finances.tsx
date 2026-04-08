import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/hooks/useRole";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
  ComposedChart,
  Legend,
  CartesianGrid,
} from "recharts";
import { NewInvoiceModal } from "@/components/NewInvoiceModal";
import { InvoiceDetailPanel } from "@/components/InvoiceDetailPanel";
import { LogPaymentModal } from "@/components/LogPaymentModal";
import { BulkReceiptUploadModal } from "@/components/BulkReceiptUploadModal";
import { PaymentDetailPanel } from "@/components/PaymentDetailPanel";
import type { PaymentRow } from "@/components/PaymentDetailPanel";
import type { Tables } from "@/integrations/supabase/types";
import { getClientColor } from "@/lib/timer-utils";

type Client = Tables<"clients">;

interface InvoiceRow {
  id: string;
  number: string;
  client_id: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  period_start?: string | null;
  period_end?: string | null;
  notes: string | null;
  created_at: string;
  client_name?: string;
}

interface ExpenseRow {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  currency: string;
  date: string;
  client_id: string | null;
  recurring: boolean;
  created_at: string;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

function isOverdue(inv: { status: string; due_date: string | null }): boolean {
  return inv.status === "overdue" || (inv.status === "sent" && !!inv.due_date && new Date(inv.due_date) < today);
}

const DISPLAY_CURRENCIES = ["USD", "MXN", "EUR", "COP"] as const;
type DisplayCurrency = typeof DISPLAY_CURRENCIES[number];

const STATUS_LABELS: Record<string, string> = {
  all: "Todas",
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  overdue: "Vencida",
};

export default function FinancesPage() {
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [invFilter, setInvFilter] = useState<"all" | "draft" | "sent" | "paid" | "overdue">("all");
  const [newInvOpen, setNewInvOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [newPayOpen, setNewPayOpen] = useState(false);
  const [bulkPayOpen, setBulkPayOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [mrrCurrency, setMrrCurrency] = useState<DisplayCurrency>("USD");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  const [expFormOpen, setExpFormOpen] = useState(false);
  const [expForm, setExpForm] = useState({ category: "Otro", description: "", amount: "", currency: "USD", date: new Date().toISOString().split("T")[0], client_id: "", recurring: false });
  const [expSaving, setExpSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    const [clientsRes, invoicesRes, expensesRes, paymentsRes] = await Promise.all([
      supabase.from("clients").select("*").order("name"),
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("date", { ascending: false }),
      supabase.from("payments").select("*").order("date_received", { ascending: false }),
    ]);
    const clientList = clientsRes.data || [];
    setClients(clientList);
    const clientMap = new Map(clientList.map((c) => [c.id, c.name]));

    const invoiceList = (invoicesRes.data || []) as InvoiceRow[];
    const invoiceMap = new Map(invoiceList.map((i) => [i.id, i.number]));

    setInvoices(
      invoiceList.map((inv) => ({ ...inv, client_name: clientMap.get(inv.client_id) || "Desconocido" }))
    );
    setExpenses((expensesRes.data || []) as ExpenseRow[]);
    setPayments(
      ((paymentsRes.data || []) as unknown as PaymentRow[]).map((p) => ({
        ...p,
        client_name: clientMap.get(p.client_id) || "Desconocido",
        invoice_number: p.invoice_id ? invoiceMap.get(p.invoice_id) || undefined : undefined,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data) => {
        if (data?.rates) setExchangeRates(data.rates as Record<string, number>);
      })
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === "active");
    const mrr = activeClients.reduce((sum, c) => sum + (c.monthly_rate || 0), 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let collected = 0, pending = 0, overdue = 0;
    invoices.forEach((inv) => {
      if (inv.status === "paid" && inv.paid_at && new Date(inv.paid_at) >= monthStart) collected += inv.amount;
      if (inv.status === "draft" || inv.status === "sent") {
        if (isOverdue(inv)) overdue += inv.amount;
        else pending += inv.amount;
      }
      if (inv.status === "overdue") overdue += inv.amount;
    });
    return { mrr, collected, pending, overdue };
  }, [clients, invoices]);

  const paymentStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthPayments = payments.filter((p) => new Date(p.date_received + "T00:00:00") >= monthStart);

    const usdThisMonth = monthPayments
      .filter((p) => p.currency_received === "USD")
      .reduce((s, p) => s + p.amount_received, 0);

    const mxnThisMonth = monthPayments.reduce((s, p) => {
      if (p.bank_currency === "MXN" && p.bank_amount) return s + p.bank_amount;
      if (p.currency_received === "MXN") return s + p.amount_received;
      return s;
    }, 0);

    const ratesThisMonth = monthPayments
      .filter((p) => p.exchange_rate && p.exchange_rate > 0)
      .map((p) => p.exchange_rate!);
    const avgRate = ratesThisMonth.length > 0
      ? ratesThisMonth.reduce((s, r) => s + r, 0) / ratesThisMonth.length
      : null;

    return { usdThisMonth, mxnThisMonth, avgRate };
  }, [payments]);

  const chartData = useMemo(() => {
    const months: { label: string; revenue: number; expenses: number; net: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString("es-MX", { month: "short" });
      const rev = invoices
        .filter((inv) => inv.status === "paid" && inv.paid_at && new Date(inv.paid_at) >= d && new Date(inv.paid_at) <= monthEnd)
        .reduce((s, inv) => s + inv.amount, 0);
      const exp = expenses
        .filter((e) => { const ed = new Date(e.date + "T00:00:00"); return ed >= d && ed <= monthEnd; })
        .reduce((s, e) => s + e.amount, 0);
      months.push({ label, revenue: rev, expenses: exp, net: rev - exp });
    }
    return months;
  }, [invoices, expenses]);

  const filteredInvoices = useMemo(() => {
    if (invFilter === "all") return invoices;
    if (invFilter === "overdue") return invoices.filter((inv) => isOverdue(inv));
    return invoices.filter((inv) => inv.status === invFilter && !isOverdue(inv));
  }, [invoices, invFilter]);

  const handleExpenseSubmit = async () => {
    if (!expForm.amount || !expForm.category) return;
    setExpSaving(true);
    const { error } = await supabase.from("expenses").insert({
      category: expForm.category,
      description: expForm.description || null,
      amount: parseFloat(expForm.amount),
      currency: expForm.currency,
      date: expForm.date,
      client_id: expForm.client_id || null,
      recurring: expForm.recurring,
    });
    setExpSaving(false);
    if (error) { toast.error("Error al agregar el gasto"); return; }
    toast.success("Gasto agregado");
    setExpFormOpen(false);
    setExpForm({ category: "Otro", description: "", amount: "", currency: "USD", date: new Date().toISOString().split("T")[0], client_id: "", recurring: false });
    fetchAll();
  };

  const monthExpenses = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses.filter((e) => new Date(e.date + "T00:00:00") >= monthStart).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const EXPENSE_CATEGORIES = ["Nómina", "Créditos IA", "Software", "Publicidad", "Freelancers", "Otro"];

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("No tienes permiso para ver esta sección.");
      navigate("/tasks", { replace: true });
    }
  }, [roleLoading, isAdmin, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h1 text-foreground">{t("finances.title")}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-foreground-muted"><TrendingUp className="h-4 w-4" /></span>
            <p className="text-micro text-foreground-muted">MRR</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-h2 text-foreground">
              {mrrCurrency === "USD" ? "$" : mrrCurrency === "EUR" ? "€" : "$"}
              {(stats.mrr * (exchangeRates[mrrCurrency] || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <button
              onClick={() => {
                const idx = DISPLAY_CURRENCIES.indexOf(mrrCurrency);
                setMrrCurrency(DISPLAY_CURRENCIES[(idx + 1) % DISPLAY_CURRENCIES.length]);
              }}
              className="px-2 py-0.5 rounded-full border border-border bg-background-secondary text-[11px] font-semibold text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
            >
              {mrrCurrency}
            </button>
          </div>
        </div>
        <StatCard label="Cobrado este mes" value={`$${stats.collected.toLocaleString()}`} icon={<CheckCircle className="h-4 w-4" />} />
        <StatCard label="Pendiente" value={`$${stats.pending.toLocaleString()}`} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Vencido" value={`$${stats.overdue.toLocaleString()}`} icon={<AlertTriangle className="h-4 w-4" />} danger={stats.overdue > 0} />
      </div>

      {/* Chart */}
      <div className="border border-border rounded-lg p-4 mb-6">
        <p className="text-micro text-foreground-muted mb-3">Ingresos vs Gastos (6 meses)</p>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]} />
              <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Ingresos" />
              <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Gastos" />
              <Line type="monotone" dataKey="net" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Neto" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PAGOS */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 text-foreground">Pagos</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setBulkPayOpen(true)}>
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Escaneo masivo
            </Button>
            <Button size="sm" onClick={() => setNewPayOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Registrar pago
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="border border-border rounded-lg p-4">
            <p className="text-micro text-foreground-muted mb-1">USD este mes</p>
            <p className="text-h2 text-foreground">${paymentStats.usdThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-small text-foreground-muted">USD directo</p>
          </div>
          <div className="border border-border rounded-lg p-4">
            <p className="text-micro text-foreground-muted mb-1">MXN este mes</p>
            <p className="text-h2 text-foreground">${paymentStats.mxnThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-small text-foreground-muted">MXN (convertido + directo)</p>
          </div>
          <div className="border border-border rounded-lg p-4">
            <p className="text-micro text-foreground-muted mb-1">Tipo de cambio prom.</p>
            <p className="text-h2 text-foreground">
              {paymentStats.avgRate ? `${paymentStats.avgRate.toFixed(2)}` : "Sin datos"}
            </p>
            <p className="text-small text-foreground-muted">
              {paymentStats.avgRate ? "1 USD = X MXN" : "Sin conversiones"}
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-foreground-muted mb-1">Aún no hay pagos registrados</p>
            <p className="text-small text-foreground-muted mb-3">Registra tu primer pago para empezar a rastrear ingresos reales</p>
            <Button variant="secondary" size="sm" onClick={() => setNewPayOpen(true)}>Registrar pago</Button>
          </div>
        ) : (
          <div className="flex flex-col">
            {payments.map((p) => {
              const clientColor = getClientColor(p.client_name || "");
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPayment(p)}
                  className="flex items-center gap-3 py-3 border-b border-border text-left hover:bg-background-secondary transition-colors px-1 -mx-1 rounded"
                >
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: clientColor }} />
                  <div className="w-20 shrink-0">
                    <p className="text-small text-foreground-muted">
                      {new Date(p.date_received + "T00:00:00").toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.sender_name || p.client_name}</p>
                    {p.reference && <p className="text-small text-foreground-muted truncate">{p.reference}</p>}
                  </div>
                  {p.breakdown && Array.isArray(p.breakdown) && (p.breakdown as unknown[]).length > 0 && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-light text-accent-foreground shrink-0">
                      {(p.breakdown as unknown[]).length} conceptos
                    </span>
                  )}
                  {p.exchange_rate && (
                    <span className="text-small text-foreground-muted shrink-0">{p.exchange_rate.toFixed(1)} MXN/USD</span>
                  )}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">
                      ${p.amount_received.toLocaleString(undefined, { minimumFractionDigits: 2 })} {p.currency_received}
                    </p>
                    {p.bank_amount && p.bank_currency && (
                      <p className="text-small text-foreground-muted">≈ ${p.bank_amount.toLocaleString()} {p.bank_currency}</p>
                    )}
                  </div>
                  {p.invoice_number && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-light text-accent-foreground shrink-0">
                      {p.invoice_number}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FACTURAS */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 text-foreground">Facturas</h2>
          <Button size="sm" onClick={() => setNewInvOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Nueva factura
          </Button>
        </div>
        <div className="flex gap-1 mb-4 flex-wrap">
          {(["all", "draft", "sent", "paid", "overdue"] as const).map((f) => (
            <button key={f} onClick={() => setInvFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${invFilter === f ? "bg-primary text-primary-foreground" : "border border-border text-foreground-secondary hover:bg-background-secondary"}`}>
              {STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        {filteredInvoices.length === 0 ? (
          <p className="text-sm text-foreground-muted py-8 text-center">No se encontraron facturas.</p>
        ) : (
          <div className="flex flex-col">
            {filteredInvoices.map((inv) => {
              const effectivelyOverdue = isOverdue(inv);
              const displayStatus = effectivelyOverdue ? "overdue" : inv.status;
              const STATUS_BADGE: Record<string, string> = {
                draft: "bg-background-tertiary text-foreground-secondary",
                sent: "bg-accent-light text-accent-foreground",
                paid: "bg-success-light text-success",
                overdue: "bg-destructive-light text-destructive",
              };
              return (
                <button key={inv.id} onClick={() => setSelectedInvoice(inv)} className="flex items-center gap-3 py-3 border-b border-border text-left hover:bg-background-secondary transition-colors px-1 -mx-1 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{inv.number}</p>
                    <p className="text-small text-foreground-muted">{inv.client_name}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[displayStatus] || ""}`}>{STATUS_LABELS[displayStatus] || displayStatus}</span>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{inv.currency} ${inv.amount.toLocaleString()}</p>
                    {inv.due_date && (
                      <p className={`text-small ${effectivelyOverdue ? "text-destructive" : "text-foreground-muted"}`}>
                        Vence {new Date(inv.due_date).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* GASTOS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-h2 text-foreground">Gastos</h2>
            <p className="text-small text-foreground-muted">${monthExpenses.toLocaleString()} este mes</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setExpFormOpen(!expFormOpen)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Agregar gasto
          </Button>
        </div>

        {expFormOpen && (
          <div className="border border-border rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-label">Categoría</label>
                <Select value={expForm.category} onValueChange={(v) => setExpForm({ ...expForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-label">Monto</label>
                <Input type="number" step="0.01" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-label">Fecha</label>
                <Input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-label">Moneda</label>
                <Input value={expForm.currency} onChange={(e) => setExpForm({ ...expForm, currency: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Descripción</label>
              <Input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="¿En qué fue este gasto?" />
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Cliente</label>
              <Select value={expForm.client_id || "none"} onValueChange={(v) => setExpForm({ ...expForm, client_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Opcional - vincular a un cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente (gasto general)</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground-secondary cursor-pointer">
              <input type="checkbox" checked={expForm.recurring} onChange={(e) => setExpForm({ ...expForm, recurring: e.target.checked })} className="rounded border-border" />
              Gasto recurrente
            </label>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleExpenseSubmit} disabled={expSaving || !expForm.amount}>
                {expSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar gasto"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setExpFormOpen(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {expenses.length === 0 ? (
          <p className="text-sm text-foreground-muted py-8 text-center">Aún no hay gastos registrados.</p>
        ) : (
          <div className="flex flex-col">
            {expenses.slice(0, 20).map((exp) => {
              const clientName = exp.client_id ? clients.find((c) => c.id === exp.client_id)?.name : null;
              return (
                <div key={exp.id} className="flex items-center gap-3 py-3 border-b border-border">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-secondary text-xs font-semibold text-foreground-secondary">
                    {exp.category.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{exp.category}</p>
                    <p className="text-small text-foreground-muted truncate">
                      {exp.description || "Sin descripción"}
                      {clientName && <span> · {clientName}</span>}
                      {exp.recurring && <span> · 🔁</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{exp.currency} ${exp.amount.toLocaleString()}</p>
                    <p className="text-small text-foreground-muted">
                      {new Date(exp.date + "T00:00:00").toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INSIGHTS / BI */}
      <InsightsSection payments={payments} clients={clients} />

      {/* Modales y paneles */}
      <NewInvoiceModal open={newInvOpen} onOpenChange={setNewInvOpen} onCreated={fetchAll} />
      <LogPaymentModal open={newPayOpen} onOpenChange={setNewPayOpen} onCreated={fetchAll} />
      <BulkReceiptUploadModal open={bulkPayOpen} onOpenChange={setBulkPayOpen} onCreated={fetchAll} />
      {selectedInvoice && (
        <InvoiceDetailPanel invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onUpdated={() => { setSelectedInvoice(null); fetchAll(); }} />
      )}
      {selectedPayment && (
        <PaymentDetailPanel payment={selectedPayment} onClose={() => setSelectedPayment(null)} onUpdated={() => { setSelectedPayment(null); fetchAll(); }} />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, danger }: { label: string; value: string; icon: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`border rounded-lg p-4 ${danger ? "border-destructive bg-destructive-light" : "border-border"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={danger ? "text-destructive" : "text-foreground-muted"}>{icon}</span>
        <p className="text-micro text-foreground-muted">{label}</p>
      </div>
      <p className={`text-h2 ${danger ? "text-destructive" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function InsightsSection({ payments, clients }: { payments: PaymentRow[]; clients: Client[] }) {
  const incomeByMonth = useMemo(() => {
    const now = new Date();
    const months: { label: string; usd: number; mxn: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString("es-MX", { month: "short" });
      let usd = 0, mxn = 0;
      payments.forEach((p) => {
        const pd = new Date(p.date_received + "T00:00:00");
        if (pd < d || pd > monthEnd) return;
        if (p.currency_received === "USD") usd += p.amount_received;
        if (p.currency_received === "MXN") mxn += p.amount_received;
        if (p.bank_currency === "MXN" && p.bank_amount) mxn += p.bank_amount;
      });
      months.push({ label, usd: Math.round(usd), mxn: Math.round(mxn) });
    }
    return months;
  }, [payments]);

  const rateData = useMemo(() => {
    return payments
      .filter((p) => p.exchange_rate && p.exchange_rate > 0)
      .sort((a, b) => a.date_received.localeCompare(b.date_received))
      .map((p) => ({
        date: new Date(p.date_received + "T00:00:00").toLocaleDateString("es-MX", { month: "short", day: "numeric" }),
        rate: p.exchange_rate!,
        amount: p.amount_received,
        currency: p.currency_received,
        bankAmount: p.bank_amount,
        bankCurrency: p.bank_currency,
      }));
  }, [payments]);

  const clientRevenue = useMemo(() => {
    const map = new Map<string, { name: string; usd: number; mxn: number }>();
    payments.forEach((p) => {
      const name = p.client_name || "Desconocido";
      const existing = map.get(name) || { name, usd: 0, mxn: 0 };
      if (p.currency_received === "USD") existing.usd += p.amount_received;
      else if (p.currency_received === "MXN") existing.mxn += p.amount_received;
      map.set(name, existing);
    });
    return Array.from(map.values()).sort((a, b) => (b.usd + b.mxn) - (a.usd + a.mxn));
  }, [payments]);

  const hasData = payments.length > 0;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-accent-foreground" />
        <h2 className="text-h2 text-foreground">Insights</h2>
      </div>

      {!hasData ? (
        <p className="text-sm text-foreground-muted py-8 text-center">
          Registra pagos para ver insights aquí
        </p>
      ) : (
        <div className="space-y-6">
          <div className="border border-border rounded-lg p-4">
            <p className="text-micro text-foreground-muted mb-3">Ingresos recibidos por mes</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeByMonth}>
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === "usd" ? "USD" : "MXN"]} />
                  <Legend formatter={(value: string) => value === "usd" ? "USD" : "MXN"} />
                  <Bar dataKey="usd" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mxn" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {rateData.length >= 2 && (
            <div className="border border-border rounded-lg p-4">
              <p className="text-micro text-foreground-muted mb-3">Tipo de cambio real (Wise) en el tiempo</p>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rateData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} />
                    <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
                      formatter={(value: number, _name: string, entry: { payload: typeof rateData[0] }) => {
                        const d = entry.payload;
                        return [`${value.toFixed(2)} MXN/USD ($${d.amount.toLocaleString()} ${d.currency} → $${d.bankAmount?.toLocaleString()} ${d.bankCurrency})`, "TC"];
                      }}
                    />
                    <Line type="monotone" dataKey="rate" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--accent))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-small text-foreground-muted mt-2">
                Cada punto representa un tipo de cambio real de conversión en Wise
              </p>
            </div>
          )}

          {clientRevenue.length > 0 && (
            <div className="border border-border rounded-lg p-4">
              <p className="text-micro text-foreground-muted mb-3">Ingresos por cliente (histórico)</p>
              <div style={{ height: Math.max(80, clientRevenue.length * 40) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientRevenue} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === "usd" ? "USD" : "MXN"]} />
                    <Bar dataKey="usd" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} stackId="a" />
                    <Bar dataKey="mxn" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
