import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, X, Clock, FileText } from "lucide-react";

interface QuotePublic {
  id: string;
  title: string;
  description: string | null;
  status: string;
  subtotal: number;
  discount_type: string;
  discount_value: number;
  tax_enabled: boolean;
  tax_rate: number;
  total_amount: number;
  currency: string;
  valid_until: string | null;
  payment_terms: string | null;
  notes_to_client: string | null;
  agency_id: string;
  client_id: string;
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number | null;
  sort_order: number;
}

export default function QuoteApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const [quote, setQuote] = useState<QuotePublic | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [agencyName, setAgencyName] = useState("");
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responded, setResponded] = useState<"accepted" | "rejected" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQuote = useCallback(async () => {
    if (!token) { setError("Token inválido"); setLoading(false); return; }

    const { data: quoteData, error: qErr } = await supabase
      .from("quotes")
      .select("*")
      .eq("approval_token", token)
      .maybeSingle();

    if (qErr || !quoteData) {
      setError("Cotización no encontrada o link inválido");
      setLoading(false);
      return;
    }

    const q = quoteData as QuotePublic;

    // Check if already responded
    if (q.status === "accepted") { setQuote(q); setResponded("accepted"); }
    else if (q.status === "rejected") { setQuote(q); setResponded("rejected"); }
    else if (q.valid_until && new Date(q.valid_until) < new Date()) {
      setQuote(q);
      setError("Esta cotización ha expirado");
      setLoading(false);
      return;
    }

    setQuote(q);

    // Fetch related data
    const [itemsRes, agencyRes, clientRes] = await Promise.all([
      supabase.from("quote_items").select("*").eq("quote_id", q.id).order("sort_order"),
      supabase.from("agencies").select("name, logo_url").eq("id", q.agency_id).maybeSingle(),
      supabase.from("clients").select("name").eq("id", q.client_id).maybeSingle(),
    ]);

    setItems((itemsRes.data || []) as QuoteItem[]);
    if (agencyRes.data) {
      setAgencyName(agencyRes.data.name);
      setAgencyLogo(agencyRes.data.logo_url);
    }
    if (clientRes.data) setClientName(clientRes.data.name);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchQuote(); }, [fetchQuote]);

  const handleApprove = async () => {
    if (!quote) return;
    setSubmitting(true);
    await supabase.from("quotes").update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    }).eq("id", quote.id);
    setResponded("accepted");
    setSubmitting(false);
  };

  const handleReject = async () => {
    if (!quote) return;
    setSubmitting(true);
    await supabase.from("quotes").update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: rejectionReason || null,
    }).eq("id", quote.id);
    setResponded("rejected");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <FileText className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Cotización no disponible</h1>
          <p className="text-sm text-foreground-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const discountAmount = quote.discount_type === "percentage"
    ? quote.subtotal * (quote.discount_value / 100)
    : quote.discount_value;
  const afterDiscount = quote.subtotal - discountAmount;
  const taxAmount = quote.tax_enabled ? afterDiscount * (quote.tax_rate / 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          {agencyLogo && <img src={agencyLogo} alt="" className="h-10 mx-auto mb-3 object-contain" />}
          <p className="text-sm text-foreground-secondary">{agencyName}</p>
          <h1 className="text-2xl font-bold text-foreground mt-2">{quote.title}</h1>
          <p className="text-sm text-foreground-muted mt-1">Para: {clientName}</p>
          {quote.valid_until && (
            <p className="text-xs text-foreground-muted mt-1 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              Válida hasta {new Date(quote.valid_until).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>

        {/* Already responded */}
        {responded && (
          <div className={`rounded-xl p-6 text-center mb-8 ${responded === "accepted" ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"}`}>
            {responded === "accepted" ? (
              <>
                <Check className="h-8 w-8 text-success mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">Cotización aprobada</h2>
                <p className="text-sm text-foreground-secondary mt-1">El equipo ha sido notificado. Gracias por tu confianza.</p>
              </>
            ) : (
              <>
                <X className="h-8 w-8 text-destructive mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">Cotización rechazada</h2>
                <p className="text-sm text-foreground-secondary mt-1">El equipo ha sido notificado de tu decisión.</p>
              </>
            )}
          </div>
        )}

        {/* Description */}
        {quote.description && (
          <div className="mb-6">
            <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">Alcance del trabajo</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{quote.description}</p>
          </div>
        )}

        {/* Items */}
        <div className="border border-border rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-[1fr_60px_80px_80px] gap-2 px-4 py-2 bg-background-secondary text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
            <span>Descripción</span>
            <span>Cant.</span>
            <span>P. Unit.</span>
            <span className="text-right">Subtotal</span>
          </div>
          {items.map(it => (
            <div key={it.id} className="grid grid-cols-[1fr_60px_80px_80px] gap-2 px-4 py-3 border-t border-border text-sm">
              <span className="text-foreground">{it.description}</span>
              <span className="text-foreground-secondary">{it.quantity} {it.unit}</span>
              <span className="text-foreground-secondary">${it.unit_price.toLocaleString()}</span>
              <span className="text-right font-medium text-foreground">${(it.subtotal || it.quantity * it.unit_price).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border border-border rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-secondary">Subtotal</span>
            <span className="text-foreground">${quote.subtotal.toLocaleString()}</span>
          </div>
          {quote.discount_value > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-foreground-secondary">Descuento</span>
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
            <span className="text-lg font-bold text-foreground">TOTAL</span>
            <span className="text-xl font-bold text-foreground">${quote.total_amount.toLocaleString()} {quote.currency}</span>
          </div>
        </div>

        {/* Payment terms */}
        {quote.payment_terms && (
          <div className="mb-4">
            <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">Condiciones de pago</p>
            <p className="text-sm text-foreground">{quote.payment_terms}</p>
          </div>
        )}

        {/* Notes */}
        {quote.notes_to_client && (
          <div className="mb-8">
            <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">Notas</p>
            <p className="text-sm text-foreground-secondary">{quote.notes_to_client}</p>
          </div>
        )}

        {/* Action buttons */}
        {!responded && !error && (
          <div className="space-y-4">
            {!rejecting ? (
              <div className="flex gap-3">
                <Button onClick={handleApprove} disabled={submitting} className="flex-1 h-12 text-base bg-success hover:bg-success/90 text-success-foreground">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
                  Aprobar cotización
                </Button>
                <Button onClick={() => setRejecting(true)} variant="secondary" className="flex-1 h-12 text-base">
                  <X className="h-5 w-5" /> Rechazar / Cambios
                </Button>
              </div>
            ) : (
              <div className="border border-border rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">¿Qué necesitas cambiar?</p>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Describe los cambios que necesitas..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleReject} disabled={submitting} variant="danger" className="flex-1">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar rechazo"}
                  </Button>
                  <Button onClick={() => setRejecting(false)} variant="secondary">Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expired notice */}
        {error && quote && (
          <div className="rounded-xl border border-foreground-muted/20 p-4 text-center">
            <Clock className="h-6 w-6 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm text-foreground-secondary">{error}</p>
          </div>
        )}

        <p className="text-center text-[10px] text-foreground-muted mt-8">Cotización generada con OasisOS</p>
      </div>
    </div>
  );
}
