import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  ArrowLeft,
  FileText,
  Copy,
  Send,
  Check,
  X,
  Trash2,
  Loader2,
  Download,
  Edit,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { getClientColor } from "@/lib/timer-utils";

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

interface QuoteRow {
  id: string;
  agency_id: string;
  title: string;
  client_id: string;
  project_id: string | null;
  status: string;
  subtotal: number;
  discount_type: string;
  discount_value: number;
  tax_enabled: boolean;
  tax_rate: number;
  total_amount: number;
  currency: string;
  valid_until: string | null;
  created_by: string;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  description: string | null;
  created_at: string;
  pdf_url: string | null;
  payment_terms: string | null;
  notes_to_client: string | null;
}

interface QuoteItemRow {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  sort_order: number;
}

interface ClientMin {
  id: string;
  name: string;
  contact_name: string | null;
  monthly_rate: number | null;
  currency: string;
  email: string | null;
}

interface ProjectMin {
  id: string;
  name: string;
  client_id: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "bg-background-tertiary text-foreground-secondary" },
  sent: { label: "Enviada", color: "bg-accent-light text-accent-foreground" },
  accepted: { label: "Aceptada", color: "bg-success-light text-success" },
  rejected: { label: "Rechazada", color: "bg-destructive-light text-destructive" },
  expired: { label: "Expirada", color: "bg-accent-light text-accent-foreground" },
};

const UNITS = ["hora", "pieza", "mes", "proyecto", "servicio"] as const;

const DEFAULT_PAYMENT_TERMS = "50% al aceptar la cotización, 50% a contra entrega del proyecto";
const DEFAULT_NOTES = "Esta cotización incluye hasta 2 rondas de revisión. Cambios adicionales se cotizan por separado.";

export default function QuotesPage() {
  const [view, setView] = useState<"list" | "edit" | "detail">("list");
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [detailQuoteId, setDetailQuoteId] = useState<string | null>(null);

  if (view === "edit") {
    return (
      <QuoteEditor
        quoteId={editingQuoteId}
        onBack={() => { setView("list"); setEditingQuoteId(null); }}
        onSaved={(id) => { setDetailQuoteId(id); setView("detail"); }}
      />
    );
  }

  if (view === "detail" && detailQuoteId) {
    return (
      <QuoteDetail
        quoteId={detailQuoteId}
        onBack={() => { setView("list"); setDetailQuoteId(null); }}
        onEdit={(id) => { setEditingQuoteId(id); setView("edit"); }}
      />
    );
  }

  return (
    <QuoteList
      onNew={() => { setEditingQuoteId(null); setView("edit"); }}
      onView={(id) => { setDetailQuoteId(id); setView("detail"); }}
    />
  );
}

/* ─── Quote List ─── */
function QuoteList({ onNew, onView }: { onNew: () => void; onView: (id: string) => void }) {
  const [quotes, setQuotes] = useState<(QuoteRow & { clientName: string })[]>([]);
  const [clients, setClients] = useState<ClientMin[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [quotesRes, clientsRes] = await Promise.all([
      supabase.from("quotes").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name, contact_name, monthly_rate, currency, email").eq("status", "active").order("name"),
    ]);

    const clientMap: Record<string, string> = {};
    (clientsRes.data || []).forEach((c: any) => { clientMap[c.id] = c.name; });
    setClients((clientsRes.data || []) as ClientMin[]);

    setQuotes(
      ((quotesRes.data || []) as QuoteRow[]).map((q) => ({
        ...q,
        clientName: clientMap[q.client_id] || "—",
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = quotes.filter((q) => {
    if (filterStatus !== "all" && q.status !== filterStatus) return false;
    if (filterClient !== "all" && q.client_id !== filterClient) return false;
    return true;
  });

  const statCounts = {
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    rejected: quotes.filter((q) => q.status === "rejected").length,
  };

  const statAmounts = {
    draft: quotes.filter((q) => q.status === "draft").reduce((s, q) => s + q.total_amount, 0),
    sent: quotes.filter((q) => q.status === "sent").reduce((s, q) => s + q.total_amount, 0),
    accepted: quotes.filter((q) => q.status === "accepted").reduce((s, q) => s + q.total_amount, 0),
    rejected: quotes.filter((q) => q.status === "rejected").reduce((s, q) => s + q.total_amount, 0),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h1 text-foreground">Cotizaciones</h1>
        <Button onClick={onNew}>
          <Plus className="h-4 w-4" />
          Nueva cotización
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(["draft", "sent", "accepted", "rejected"] as const).map((s) => (
          <div key={s} className="border border-border rounded-lg p-4">
            <p className="text-micro text-foreground-muted mb-1">{STATUS_CONFIG[s].label}</p>
            <p className="text-h2 text-foreground">{statCounts[s]}</p>
            <p className="text-small text-foreground-secondary">${statAmounts[s].toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="h-10 w-10 text-border mb-3" />
          <p className="text-sm text-foreground-muted">No hay cotizaciones</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={onNew}>
            Crear primera cotización
          </Button>
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((q) => {
            const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.draft;
            return (
              <button
                key={q.id}
                onClick={() => onView(q.id)}
                className="flex items-center gap-3 py-3.5 px-2 border-b border-border hover:bg-background-secondary transition-colors text-left w-full"
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-background shrink-0"
                  style={{ backgroundColor: getClientColor(q.clientName) }}
                >
                  {q.clientName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{q.title}</p>
                  <p className="text-small text-foreground-muted">{q.clientName}</p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      ${q.total_amount.toLocaleString()} {q.currency}
                    </p>
                    {q.valid_until && (
                      <p className="text-[10px] text-foreground-muted">
                        Válida hasta {new Date(q.valid_until).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-foreground-muted" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Quote Editor ─── */
interface DraftItem {
  tempId: string;
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

function QuoteEditor({
  quoteId,
  onBack,
  onSaved,
}: {
  quoteId: string | null;
  onBack: () => void;
  onSaved: (id: string) => void;
}) {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientMin[]>([]);
  const [projects, setProjects] = useState<ProjectMin[]>([]);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(16);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [paymentTerms, setPaymentTerms] = useState(DEFAULT_PAYMENT_TERMS);
  const [notesToClient, setNotesToClient] = useState(DEFAULT_NOTES);
  const [items, setItems] = useState<DraftItem[]>([
    { tempId: crypto.randomUUID(), description: "", quantity: 1, unit: "hora", unit_price: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [loading, setLoading] = useState(!!quoteId);

  // Load agency defaults
  useEffect(() => {
    if (quoteId) return; // don't override when editing
    (async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("agency_id").eq("id", user.id).single();
      if (!profile?.agency_id) return;
      const { data: settings } = await supabase
        .from("agency_settings")
        .select("default_payment_terms, default_currency")
        .eq("agency_id", profile.agency_id)
        .single();
      if (settings) {
        if (settings.default_payment_terms) setPaymentTerms(settings.default_payment_terms);
        if (settings.default_currency) setCurrency(settings.default_currency);
      }
    })();
  }, [user, quoteId]);

  // Load data
  useEffect(() => {
    supabase.from("clients").select("id, name, contact_name, monthly_rate, currency, email").eq("status", "active").order("name")
      .then(({ data }) => setClients((data || []) as ClientMin[]));
    supabase.from("projects").select("id, name, client_id").eq("status", "active").order("name")
      .then(({ data }) => setProjects((data || []) as ProjectMin[]));
  }, []);

  // Load existing quote
  useEffect(() => {
    if (!quoteId) return;
    (async () => {
      const [qRes, itemsRes] = await Promise.all([
        supabase.from("quotes").select("*").eq("id", quoteId).single(),
        supabase.from("quote_items").select("*").eq("quote_id", quoteId).order("sort_order"),
      ]);
      if (qRes.data) {
        const q = qRes.data as QuoteRow;
        setTitle(q.title);
        setClientId(q.client_id);
        setProjectId(q.project_id || "");
        setDescription(q.description || "");
        setCurrency(q.currency);
        setDiscountType(q.discount_type);
        setDiscountValue(q.discount_value);
        setTaxEnabled(q.tax_enabled);
        setTaxRate(q.tax_rate);
        setValidUntil(q.valid_until || "");
        setPaymentTerms(q.payment_terms || DEFAULT_PAYMENT_TERMS);
        setNotesToClient(q.notes_to_client || DEFAULT_NOTES);
      }
      if (itemsRes.data && itemsRes.data.length > 0) {
        setItems(
          (itemsRes.data as QuoteItemRow[]).map((it) => ({
            tempId: crypto.randomUUID(),
            id: it.id,
            description: it.description,
            quantity: it.quantity,
            unit: it.unit,
            unit_price: it.unit_price,
          }))
        );
      }
      setLoading(false);
    })();
  }, [quoteId]);

  const filteredProjects = clientId
    ? projects.filter((p) => p.client_id === clientId)
    : projects;

  // Calculations
  const itemsSubtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const discountAmount = discountType === "percentage"
    ? itemsSubtotal * (discountValue / 100)
    : discountValue;
  const afterDiscount = itemsSubtotal - discountAmount;
  const taxAmount = taxEnabled ? afterDiscount * (taxRate / 100) : 0;
  const total = afterDiscount + taxAmount;

  const addItem = () => {
    setItems((prev) => [...prev, { tempId: crypto.randomUUID(), description: "", quantity: 1, unit: "hora", unit_price: 0 }]);
  };

  const removeItem = (tempId: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.tempId !== tempId));
  };

  const updateItem = (tempId: string, field: keyof DraftItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => (it.tempId === tempId ? { ...it, [field]: value } : it))
    );
  };

  const saveQuote = async (): Promise<string | null> => {
    if (!title.trim() || !clientId || !user) return null;

    const { data: profile } = await supabase.from("profiles").select("agency_id").eq("id", user.id).single();
    if (!profile?.agency_id) throw new Error("No agency");

    const quoteData = {
      agency_id: profile.agency_id,
      client_id: clientId,
      project_id: projectId || null,
      title: title.trim(),
      description: description || null,
      subtotal: itemsSubtotal,
      discount_type: discountType,
      discount_value: discountValue,
      tax_enabled: taxEnabled,
      tax_rate: taxRate,
      total_amount: Math.round(total * 100) / 100,
      currency,
      valid_until: validUntil || null,
      created_by: user.id,
      payment_terms: paymentTerms || null,
      notes_to_client: notesToClient || null,
    };

    let savedQuoteId: string;

    if (quoteId) {
      const { error } = await supabase.from("quotes").update(quoteData).eq("id", quoteId);
      if (error) throw error;
      savedQuoteId = quoteId;
      await supabase.from("quote_items").delete().eq("quote_id", quoteId);
    } else {
      const { data, error } = await supabase.from("quotes").insert(quoteData).select("id").single();
      if (error) throw error;
      savedQuoteId = data!.id;
    }

    const validItems = items.filter((it) => it.description.trim() && it.unit_price > 0);
    if (validItems.length > 0) {
      await supabase.from("quote_items").insert(
        validItems.map((it, idx) => ({
          quote_id: savedQuoteId,
          description: it.description.trim(),
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price,
          sort_order: idx,
        }))
      );
    }

    return savedQuoteId;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const id = await saveQuote();
      if (id) {
        toast.success(quoteId ? "Cotización actualizada" : "Borrador guardado");
        onSaved(id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPdf = async () => {
    setGeneratingPdf(true);
    try {
      const id = await saveQuote();
      if (!id) return;
      toast.success("Cotización guardada, generando PDF…");

      const { data, error } = await supabase.functions.invoke("generate-quote-pdf", {
        body: { quote_id: id },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
      toast.success("PDF generado");
      onSaved(id);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Price assistant data
  const selectedClient = clients.find((c) => c.id === clientId);
  const [clientHours, setClientHours] = useState<number | null>(null);

  useEffect(() => {
    if (!clientId) { setClientHours(null); return; }
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    supabase
      .from("time_entries")
      .select("duration_min")
      .eq("client_id", clientId)
      .gte("started_at", threeMonthsAgo.toISOString())
      .then(({ data }) => {
        const totalMin = (data || []).reduce((s: number, e: any) => s + (e.duration_min || 0), 0);
        setClientHours(Math.round((totalMin / 60) * 10) / 10);
      });
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-foreground-secondary hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Cotizaciones
      </button>

      <h1 className="text-h1 text-foreground mb-6">
        {quoteId ? "Editar cotización" : "Nueva cotización"}
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-5">
          <div>
            <label className="text-label mb-1 block">Título *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Rediseño de marca para..." autoFocus />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-label mb-1 block">Cliente *</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-label mb-1 block">Proyecto (opcional)</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-label mb-1 block">Descripción / alcance</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe el alcance del trabajo..." rows={3} className="resize-none" />
          </div>

          {/* Items table */}
          <div>
            <label className="text-label mb-2 block">Items</label>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_80px_40px] gap-2 px-3 py-2 bg-background-secondary text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
                <span>Descripción</span>
                <span>Cant.</span>
                <span>Unidad</span>
                <span>P. unitario</span>
                <span>Subtotal</span>
                <span />
              </div>

              {items.map((item) => (
                <div key={item.tempId} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_100px_80px_40px] gap-2 px-3 py-2 border-t border-border items-center">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.tempId, "description", e.target.value)}
                    placeholder="Descripción del servicio"
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.tempId, "quantity", parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                    min={0}
                  />
                  <Select value={item.unit} onValueChange={(v) => updateItem(item.tempId, "unit", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(item.tempId, "unit_price", parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                    min={0}
                    step={0.01}
                  />
                  <span className="text-sm font-medium text-foreground text-right sm:text-left">
                    ${(item.quantity * item.unit_price).toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeItem(item.tempId)}
                    disabled={items.length <= 1}
                    className="h-8 w-8 flex items-center justify-center text-foreground-muted hover:text-destructive disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <div className="px-3 py-2 border-t border-border">
                <button onClick={addItem} className="text-sm text-accent hover:text-accent/80 flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Agregar item
                </button>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-foreground-secondary">Subtotal</span>
              <span className="font-medium text-foreground">${itemsSubtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-secondary">Descuento</span>
                <div className="inline-flex rounded-md bg-background-secondary p-0.5">
                  <button
                    onClick={() => setDiscountType("percentage")}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${discountType === "percentage" ? "bg-foreground text-background" : "text-foreground-muted"}`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setDiscountType("fixed")}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${discountType === "fixed" ? "bg-foreground text-background" : "text-foreground-muted"}`}
                  >
                    $
                  </button>
                </div>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="h-7 w-20 text-sm"
                  min={0}
                />
              </div>
              <span className="text-sm text-foreground-secondary">-${discountAmount.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-secondary">IVA</span>
                <Switch checked={taxEnabled} onCheckedChange={setTaxEnabled} className="scale-75" />
                {taxEnabled && (
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="h-7 w-16 text-sm"
                    min={0}
                  />
                )}
                {taxEnabled && <span className="text-xs text-foreground-muted">%</span>}
              </div>
              <span className="text-sm text-foreground-secondary">${taxAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-base font-bold text-foreground">TOTAL</span>
              <span className="text-xl font-bold text-foreground">${Math.round(total * 100 / 100).toLocaleString()} {currency}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label mb-1 block">Moneda</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="MXN">MXN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-label mb-1 block">Válida hasta</label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              <p className="text-[10px] text-foreground-muted mt-0.5">Pre-llenado · 30 días</p>
            </div>
          </div>

          {/* Payment terms */}
          <div>
            <label className="text-label mb-1 block">Condiciones de pago</label>
            <Textarea
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
            <p className="text-[10px] text-foreground-muted mt-0.5">Pre-llenado · Puedes editar esto para cada cotización</p>
          </div>

          {/* Notes to client */}
          <div>
            <label className="text-label mb-1 block">Notas al cliente</label>
            <Textarea
              value={notesToClient}
              onChange={(e) => setNotesToClient(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
            <p className="text-[10px] text-foreground-muted mt-0.5">Pre-llenado · Puedes editar esto para cada cotización</p>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-[300px] shrink-0 space-y-4">
          {/* Price assistant */}
          {clientId && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <p className="text-micro text-foreground-muted">ASISTENTE DE PRECIO</p>
              {clientHours !== null && clientHours > 0 && (
                <p className="text-sm text-foreground-secondary">
                  Historial con {selectedClient?.name}: <strong className="text-foreground">{clientHours}h</strong> últimos 3 meses
                </p>
              )}
              {selectedClient?.monthly_rate && (
                <p className="text-sm text-foreground-secondary">
                  Retainer actual: <strong className="text-foreground">${selectedClient.monthly_rate.toLocaleString()}/mes</strong>
                </p>
              )}
              {clientHours && clientHours > 0 && selectedClient?.monthly_rate && (
                <div className="bg-accent/10 rounded-lg p-3">
                  <p className="text-xs text-accent font-medium mb-1">💡 Sugerencia</p>
                  <p className="text-sm text-foreground-secondary">
                    Basado en tu historial, un proyecto similar podría cotizarse entre{" "}
                    <strong className="text-foreground">
                      ${Math.round(clientHours * (selectedClient.monthly_rate / 160) * 1.3).toLocaleString()}
                    </strong>{" "}
                    y{" "}
                    <strong className="text-foreground">
                      ${Math.round(clientHours * (selectedClient.monthly_rate / 160) * 1.8).toLocaleString()}
                    </strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <Button
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={!title.trim() || !clientId || saving || generatingPdf}
              className="w-full"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar borrador"}
            </Button>
            <Button
              onClick={handleSaveAndPdf}
              disabled={!title.trim() || !clientId || saving || generatingPdf}
              className="w-full"
            >
              {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <FileText className="h-4 w-4" />
                  Guardar y generar PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Quote Detail ─── */
function QuoteDetail({
  quoteId,
  onBack,
  onEdit,
}: {
  quoteId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}) {
  const { user } = useAuth();
  const [quote, setQuote] = useState<QuoteRow | null>(null);
  const [items, setItems] = useState<QuoteItemRow[]>([]);
  const [clientName, setClientName] = useState("");
  const [contactName, setContactName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchData = useCallback(async () => {
    const [qRes, itemsRes] = await Promise.all([
      supabase.from("quotes").select("*").eq("id", quoteId).single(),
      supabase.from("quote_items").select("*").eq("quote_id", quoteId).order("sort_order"),
    ]);
    if (qRes.data) {
      const q = qRes.data as QuoteRow;
      setQuote(q);

      const [clientRes, profileRes, agencyRes] = await Promise.all([
        supabase.from("clients").select("name, contact_name, email").eq("id", q.client_id).single(),
        supabase.from("profiles").select("name").eq("id", q.created_by).single(),
        supabase.from("agencies").select("name").eq("id", q.agency_id).single(),
      ]);
      if (clientRes.data) {
        setClientName(clientRes.data.name);
        setContactName(clientRes.data.contact_name || clientRes.data.name);
        setClientEmail(clientRes.data.email || "");
      }
      if (profileRes.data) setUserName(profileRes.data.name || "");
      if (agencyRes.data) setAgencyName(agencyRes.data.name || "");
    }
    setItems((itemsRes.data || []) as QuoteItemRow[]);
    setLoading(false);
  }, [quoteId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (newStatus: string) => {
    const updates: {
      status: string;
      sent_at?: string;
      accepted_at?: string;
      rejected_at?: string;
    } = { status: newStatus };
    if (newStatus === "sent") updates.sent_at = new Date().toISOString();
    if (newStatus === "accepted") updates.accepted_at = new Date().toISOString();
    if (newStatus === "rejected") updates.rejected_at = new Date().toISOString();

    await supabase.from("quotes").update(updates).eq("id", quoteId);
    toast.success(`Cotización marcada como ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    fetchData();
  };

  const generatePdf = async () => {
    setGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quote-pdf", {
        body: { quote_id: quoteId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      toast.success("PDF generado");
      fetchData();
    } catch {
      toast.error("Error al generar PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const copyEmailText = () => {
    if (!quote) return;
    const itemsList = items
      .map((it) => `- ${it.description}: ${it.quantity} ${it.unit} × $${it.unit_price.toLocaleString()} = $${(it.subtotal || it.quantity * it.unit_price).toLocaleString()}`)
      .join("\n");

    const taxNote = quote.tax_enabled ? "IVA incluido" : "sin IVA";
    const termsShort = quote.payment_terms
      ? quote.payment_terms.split(".")[0]
      : "";

    const text = `Hola ${contactName},\n\nTe comparto la cotización para ${quote.title}.\n\nResumen:\n${itemsList}\n\nTotal: $${quote.total_amount.toLocaleString()} ${quote.currency} (${taxNote})\n${termsShort ? `Condiciones: ${termsShort}\n` : ""}${quote.valid_until ? `Válida hasta: ${new Date(quote.valid_until).toLocaleDateString("es-MX")}\n` : ""}\nAdjunto el PDF con el detalle completo. Quedo atento a tus comentarios.\n\nSaludos,\n${userName}${agencyName ? `\n${agencyName}` : ""}`;

    navigator.clipboard.writeText(text);
    toast.success("Texto copiado al portapapeles");
  };

  const handleDuplicate = async () => {
    if (!quote || !user) return;
    const { data: profile } = await supabase.from("profiles").select("agency_id").eq("id", user.id).single();
    if (!profile?.agency_id) return;

    const { data: newQuote } = await supabase.from("quotes").insert({
      agency_id: profile.agency_id,
      client_id: quote.client_id,
      project_id: quote.project_id,
      title: `${quote.title} (copia)`,
      description: quote.description,
      subtotal: quote.subtotal,
      discount_type: quote.discount_type,
      discount_value: quote.discount_value,
      tax_enabled: quote.tax_enabled,
      tax_rate: quote.tax_rate,
      total_amount: quote.total_amount,
      currency: quote.currency,
      valid_until: quote.valid_until,
      created_by: user.id,
      payment_terms: quote.payment_terms,
      notes_to_client: quote.notes_to_client,
    }).select("id").single();

    if (newQuote && items.length > 0) {
      await supabase.from("quote_items").insert(
        items.map((it) => ({
          quote_id: newQuote.id,
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price,
          sort_order: it.sort_order,
        }))
      );
    }

    toast.success("Cotización duplicada");
    onEdit(newQuote!.id);
  };

  if (loading || !quote) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
      </div>
    );
  }

  const cfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
  const discountAmount = quote.discount_type === "percentage"
    ? quote.subtotal * (quote.discount_value / 100)
    : quote.discount_value;
  const afterDiscount = quote.subtotal - discountAmount;
  const taxAmount = quote.tax_enabled ? afterDiscount * (quote.tax_rate / 100) : 0;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-foreground-secondary hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Cotizaciones
      </button>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-h1 text-foreground">{quote.title}</h1>
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-foreground-secondary">
            {clientName} · {new Date(quote.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => onEdit(quoteId)}>
            <Edit className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDuplicate}>
            <Copy className="h-3.5 w-3.5" /> Duplicar
          </Button>
          <Button variant="secondary" size="sm" onClick={copyEmailText}>
            <Copy className="h-3.5 w-3.5" /> Copiar email
          </Button>
          {quote.pdf_url ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => window.open(quote.pdf_url!, "_blank")}>
                <Download className="h-3.5 w-3.5" /> Descargar PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={generatePdf} disabled={generatingPdf}>
                {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Regenerar
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={generatePdf} disabled={generatingPdf}>
              {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              Generar PDF
            </Button>
          )}
        </div>
      </div>

      {quote.description && (
        <div className="border border-border rounded-lg p-4 mb-6">
          <p className="text-micro text-foreground-muted mb-1">Alcance</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{quote.description}</p>
        </div>
      )}

      {/* Items table */}
      <div className="border border-border rounded-lg overflow-hidden mb-6">
        <div className="grid grid-cols-[1fr_80px_100px_100px_100px] gap-2 px-4 py-2 bg-background-secondary text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
          <span>Descripción</span>
          <span>Cant.</span>
          <span>Unidad</span>
          <span>P. unitario</span>
          <span className="text-right">Subtotal</span>
        </div>
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-[1fr_80px_100px_100px_100px] gap-2 px-4 py-3 border-t border-border text-sm">
            <span className="text-foreground font-medium">{it.description}</span>
            <span className="text-foreground-secondary">{it.quantity}</span>
            <span className="text-foreground-secondary">{it.unit}</span>
            <span className="text-foreground-secondary">${it.unit_price.toLocaleString()}</span>
            <span className="text-right font-medium text-foreground">${(it.subtotal || it.quantity * it.unit_price).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border border-border rounded-lg p-4 mb-6 max-w-md ml-auto space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">Subtotal</span>
          <span className="text-foreground">${quote.subtotal.toLocaleString()}</span>
        </div>
        {quote.discount_value > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-foreground-secondary">
              Descuento ({quote.discount_type === "percentage" ? `${quote.discount_value}%` : `$${quote.discount_value}`})
            </span>
            <span className="text-foreground-secondary">-${discountAmount.toLocaleString()}</span>
          </div>
        )}
        {quote.tax_enabled && (
          <div className="flex justify-between text-sm">
            <span className="text-foreground-secondary">IVA ({quote.tax_rate}%)</span>
            <span className="text-foreground-secondary">${taxAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2">
          <span className="text-base font-bold text-foreground">TOTAL</span>
          <span className="text-xl font-bold text-foreground">${quote.total_amount.toLocaleString()} {quote.currency}</span>
        </div>
      </div>

      {/* Payment terms & notes */}
      {quote.payment_terms && (
        <div className="border border-border rounded-lg p-4 mb-4">
          <p className="text-micro text-foreground-muted mb-1">Condiciones de pago</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{quote.payment_terms}</p>
        </div>
      )}
      {quote.notes_to_client && (
        <div className="border border-border rounded-lg p-4 mb-6">
          <p className="text-micro text-foreground-muted mb-1">Notas al cliente</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{quote.notes_to_client}</p>
        </div>
      )}

      {/* Status actions */}
      <div className="flex gap-2 flex-wrap">
        {quote.status === "draft" && (
          <Button onClick={() => updateStatus("sent")}>
            <Send className="h-4 w-4" /> Marcar como enviada
          </Button>
        )}
        {quote.status === "sent" && (
          <>
            <Button variant="accent" onClick={() => updateStatus("accepted")}>
              <Check className="h-4 w-4" /> Aceptada
            </Button>
            <Button variant="danger" onClick={() => updateStatus("rejected")}>
              <X className="h-4 w-4" /> Rechazada
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
