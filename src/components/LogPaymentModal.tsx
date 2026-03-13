import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

interface InvoiceOption {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
}

interface BreakdownItem {
  label: string;
  amount: string;
}

interface LogPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  prefillClientId?: string;
}

export function LogPaymentModal({ open, onOpenChange, onCreated, prefillClientId }: LogPaymentModalProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(prefillClientId || "");
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split("T")[0]);
  const [amountReceived, setAmountReceived] = useState("");
  const [currencyReceived, setCurrencyReceived] = useState("USD");
  const [senderName, setSenderName] = useState("");
  const [reference, setReference] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [method, setMethod] = useState("wise");
  const [notes, setNotes] = useState("");

  // Conversion
  const [showConversion, setShowConversion] = useState(false);
  const [bankAmount, setBankAmount] = useState("");
  const [bankCurrency, setBankCurrency] = useState("MXN");

  // Invoice link
  const [showInvoiceLink, setShowInvoiceLink] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [clientInvoices, setClientInvoices] = useState<InvoiceOption[]>([]);

  // Breakdown
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownItems, setBreakdownItems] = useState<BreakdownItem[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClientId(prefillClientId || "");
    setDateReceived(new Date().toISOString().split("T")[0]);
    setAmountReceived("");
    setCurrencyReceived("USD");
    setSenderName("");
    setReference("");
    setTransactionId("");
    setMethod("wise");
    setNotes("");
    setShowConversion(false);
    setBankAmount("");
    setBankCurrency("MXN");
    setShowInvoiceLink(false);
    setInvoiceId("");
    setShowBreakdown(false);
    setBreakdownItems([]);

    supabase.from("clients").select("*").order("name").then(({ data }) => setClients(data || []));
  }, [open, prefillClientId]);

  // Fetch invoices when client changes
  useEffect(() => {
    if (!clientId) { setClientInvoices([]); return; }
    supabase
      .from("invoices")
      .select("id, number, amount, currency, status, period_start, period_end")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setClientInvoices((data || []) as InvoiceOption[]));
  }, [clientId]);

  const exchangeRate = useMemo(() => {
    const a = parseFloat(amountReceived);
    const b = parseFloat(bankAmount);
    if (!a || !b || a === 0) return null;
    return Math.round((b / a) * 10000) / 10000;
  }, [amountReceived, bankAmount]);

  const breakdownTotal = useMemo(() => {
    return breakdownItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [breakdownItems]);

  const addBreakdownItem = () => {
    setBreakdownItems([...breakdownItems, { label: "", amount: "" }]);
  };

  const removeBreakdownItem = (index: number) => {
    setBreakdownItems(breakdownItems.filter((_, i) => i !== index));
  };

  const updateBreakdownItem = (index: number, field: "label" | "amount", value: string) => {
    const updated = [...breakdownItems];
    updated[index] = { ...updated[index], [field]: value };
    setBreakdownItems(updated);
  };

  const handleSubmit = async () => {
    if (!clientId || !amountReceived || !dateReceived) return;
    setSaving(true);

    const breakdownJson = showBreakdown && breakdownItems.length > 0
      ? breakdownItems.filter(i => i.label || i.amount).map(i => ({ label: i.label, amount: parseFloat(i.amount) || 0 }))
      : [];

    const payload: Record<string, unknown> = {
      client_id: clientId,
      amount_received: parseFloat(amountReceived),
      currency_received: currencyReceived,
      date_received: dateReceived,
      sender_name: senderName || null,
      reference: reference || null,
      transaction_id: transactionId || null,
      method: method || "wise",
      invoice_id: showInvoiceLink && invoiceId ? invoiceId : null,
      bank_amount: showConversion && bankAmount ? parseFloat(bankAmount) : null,
      bank_currency: showConversion && bankAmount ? bankCurrency : null,
      exchange_rate: showConversion && exchangeRate ? exchangeRate : null,
      breakdown: breakdownJson,
      notes: notes || null,
      created_by: user?.id || null,
    };

    const { error } = await supabase.from("payments").insert(payload as never);
    if (error) {
      toast.error("Failed to log payment");
      setSaving(false);
      return;
    }

    // Auto-complete invoice if linked and same currency
    if (showInvoiceLink && invoiceId) {
      const linkedInvoice = clientInvoices.find(i => i.id === invoiceId);
      if (linkedInvoice && linkedInvoice.currency === currencyReceived && linkedInvoice.status !== "paid") {
        const { data: allPayments } = await supabase
          .from("payments")
          .select("amount_received")
          .eq("invoice_id", invoiceId);
        const totalPaid = (allPayments || []).reduce((s, p) => s + (p as { amount_received: number }).amount_received, 0);
        if (totalPaid >= linkedInvoice.amount) {
          await supabase.from("invoices").update({
            status: "paid" as const,
            paid_at: new Date(dateReceived + "T12:00:00").toISOString(),
          } as Record<string, unknown>).eq("id", invoiceId);
          toast.success(`Invoice ${linkedInvoice.number} marked as paid automatically 🎉`);
        }
      }
    }

    toast.success("Payment logged");
    setSaving(false);
    onCreated();
    onOpenChange(false);
  };

  const CURRENCIES = ["USD", "MXN", "COP", "EUR"];
  const METHODS = [
    { value: "wise", label: "Wise" },
    { value: "spei", label: "SPEI" },
    { value: "transfer", label: "Bank transfer" },
    { value: "other", label: "Other" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-6 gap-0 border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-h3">Log payment</DialogTitle>
        </DialogHeader>

        <div className="mt-5 space-y-4">
          {/* Section 1: Core */}
          <div className="space-y-1.5">
            <label className="text-label">Client *</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-label">When did you receive this? *</label>
              <Input type="date" value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Method</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-label">Amount received *</label>
              <Input type="number" step="0.01" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Currency *</label>
              <Select value={currencyReceived} onValueChange={setCurrencyReceived}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-label">Sender name</label>
              <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="e.g. Kajae LLC" />
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Reference</label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Feb H1, Monthly" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-label">Transaction ID</label>
            <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="#1981151032" />
          </div>

          {/* Section 2: Conversion */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowConversion(!showConversion)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-background-secondary transition-colors"
            >
              <span>{showConversion ? "▾" : "▸"}</span>
              <span>💱 This payment was converted to another currency</span>
            </button>
            {showConversion && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-small text-foreground-muted">e.g. USD received in Wise → converted to MXN in Mercado Pago</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-label">Amount that arrived in your bank</label>
                    <Input type="number" step="0.01" value={bankAmount} onChange={(e) => setBankAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label">Bank currency</label>
                    <Select value={bankCurrency} onValueChange={setBankCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {exchangeRate && (
                  <div className="bg-accent-light rounded-lg px-3 py-2 text-sm text-accent-foreground">
                    Exchange rate: 1 {currencyReceived} = {exchangeRate.toFixed(4)} {bankCurrency}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Invoice link */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowInvoiceLink(!showInvoiceLink)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-background-secondary transition-colors"
            >
              <span>{showInvoiceLink ? "▾" : "▸"}</span>
              <span>📎 Link to an invoice</span>
            </button>
            {showInvoiceLink && (
              <div className="px-4 pb-4">
                {!clientId ? (
                  <p className="text-small text-foreground-muted">Select a client first</p>
                ) : clientInvoices.length === 0 ? (
                  <p className="text-small text-foreground-muted">No invoices for this client</p>
                ) : (
                  <Select value={invoiceId} onValueChange={setInvoiceId}>
                    <SelectTrigger><SelectValue placeholder="Select invoice..." /></SelectTrigger>
                    <SelectContent>
                      {clientInvoices.map((inv) => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.number} · ${inv.amount.toLocaleString()} {inv.currency} · {inv.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Breakdown */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => { setShowBreakdown(!showBreakdown); if (!showBreakdown && breakdownItems.length === 0) addBreakdownItem(); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-background-secondary transition-colors"
            >
              <span>{showBreakdown ? "▾" : "▸"}</span>
              <span>🧮 This payment includes multiple items</span>
            </button>
            {showBreakdown && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-small text-foreground-muted">Use this when one transfer covers different periods or adjustments</p>
                {breakdownItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={item.label}
                      onChange={(e) => updateBreakdownItem(i, "label", e.target.value)}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => updateBreakdownItem(i, "amount", e.target.value)}
                      placeholder="0.00"
                      className="w-28"
                    />
                    <button onClick={() => removeBreakdownItem(i)} className="shrink-0 text-foreground-muted hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={addBreakdownItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add line item
                </Button>
                {breakdownItems.length > 0 && (
                  <div className="pt-1">
                    <p className="text-small text-foreground-secondary">
                      Line items total: ${breakdownTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {amountReceived && Math.abs(breakdownTotal - parseFloat(amountReceived)) > 0.01 && (
                      <p className="text-small text-accent mt-1">
                        ⚠ Line items (${breakdownTotal.toFixed(2)}) don't add up to total received (${parseFloat(amountReceived).toFixed(2)})
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-label">Notes</label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="resize-none" placeholder="Optional notes..." />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1 h-11" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1 h-11" onClick={handleSubmit} disabled={saving || !clientId || !amountReceived || !dateReceived}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
