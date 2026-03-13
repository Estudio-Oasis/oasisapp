import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Agency } from "@/pages/Settings";

interface Props {
  agency: Agency;
  isAdmin: boolean;
  onUpdate: (agency: Agency) => void;
}

export function AgencyProfileTab({ agency, isAdmin, onUpdate }: Props) {
  const [form, setForm] = useState({ ...agency });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof Agency, value: string | null) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const { id, ...rest } = form;
    const { data, error } = await supabase
      .from("agencies")
      .update(rest)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      toast.error("Failed to save");
    } else if (data) {
      onUpdate(data as Agency);
      toast.success("Agency updated");
    }
    setSaving(false);
  };

  const disabled = !isAdmin;

  return (
    <div className="space-y-8">
      {/* General */}
      <Section title="General">
        <Field label="Agency name">
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            disabled={disabled}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Base currency">
            <Select
              value={form.base_currency}
              onValueChange={(v) => set("base_currency", v)}
              disabled={disabled}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="MXN">MXN</SelectItem>
                <SelectItem value="COP">COP</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Country">
            <Input
              value={form.country || ""}
              onChange={(e) => set("country", e.target.value || null)}
              placeholder="e.g. Mexico"
              disabled={disabled}
            />
          </Field>
        </div>
        <Field label="Auto-join email domain">
          <Input
            value={form.allowed_email_domain || ""}
            onChange={(e) => set("allowed_email_domain", e.target.value || null)}
            placeholder="e.g. oasis.studio"
            disabled={disabled}
          />
          <p className="text-xs text-foreground-muted mt-1">
            Users signing up with this email domain will auto-join your agency
          </p>
        </Field>
      </Section>

      {/* Fiscal */}
      <Section title="Fiscal information">
        <Field label="Legal name / Razón social">
          <Input
            value={form.legal_name || ""}
            onChange={(e) => set("legal_name", e.target.value || null)}
            disabled={disabled}
          />
        </Field>
        <Field label="Tax ID / RFC">
          <Input
            value={form.tax_id || ""}
            onChange={(e) => set("tax_id", e.target.value || null)}
            disabled={disabled}
          />
        </Field>
        <Field label="Fiscal address">
          <Input
            value={form.fiscal_address || ""}
            onChange={(e) => set("fiscal_address", e.target.value || null)}
            disabled={disabled}
          />
        </Field>
      </Section>

      {/* Banking */}
      <Section title="Banking">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bank name">
            <Input
              value={form.bank_name || ""}
              onChange={(e) => set("bank_name", e.target.value || null)}
              disabled={disabled}
            />
          </Field>
          <Field label="Account number">
            <Input
              value={form.bank_account_number || ""}
              onChange={(e) => set("bank_account_number", e.target.value || null)}
              disabled={disabled}
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="CLABE">
            <Input
              value={form.bank_clabe || ""}
              onChange={(e) => set("bank_clabe", e.target.value || null)}
              disabled={disabled}
            />
          </Field>
          <Field label="Routing">
            <Input
              value={form.bank_routing || ""}
              onChange={(e) => set("bank_routing", e.target.value || null)}
              disabled={disabled}
            />
          </Field>
          <Field label="SWIFT">
            <Input
              value={form.bank_swift || ""}
              onChange={(e) => set("bank_swift", e.target.value || null)}
              disabled={disabled}
            />
          </Field>
        </div>
      </Section>

      {isAdmin && (
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save changes
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
