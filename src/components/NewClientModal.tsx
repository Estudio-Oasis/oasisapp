import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { extractClientFromText, type ExtractedClientData, type AiSuggestion } from "@/lib/extractClient";
import {
  calculateCompleteness,
  getMissingFields,
  getCompletenessLevel,
} from "@/lib/clientCompleteness";
import { AiFieldHelper } from "@/components/AiFieldHelper";
import { RateBreakdown } from "@/components/RateBreakdown";
import { toast } from "sonner";

interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

interface ClientFormData {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  billing_entity: string;
  monthly_rate: string;
  currency: string;
  payment_frequency: string;
  payment_method: string;
  communication_channel: string;
  notes: string;
}

const emptyForm: ClientFormData = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  website: "",
  billing_entity: "",
  monthly_rate: "",
  currency: "USD",
  payment_frequency: "monthly",
  payment_method: "",
  communication_channel: "",
  notes: "",
};

function CompletenessBar({ form }: { form: ClientFormData }) {
  const score = calculateCompleteness({
    ...form,
    monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
  });
  const level = getCompletenessLevel(score);
  const missing = getMissingFields({
    ...form,
    monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
  });

  const colorClass =
    level === "complete"
      ? "bg-success"
      : level === "incomplete"
      ? "bg-accent"
      : "bg-destructive";

  return (
    <div className="mt-4">
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-small text-foreground-secondary mt-1">
        Score: {score}/100
        {missing.length > 0 && ` · Missing: ${missing.join(", ")}`}
      </p>
    </div>
  );
}

function ManualForm({
  form,
  setForm,
  onSave,
  saving,
}: {
  form: ClientFormData;
  setForm: (f: ClientFormData) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const update = (field: keyof ClientFormData, value: string) =>
    setForm({ ...form, [field]: value });

  const formContext = { ...form, monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : 0 };

  return (
    <div className="flex flex-col gap-6">
      {/* Basic info */}
      <div className="flex flex-col gap-4">
        <p className="text-micro text-foreground-muted">Basic info</p>
        <div>
          <label className="text-label mb-1 block">Client name *</label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Company or client name" />
        </div>
        <div>
          <label className="text-label mb-1 block">Contact name</label>
          <Input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} placeholder="Main contact person" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-label mb-1 block">Email</label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <label className="text-label mb-1 block">Phone</label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 555 000 0000" />
          </div>
        </div>
        <div>
          <label className="text-label mb-1 block">Website</label>
          <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Financials */}
      <div className="flex flex-col gap-4">
        <p className="text-micro text-foreground-muted">Financials</p>
        <div>
          <label className="text-label mb-1 block">Who pays (billing entity)</label>
          <Input value={form.billing_entity} onChange={(e) => update("billing_entity", e.target.value)} placeholder="Same as client name (leave empty if so)" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-label">Monthly rate</label>
              <AiFieldHelper
                action="rate_context"
                context={{ monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : 0, currency: form.currency, payment_frequency: form.payment_frequency }}
                readOnly
                label="Rate context"
              />
            </div>
            <Input type="number" value={form.monthly_rate} onChange={(e) => update("monthly_rate", e.target.value)} placeholder="0" />
            <RateBreakdown monthlyRate={form.monthly_rate ? parseFloat(form.monthly_rate) : null} paymentFrequency={form.payment_frequency} currency={form.currency} />
          </div>
          <div>
            <label className="text-label mb-1 block">Currency</label>
            <Input value={form.currency} onChange={(e) => update("currency", e.target.value)} placeholder="USD" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-label mb-1 block">Payment frequency</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-foreground"
              value={form.payment_frequency}
              onChange={(e) => update("payment_frequency", e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="biweekly">Biweekly</option>
              <option value="weekly">Weekly</option>
              <option value="project">Per project</option>
            </select>
          </div>
          <div>
            <label className="text-label mb-1 block">Payment method</label>
            <Input value={form.payment_method} onChange={(e) => update("payment_method", e.target.value)} placeholder="Wise, PayPal, Bank transfer..." />
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Communication */}
      <div className="flex flex-col gap-4">
        <p className="text-micro text-foreground-muted">Communication</p>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label className="text-label">Main channel</label>
            <AiFieldHelper
              action="channel_tips"
              context={{ communication_channel: form.communication_channel, name: form.name }}
              label="Channel tips"
            />
          </div>
          <Input value={form.communication_channel} onChange={(e) => update("communication_channel", e.target.value)} placeholder="Slack, WhatsApp, Email..." />
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Notes */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <label className="text-label">Notes</label>
          <AiFieldHelper
            action="enrich_notes"
            context={formContext}
            onResult={(r) => update("notes", r)}
            label="Enrich with AI"
          />
        </div>
        <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Any additional notes..." rows={4} />
      </div>

      <CompletenessBar form={form} />

      <Button onClick={onSave} disabled={saving || !form.name.trim()} className="w-full h-11">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save client"}
      </Button>
    </div>
  );
}

export function NewClientModal({ open, onClose, onCreated }: NewClientModalProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<string>("ai");
  const [aiText, setAiText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedClientData | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setAiText("");
      setExtracted(null);
      setSuggestions([]);
      setForm(emptyForm);
      setTab("ai");
    }
  }, [open]);

  const handleExtract = async () => {
    if (!aiText.trim()) return;
    setExtracting(true);
    try {
      const data = await extractClientFromText(aiText);
      setExtracted(data);
      setSuggestions(data.suggestions || []);
      setForm({
        name: data.name || "",
        contact_name: data.contact_name || "",
        email: data.email || "",
        phone: data.phone || "",
        website: data.website || "",
        billing_entity: data.billing_entity || "",
        monthly_rate: data.monthly_rate ? String(data.monthly_rate) : "",
        currency: data.currency || "USD",
        payment_frequency: data.payment_frequency || "monthly",
        payment_method: data.payment_method || "",
        communication_channel: data.communication_channel || "",
        notes: data.notes || "",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const applySuggestion = (suggestion: AiSuggestion) => {
    if (!suggestion.suggested_value || !extracted) return;
    const field = suggestion.field as keyof ExtractedClientData;

    // Update extracted preview
    const updated = { ...extracted, [field]: suggestion.suggested_value };
    setExtracted(updated);

    // Update form
    if (field in form) {
      setForm({ ...form, [field]: suggestion.suggested_value });
    }

    // Remove applied suggestion
    setSuggestions((prev) => prev.filter((s) => s !== suggestion));
  };

  const saveClient = async () => {
    if (!form.name.trim() || !user) return;
    setSaving(true);

    const score = calculateCompleteness({
      ...form,
      monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
    });

    const insertData: Record<string, unknown> = {
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
      completeness_score: score,
    };
    const { error } = await supabase.from("clients").insert(insertData as never);

    setSaving(false);

    if (error) {
      toast.error("Failed to save client");
      console.error(error);
      return;
    }

    toast.success("Client created!");
    onCreated?.();
    onClose();
  };

  if (!open) return null;

  const extractedScore = extracted
    ? calculateCompleteness({
        name: extracted.name,
        email: extracted.email,
        phone: extracted.phone,
        monthly_rate: extracted.monthly_rate,
        contact_name: extracted.contact_name,
        payment_method: extracted.payment_method,
        communication_channel: extracted.communication_channel,
        billing_entity: extracted.billing_entity,
      })
    : 0;
  const extractedLevel = getCompletenessLevel(extractedScore);
  const extractedMissing = extracted
    ? getMissingFields({
        name: extracted.name,
        email: extracted.email,
        phone: extracted.phone,
        monthly_rate: extracted.monthly_rate,
        contact_name: extracted.contact_name,
        payment_method: extracted.payment_method,
        communication_channel: extracted.communication_channel,
        billing_entity: extracted.billing_entity,
      })
    : [];

  const fields: { label: string; value: string | number | null | undefined }[] = extracted
    ? [
        { label: "Client name", value: extracted.name },
        { label: "Contact", value: extracted.contact_name },
        { label: "Email", value: extracted.email },
        { label: "Phone", value: extracted.phone },
        { label: "Billing entity", value: extracted.billing_entity },
        { label: "Rate", value: extracted.monthly_rate ? `${extracted.currency || "USD"} ${extracted.monthly_rate}` : null },
        { label: "Payment", value: extracted.payment_method },
        { label: "Frequency", value: extracted.payment_frequency },
        { label: "Channel", value: extracted.communication_channel },
        { label: "Notes", value: extracted.notes },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[480px] max-h-[90vh] overflow-y-auto bg-background border border-border rounded-lg p-6 mx-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-h2 text-foreground">New client</h2>
            <p className="text-small text-foreground-secondary mt-1">
              {tab === "ai"
                ? "Describe your client in plain text — AI will fill in the form"
                : "Fill in the client details manually"}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-tertiary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList className="bg-background-secondary w-full">
            <TabsTrigger value="ai" className="flex-1 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Intake
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="mt-4">
            <Textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder='e.g. New client, 7H Studios, brought in by Kajae who pays us $2,500 via Wise every two weeks. Main contact is Thomas Higgins, thomashiggins@gmail.com. We communicate on their Slack workspace.'
              className="min-h-[120px] resize-y"
            />

            <Button
              variant="accent"
              className="w-full h-11 mt-4"
              onClick={handleExtract}
              disabled={extracting || !aiText.trim()}
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract with AI
                </>
              )}
            </Button>

            {extracted && (
              <>
                <div className="mt-4 bg-background-secondary border border-border rounded-lg p-4">
                  <div className="grid gap-2">
                    {fields.map((f) => (
                      <div key={f.label} className="flex items-baseline gap-2">
                        <span className="text-micro text-foreground-muted w-28 shrink-0">{f.label}</span>
                        <span className={`text-sm ${f.value ? "text-foreground" : "text-foreground-muted"}`}>
                          {f.value ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Rate breakdown */}
                  {extracted.monthly_rate && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <RateBreakdown
                        monthlyRate={extracted.monthly_rate}
                        paymentFrequency={extracted.payment_frequency || "monthly"}
                        currency={extracted.currency || "USD"}
                      />
                    </div>
                  )}

                  {/* Completeness */}
                  <div className="mt-4">
                    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          extractedLevel === "complete"
                            ? "bg-success"
                            : extractedLevel === "incomplete"
                            ? "bg-accent"
                            : "bg-destructive"
                        }`}
                        style={{ width: `${extractedScore}%` }}
                      />
                    </div>
                    <p className="text-small text-foreground-secondary mt-1">
                      Score: {extractedScore}/100
                      {extractedMissing.length > 0 && ` · Missing: ${extractedMissing.join(", ")}`}
                    </p>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setTab("manual")}
                    >
                      Edit fields
                    </Button>
                    <Button className="flex-1" onClick={saveClient} disabled={saving || !form.name.trim()}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save client"}
                    </Button>
                  </div>
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-accent-foreground mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI noticed
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 bg-accent-light border border-accent rounded-lg px-3 py-2.5"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-micro text-accent-foreground">{s.field.replace(/_/g, " ")}</p>
                            <p className="text-small text-foreground">{s.issue}</p>
                            {s.suggested_value && (
                              <p className="text-small text-success font-medium mt-0.5">
                                Suggested: {s.suggested_value}
                              </p>
                            )}
                          </div>
                          {s.suggested_value && (
                            <button
                              onClick={() => applySuggestion(s)}
                              className="shrink-0 text-xs font-medium bg-background border border-accent text-accent-foreground rounded-md px-2.5 py-1 hover:bg-accent-light transition-colors"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <ManualForm form={form} setForm={setForm} onSave={saveClient} saving={saving} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
