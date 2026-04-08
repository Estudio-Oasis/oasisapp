import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

interface BillingSettings {
  id?: string;
  agency_id: string;
  logo_url: string | null;
  company_name: string | null;
  company_address: string | null;
  company_email: string | null;
  company_phone: string | null;
  default_payment_terms: string | null;
  default_currency: string | null;
  bank_info: string | null;
}

interface Props {
  agencyId: string;
  isAdmin: boolean;
}

export function BillingSettingsTab({ agencyId, isAdmin }: Props) {
  const [form, setForm] = useState<BillingSettings>({
    agency_id: agencyId,
    logo_url: null,
    company_name: null,
    company_address: null,
    company_email: null,
    company_phone: null,
    default_payment_terms: "50% al aceptar la cotización, 50% a contra entrega del proyecto",
    default_currency: "USD",
    bank_info: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("agency_settings")
      .select("*")
      .eq("agency_id", agencyId)
      .single();
    if (data) {
      setForm({
        id: data.id,
        agency_id: agencyId,
        logo_url: (data as any).logo_url || null,
        company_name: (data as any).company_name || null,
        company_address: (data as any).company_address || null,
        company_email: (data as any).company_email || null,
        company_phone: (data as any).company_phone || null,
        default_payment_terms: (data as any).default_payment_terms || "50% al aceptar la cotización, 50% a contra entrega del proyecto",
        default_currency: (data as any).default_currency || "USD",
        bank_info: (data as any).bank_info || null,
      });
    }
    setLoading(false);
  }, [agencyId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const set = (key: keyof BillingSettings, value: string | null) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/${agencyId}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      set("logo_url", urlData.publicUrl);
      toast.success("Logo subido");
    } catch {
      toast.error("Error al subir logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        agency_id: agencyId,
        logo_url: form.logo_url,
        company_name: form.company_name,
        company_address: form.company_address,
        company_email: form.company_email,
        company_phone: form.company_phone,
        default_payment_terms: form.default_payment_terms,
        default_currency: form.default_currency,
        bank_info: form.bank_info,
      };

      if (form.id) {
        const { error } = await supabase
          .from("agency_settings")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agency_settings")
          .insert(payload);
        if (error) throw error;
      }
      toast.success("Datos de facturación guardados");
      fetchSettings();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
      </div>
    );
  }

  const disabled = !isAdmin;

  return (
    <div className="space-y-8">
      {/* Logo */}
      <Section title="Logo de la empresa">
        <div className="flex items-center gap-4">
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" className="h-16 w-auto max-w-[180px] rounded-lg border border-border object-contain bg-background p-1" />
          ) : (
            <div className="h-16 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-foreground-muted text-xs">
              Sin logo
            </div>
          )}
          {!disabled && (
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground-secondary hover:bg-background-secondary transition-colors">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? "Subiendo…" : "Subir logo"}
              </span>
            </label>
          )}
        </div>
      </Section>

      {/* Company info */}
      <Section title="Información de la empresa">
        <Field label="Nombre de la empresa">
          <Input value={form.company_name || ""} onChange={(e) => set("company_name", e.target.value || null)} placeholder="Ej: Estudio Oasis S.A. de C.V." disabled={disabled} />
        </Field>
        <Field label="Dirección">
          <Input value={form.company_address || ""} onChange={(e) => set("company_address", e.target.value || null)} placeholder="Dirección completa" disabled={disabled} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input type="email" value={form.company_email || ""} onChange={(e) => set("company_email", e.target.value || null)} placeholder="facturacion@empresa.com" disabled={disabled} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.company_phone || ""} onChange={(e) => set("company_phone", e.target.value || null)} placeholder="+52 55 1234 5678" disabled={disabled} />
          </Field>
        </div>
      </Section>

      {/* Defaults for quotes */}
      <Section title="Defaults para cotizaciones">
        <Field label="Moneda por defecto">
          <Select value={form.default_currency || "USD"} onValueChange={(v) => set("default_currency", v)} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="MXN">MXN</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Condiciones de pago (default)">
          <Textarea
            value={form.default_payment_terms || ""}
            onChange={(e) => set("default_payment_terms", e.target.value || null)}
            rows={2}
            className="resize-none text-sm"
            placeholder="Ej: 50% al aceptar, 50% a contra entrega"
            disabled={disabled}
          />
          <p className="text-[10px] text-foreground-muted mt-0.5">Este texto se pre-llena en cada nueva cotización</p>
        </Field>
      </Section>

      {/* Bank info */}
      <Section title="Datos bancarios (para PDFs)">
        <Field label="Información bancaria">
          <Textarea
            value={form.bank_info || ""}
            onChange={(e) => set("bank_info", e.target.value || null)}
            rows={3}
            className="resize-none text-sm"
            placeholder="Banco: BBVA&#10;Cuenta: 1234567890&#10;CLABE: 012345678901234567"
            disabled={disabled}
          />
          <p className="text-[10px] text-foreground-muted mt-0.5">Se muestra al pie de los PDFs de cotización</p>
        </Field>
      </Section>

      {isAdmin && (
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar datos de facturación
        </Button>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-h3 text-foreground">{title}</h3>
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-label mb-1 block">{label}</label>
      {children}
    </div>
  );
}
