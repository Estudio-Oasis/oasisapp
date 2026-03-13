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

export default function FinancesPage() {
  // Redirect non-admins
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
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

  // Expense form
  const [expFormOpen, setExpFormOpen] = useState(false);
  const [expForm, setExpForm] = useState({ category: "Other", description: "", amount: "", currency: "USD", date: new Date().toISOString().split("T")[0], client_id: "", recurring: false });
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
      invoiceList.map((inv) => ({ ...inv, client_name: clientMap.get(inv.client_id) || "Unknown" }))
    );
    setExpenses((expensesRes.data || []) as ExpenseRow[]);
    setPayments(
      ((paymentsRes.data || []) as unknown as PaymentRow[]).map((p) => ({
        ...p,
        client_name: clientMap.get(p.client_id) || "Unknown",
        invoice_number: p.invoice_id ? invoiceMap.get(p.invoice_id) || undefined : undefined,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Fetch exchange rates from free API
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data) => {
        if (data?.rates) setExchangeRates(data.rates as Record<string, number>);
      })
      .catch(() => {});
  }, []);

  // Invoice stats
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

  // Payment stats
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

  // Chart data
  const chartData = useMemo(() => {
    const months: { label: string; revenue: number; expenses: number; net: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString("en-US", { month: "short" });
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

  // Expense submit
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
    } as Record<string, unknown>);
    setExpSaving(false);
    if (error) { toast.error("Failed to add expense"); return; }
    toast.success("Expense added");
    setExpFormOpen(false);
    setExpForm({ category: "Other", description: "", amount: "", currency: "USD", date: new Date().toISOString().split("T")[0], client_id: "", recurring: false });
    fetchAll();
  };

  const monthExpenses = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses.filter((e) => new Date(e.date + "T00:00:00") >= monthStart).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const EXPENSE_CATEGORIES = ["Payroll", "AI Credits", "Software", "Ad Spend", "Freelancers", "Other"];

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("You don't have permission to view this section.");
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
        <h1 className="text-h1 text-foreground">Finances</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* MRR with currency toggle */}
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
        <StatCard label="Collected this month" value={`$${stats.collected.toLocaleString()}`} icon={<CheckCircle className="h-4 w-4" />} />
        <StatCard label="Pending" value={`$${stats.pending.toLocaleString()}`} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Overdue" value={`$${stats.overdue.toLocaleString()}`} icon={<AlertTriangle className="h-4 w-4" />} danger={stats.overdue > 0} />
      </div>

      {/* Chart */}
      <div className="border border-border rounded-lg p-4 mb-6">
        <p className="text-micro text-foreground-muted mb-3">Revenue vs Expenses (6 months)</p>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]} />
              <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Expenses" />
              <Line type="monotone" dataKey="net" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Net" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── PAYMENTS ─── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 text-foreground">Payments</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setBulkPayOpen(true)}>
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Bulk scan
            </Button>
            <Button size="sm" onClick={() => setNewPayOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Log payment
            </Button>
          </div>
        </div>

        {/* Payment stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="border border-border rounded-lg p-4">
            <p className="text-micro text-foreground-muted mb-1">USD this month</p>
            <p className="text-h2 text-foreground">${paymentStats.usdThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-small text-foreground-muted">USD direct</p>
          </div>
          <div className="border border-border rounded-lg p-4">
            <p className="text-micro text-foreground-muted mb-1">MXN this month</p>
            <p className="text-h2 text-foreground">${paymentStats.mxnThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-small text-foreground-muted">MXN (converted + direct)</p>
          </div>
          <div className="border border-border rounded-lg p-4">
            <p className="text-micro text-foreground-muted mb-1">Avg exchange rate</p>
            <p className="text-h2 text-foreground">
              {paymentStats.avgRate ? `${paymentStats.avgRate.toFixed(2)}` : "—"}
            </p>
            <p className="text-small text-foreground-muted">
              {paymentStats.avgRate ? "1 USD = X MXN" : "No conversions"}
            </p>
          </div>
        </div>

        {/* Payment list */}
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-foreground-muted mb-1">No payments recorded yet</p>
            <p className="text-small text-foreground-muted mb-3">Log your first payment to start tracking actual income</p>
            <Button variant="secondary" size="sm" onClick={() => setNewPayOpen(true)}>Log payment</Button>
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
                      {new Date(p.date_received + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.sender_name || p.client_name}</p>
                    {p.reference && <p className="text-small text-foreground-muted truncate">{p.reference}</p>}
                  </div>
                  {p.breakdown && Array.isArray(p.breakdown) && (p.breakdown as unknown[]).length > 0 && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-light text-accent-foreground shrink-0">
                      {(p.breakdown as unknown[]).length} items
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

      {/* ─── INVOICES ─── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 text-foreground">Invoices</h2>
          <Button size="sm" onClick={() => setNewInvOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New invoice
          </Button>
        </div>
        <div className="flex gap-1 mb-4 flex-wrap">
          {(["all", "draft", "sent", "paid", "overdue"] as const).map((f) => (
            <button key={f} onClick={() => setInvFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${invFilter === f ? "bg-primary text-primary-foreground" : "border border-border text-foreground-secondary hover:bg-background-secondary"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filteredInvoices.length === 0 ? (
          <p className="text-sm text-foreground-muted py-8 text-center">No invoices found.</p>
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
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[displayStatus] || ""}`}>{displayStatus}</span>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{inv.currency} ${inv.amount.toLocaleString()}</p>
                    {inv.due_date && (
                      <p className={`text-small ${effectivelyOverdue ? "text-destructive" : "text-foreground-muted"}`}>
                        Due {new Date(inv.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── EXPENSES ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-h2 text-foreground">Expenses</h2>
            <p className="text-small text-foreground-muted">${monthExpenses.toLocaleString()} this month</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setExpFormOpen(!expFormOpen)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add expense
          </Button>
        </div>

        {expFormOpen && (
          <div className="border border-border rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-label">Category</label>
                <Select value={expForm.category} onValueChange={(v) => setExpForm({ ...expForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-label">Amount</label>
                <Input type="number" step="0.01" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-label">Date</label>
                <Input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-label">Currency</label>
                <Input value={expForm.currency} onChange={(e) => setExpForm({ ...expForm, currency: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Description</label>
              <Input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="What was this expense for?" />
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Client</label>
              <Select value={expForm.client_id || "none"} onValueChange={(v) => setExpForm({ ...expForm, client_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Optional — link to a client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client (general expense)</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground-secondary cursor-pointer">
              <input type="checkbox" checked={expForm.recurring} onChange={(e) => setExpForm({ ...expForm, recurring: e.target.checked })} className="rounded border-border" />
              Recurring expense
            </label>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleExpenseSubmit} disabled={expSaving || !expForm.amount}>
                {expSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save expense"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setExpFormOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {expenses.length === 0 ? (
          <p className="text-sm text-foreground-muted py-8 text-center">No expenses recorded yet.</p>
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
                      {exp.description || "—"}
                      {clientName && <span> · {clientName}</span>}
                      {exp.recurring && <span> · 🔁</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{exp.currency} ${exp.amount.toLocaleString()}</p>
                    <p className="text-small text-foreground-muted">
                      {new Date(exp.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── INSIGHTS / BI ─── */}
      <InsightsSection payments={payments} clients={clients} />

      {/* Modals & Panels */}
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
  // Chart 1: Income by month (last 6 months, grouped by currency)
  const incomeByMonth = useMemo(() => {
    const now = new Date();
    const months: { label: string; usd: number; mxn: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString("en-US", { month: "short" });
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

  // Chart 2: Exchange rate over time
  const rateData = useMemo(() => {
    return payments
      .filter((p) => p.exchange_rate && p.exchange_rate > 0)
      .sort((a, b) => a.date_received.localeCompare(b.date_received))
      .map((p) => ({
        date: new Date(p.date_received + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rate: p.exchange_rate!,
        amount: p.amount_received,
        currency: p.currency_received,
        bankAmount: p.bank_amount,
        bankCurrency: p.bank_currency,
      }));
  }, [payments]);

  // Chart 3: Revenue by client
  const clientRevenue = useMemo(() => {
    const map = new Map<string, { name: string; usd: number; mxn: number }>();
    payments.forEach((p) => {
      const name = p.client_name || "Unknown";
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
          Log payments to see insights here
        </p>
      ) : (
        <div className="space-y-6">
          {/* Income by month */}
          <div className="border border-border rounded-lg p-4">
            <p className="text-micro text-foreground-muted mb-3">Income received by month</p>
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

          {/* Exchange rate */}
          {rateData.length >= 2 && (
            <div className="border border-border rounded-lg p-4">
              <p className="text-micro text-foreground-muted mb-3">Real exchange rate (Wise) over time</p>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rateData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} />
                    <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
                      formatter={(value: number, _name: string, entry: { payload: typeof rateData[0] }) => {
                        const d = entry.payload;
                        return [`${value.toFixed(2)} MXN/USD ($${d.amount.toLocaleString()} ${d.currency} → $${d.bankAmount?.toLocaleString()} ${d.bankCurrency})`, "Rate"];
                      }}
                    />
                    <Line type="monotone" dataKey="rate" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--accent))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-small text-foreground-muted mt-2">
                Each point represents a real Wise conversion rate you received
              </p>
            </div>
          )}

          {/* Revenue by client */}
          {clientRevenue.length > 0 && (
            <div className="border border-border rounded-lg p-4">
              <p className="text-micro text-foreground-muted mb-3">Revenue by client (all time)</p>
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
