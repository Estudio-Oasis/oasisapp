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
import { Loader2, Plus, X, ImagePlus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageEditorModal } from "@/components/ImageEditorModal";
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

interface ScanResult {
  amount_received: number | null;
  currency_received: string | null;
  date_received: string | null;
  sender_name: string | null;
  reference: string | null;
  transaction_id: string | null;
  method: string | null;
  confidence: "high" | "medium" | "low";
  notes: string | null;
}

interface LogPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  prefillClientId?: string;
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "alta",
  medium: "media",
  low: "baja",
};

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

  const [showConversion, setShowConversion] = useState(false);
  const [bankAmount, setBankAmount] = useState("");
  const [bankCurrency, setBankCurrency] = useState("MXN");

  const [showInvoiceLink, setShowInvoiceLink] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [clientInvoices, setClientInvoices] = useState<InvoiceOption[]>([]);

  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownItems, setBreakdownItems] = useState<BreakdownItem[]>([]);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [editedReceiptFile, setEditedReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

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
    setReceiptFile(null);
    setEditedReceiptFile(null);
    setReceiptPreviewUrl(null);
    setScanResult(null);

    supabase.from("clients").select("*").order("name").then(({ data }) => setClients(data || []));
  }, [open, prefillClientId]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo debe ser menor a 10MB");
      return;
    }
    setReceiptFile(file);
    setEditorOpen(true);
  };

  const handleEditorConfirm = async (editedFile: File) => {
    setEditedReceiptFile(editedFile);
    const url = URL.createObjectURL(editedFile);
    setReceiptPreviewUrl(url);

    setScanning(true);
    try {
      const formData = new FormData();
      formData.append("image", editedFile);

      const res = await supabase.functions.invoke("scan-receipt", {
        body: formData,
      });

      if (res.error) {
        console.error("Scan error:", res.error);
        toast.error("El escaneo con IA falló, llena los campos manualmente");
      } else {
        const data = res.data as ScanResult;
        setScanResult(data);
        if (data.amount_received && !amountReceived) setAmountReceived(String(data.amount_received));
        if (data.currency_received && currencyReceived === "USD") setCurrencyReceived(data.currency_received);
        if (data.date_received && dateReceived === new Date().toISOString().split("T")[0]) setDateReceived(data.date_received);
        if (data.sender_name && !senderName) setSenderName(data.sender_name);
        if (data.reference && !reference) setReference(data.reference);
        if (data.transaction_id && !transactionId) setTransactionId(data.transaction_id);
        if (data.method) setMethod(data.method);
        toast.success("La IA extrajo los datos del pago, revisa antes de guardar");
      }
    } catch (err) {
      console.error("Scan error:", err);
      toast.error("El escaneo con IA falló");
    } finally {
      setScanning(false);
    }
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setEditedReceiptFile(null);
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    setReceiptPreviewUrl(null);
    setScanResult(null);
  };

  const handleSubmit = async () => {
    if (!clientId || !amountReceived || !dateReceived) return;
    setSaving(true);

    const breakdownJson = showBreakdown && breakdownItems.length > 0
      ? breakdownItems.filter(i => i.label || i.amount).map(i => ({ label: i.label, amount: parseFloat(i.amount) || 0 }))
      : [];

    const payload = {
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
      breakdown: breakdownJson as unknown as import("@/integrations/supabase/types").Json,
      notes: notes || null,
      created_by: user?.id || null,
    };

    const { data: inserted, error } = await supabase.from("payments").insert(payload).select("id").single();
    if (error || !inserted) {
      toast.error("Error al registrar el pago");
      setSaving(false);
      return;
    }

    if (editedReceiptFile && user) {
      const path = `${user.id}/${inserted.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, editedReceiptFile, { contentType: "image/jpeg" });
      
      if (!uploadError) {
        const { data: signedData } = await supabase.storage
          .from("receipts")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        
        if (signedData?.signedUrl) {
          await supabase.from("payments")
            .update({ receipt_url: signedData.signedUrl })
            .eq("id", inserted.id);
        }
      }
    }

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
          }).eq("id", invoiceId);
          toast.success(`Factura ${linkedInvoice.number} marcada como pagada automáticamente 🎉`);
        }
      }
    }

    toast.success("Pago registrado");
    setSaving(false);
    onCreated();
    onOpenChange(false);
  };

  const CURRENCIES = ["USD", "MXN", "COP", "EUR"];
  const METHODS = [
    { value: "wise", label: "Wise" },
    { value: "spei", label: "SPEI" },
    { value: "transfer", label: "Transferencia bancaria" },
    { value: "other", label: "Otro" },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] p-6 gap-0 border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-0">
            <DialogTitle className="text-h3">Registrar pago</DialogTitle>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            {/* Zona de comprobante */}
            {!editedReceiptFile ? (
              <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-xl p-5 cursor-pointer bg-background-secondary hover:bg-background-tertiary transition-colors text-center">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <ImagePlus className="h-6 w-6 text-foreground-muted" />
                <span className="text-sm font-medium text-foreground">Subir comprobante</span>
                <span className="text-small text-foreground-muted">
                  Captura de Wise, transferencia bancaria o cualquier comprobante de pago · Máx 10MB
                </span>
              </label>
            ) : (
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {receiptPreviewUrl && (
                    <img
                      src={receiptPreviewUrl}
                      alt="Vista previa del comprobante"
                      className="h-16 w-16 rounded-lg object-cover border border-border shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {editedReceiptFile.name}
                    </p>
                    <p className="text-small text-foreground-muted">
                      {(editedReceiptFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setReceiptFile(editedReceiptFile); setEditorOpen(true); }}
                      className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={clearReceipt}
                      className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-destructive hover:bg-background-secondary"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {scanning && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-foreground-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Escaneando con IA...
                  </div>
                )}

                {scanResult && !scanning && (
                  <div className="mt-3 bg-accent-light border border-accent/20 rounded-lg px-3 py-2 text-sm text-foreground">
                    <span className="font-medium">✦ La IA extrajo estos datos</span>
                    <span className="text-foreground-muted"> · revisa antes de guardar</span>
                    <span className={`ml-2 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      scanResult.confidence === "high"
                        ? "bg-success-light text-success"
                        : scanResult.confidence === "medium"
                        ? "bg-accent-light text-accent-foreground"
                        : "bg-destructive-light text-destructive"
                    }`}>
                      {CONFIDENCE_LABELS[scanResult.confidence] || scanResult.confidence}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Sección 1: Core */}
            <div className="space-y-1.5">
              <label className="text-label">Cliente *</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un cliente..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-label">¿Cuándo lo recibiste? *</label>
                <Input type="date" value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-label">Método</label>
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
                <label className="text-label">Monto recibido *</label>
                <Input type="number" step="0.01" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <label className="text-label">Moneda *</label>
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
                <label className="text-label">Nombre del remitente</label>
                <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Ej: Kajae LLC" />
              </div>
              <div className="space-y-1.5">
                <label className="text-label">Referencia</label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ej: Feb Q1, Mensual" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-label">ID de transacción</label>
              <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="#1981151032" />
            </div>

            {/* Sección 2: Conversión */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowConversion(!showConversion)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-background-secondary transition-colors"
              >
                <span>{showConversion ? "▾" : "▸"}</span>
                <span>💱 Este pago fue convertido a otra moneda</span>
              </button>
              {showConversion && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-small text-foreground-muted">Ej: USD recibido en Wise → convertido a MXN en Mercado Pago</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-label">Monto que llegó a tu banco</label>
                      <Input type="number" step="0.01" value={bankAmount} onChange={(e) => setBankAmount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-label">Moneda del banco</label>
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
                      Tipo de cambio: 1 {currencyReceived} = {exchangeRate.toFixed(4)} {bankCurrency}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sección 3: Vincular factura */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowInvoiceLink(!showInvoiceLink)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-background-secondary transition-colors"
              >
                <span>{showInvoiceLink ? "▾" : "▸"}</span>
                <span>📎 Vincular a una factura</span>
              </button>
              {showInvoiceLink && (
                <div className="px-4 pb-4">
                  {!clientId ? (
                    <p className="text-small text-foreground-muted">Selecciona un cliente primero</p>
                  ) : clientInvoices.length === 0 ? (
                    <p className="text-small text-foreground-muted">No hay facturas para este cliente</p>
                  ) : (
                    <Select value={invoiceId} onValueChange={setInvoiceId}>
                      <SelectTrigger><SelectValue placeholder="Selecciona factura..." /></SelectTrigger>
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

            {/* Sección 4: Desglose */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => { setShowBreakdown(!showBreakdown); if (!showBreakdown && breakdownItems.length === 0) addBreakdownItem(); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-background-secondary transition-colors"
              >
                <span>{showBreakdown ? "▾" : "▸"}</span>
                <span>🧮 Este pago incluye varios conceptos</span>
              </button>
              {showBreakdown && (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-small text-foreground-muted">Usa esto cuando una transferencia cubre diferentes periodos o ajustes</p>
                  {breakdownItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) => updateBreakdownItem(i, "label", e.target.value)}
                        placeholder="Concepto"
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
                    <Plus className="h-3.5 w-3.5 mr-1" /> Agregar línea
                  </Button>
                  {breakdownItems.length > 0 && (
                    <div className="pt-1">
                      <p className="text-small text-foreground-secondary">
                        Total de líneas: ${breakdownTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {amountReceived && Math.abs(breakdownTotal - parseFloat(amountReceived)) > 0.01 && (
                        <p className="text-small text-accent mt-1">
                          ⚠ Las líneas (${breakdownTotal.toFixed(2)}) no coinciden con el total recibido (${parseFloat(amountReceived).toFixed(2)})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <label className="text-label">Notas</label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="resize-none" placeholder="Notas opcionales..." />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" className="flex-1 h-11" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1 h-11" onClick={handleSubmit} disabled={saving || !clientId || !amountReceived || !dateReceived}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar pago"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ImageEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        imageFile={receiptFile}
        onConfirm={handleEditorConfirm}
      />
    </>
  );
}
