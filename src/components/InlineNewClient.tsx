import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { calculateCompleteness } from "@/lib/clientCompleteness";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

interface InlineNewClientProps {
  prefillName: string;
  onCreated: (client: Client) => void;
  onCancel: () => void;
}

export function InlineNewClient({ prefillName, onCreated, onCancel }: InlineNewClientProps) {
  const { user } = useAuth();
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  // Fetch agency_id once
  useState(() => {
    if (user) {
      supabase.from("profiles").select("agency_id").eq("id", user.id).single().then(({ data }) => {
        setAgencyId(data?.agency_id ?? null);
      });
    }
  });

  const handleCreate = async () => {
    if (!name.trim() || !agencyId) return;
    setSaving(true);
    try {
      const rate = parseFloat(monthlyRate) || 0;
      const fields = { name: name.trim(), email: email || null, monthly_rate: rate, currency, agency_id: agencyId };
      const score = calculateCompleteness({
        ...fields,
        phone: null,
        contact_name: null,
        payment_method: null,
        communication_channel: null,
        billing_entity: null,
      });
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...fields, completeness_score: score })
        .select()
        .single();
      if (error || !data) {
        toast.error("Failed to create client");
        return;
      }
      toast.success(`Client "${data.name}" created`);
      onCreated(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background-secondary border border-border rounded-xl p-4 mt-2 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">New client</span>
        <button
          onClick={onCancel}
          className="h-6 w-6 flex items-center justify-center rounded text-foreground-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div>
        <label className="text-label mb-1 block">Name *</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <label className="text-label mb-1 block">Email</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-label mb-1 block">Monthly rate</label>
          <Input
            value={monthlyRate}
            onChange={(e) => setMonthlyRate(e.target.value)}
            type="number"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-label mb-1 block">Currency</label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="MXN">MXN</SelectItem>
              <SelectItem value="COP">COP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button size="sm" onClick={handleCreate} disabled={!name.trim() || saving} className="flex-1">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create & select →"}
        </Button>
      </div>
    </div>
  );
}
