import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { X, ArrowRight, Plus, Trash2, Loader2, Check, Rocket } from "lucide-react";
import { toast } from "sonner";

interface OnboardingWizardProps {
  open: boolean;
  userName: string;
  onComplete: () => void;
  onSkip: () => void;
}

const COUNTRIES = [
  { value: "MX", label: "México" },
  { value: "CO", label: "Colombia" },
  { value: "AR", label: "Argentina" },
  { value: "CL", label: "Chile" },
  { value: "PE", label: "Perú" },
  { value: "EC", label: "Ecuador" },
  { value: "US", label: "Estados Unidos" },
  { value: "ES", label: "España" },
];

const CURRENCIES = [
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "USD", label: "USD — Dólar americano" },
  { value: "COP", label: "COP — Peso colombiano" },
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "CLP", label: "CLP — Peso chileno" },
];

const BILLING_TYPES = [
  { value: "monthly", label: "Retainer mensual" },
  { value: "project", label: "Por proyecto" },
  { value: "hourly", label: "Por hora" },
];

export function OnboardingWizard({ open, userName, onComplete, onSkip }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [agencyName, setAgencyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Step 2
  const [country, setCountry] = useState("MX");
  const [currency, setCurrency] = useState("MXN");

  // Step 3
  const [emails, setEmails] = useState<string[]>([""]);
  const [autoJoin, setAutoJoin] = useState(false);

  // Step 4
  const [clientName, setClientName] = useState("");
  const [billingType, setBillingType] = useState("monthly");
  const [monthlyRate, setMonthlyRate] = useState("");

  // Created data for summary
  const [createdAgencyId, setCreatedAgencyId] = useState<string | null>(null);
  const [invitesSent, setInvitesSent] = useState(0);
  const [clientCreated, setClientCreated] = useState(false);

  if (!open) return null;

  const handleClose = async () => {
    if (user) {
      await supabase.from("profiles").update({ onboarding_skipped: true } as any).eq("id", user.id);
    }
    onSkip();
  };

  const handleStep1 = async () => {
    if (!agencyName.trim() || !user) return;
    setSaving(true);
    try {
      // Guard: prevent double-creation
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("agency_id")
        .eq("id", user.id)
        .single();
      if (existingProfile?.agency_id) {
        onComplete();
        return;
      }

      // Create agency
      const { data: agency, error: agencyErr } = await supabase
        .from("agencies")
        .insert({ name: agencyName.trim(), country: "MX", base_currency: "USD" })
        .select("id")
        .single();
      if (agencyErr) throw agencyErr;

      const agencyId = agency!.id;
      setCreatedAgencyId(agencyId);

      // Update profile
      await supabase.from("profiles").update({
        agency_id: agencyId,
        job_title: jobTitle.trim() || null,
        role: "admin",
      } as any).eq("id", user.id);

      // Create agency_settings
      await supabase.from("agency_settings").insert({
        agency_id: agencyId,
      });

      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error("Error al crear la agencia");
    } finally {
      setSaving(false);
    }
  };

  const handleStep2 = async () => {
    if (!createdAgencyId) return;
    setSaving(true);
    try {
      await supabase.from("agencies").update({
        country,
        base_currency: currency,
      }).eq("id", createdAgencyId);

      await supabase.from("agency_settings").update({
        default_currency: currency,
      }).eq("agency_id", createdAgencyId);

      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleStep3 = async (skip: boolean) => {
    if (skip) { setStep(4); return; }
    setSaving(true);
    try {
      const validEmails = emails.filter((e) => e.trim() && e.includes("@"));
      let sent = 0;
      for (const email of validEmails) {
        const { error } = await supabase.functions.invoke("invite-member", {
          body: { email: email.trim(), role: "member" },
        });
        if (!error) sent++;
      }

      if (autoJoin && user?.email && createdAgencyId) {
        const domain = user.email.split("@")[1];
        if (domain) {
          await supabase.from("agencies").update({
            allowed_email_domain: domain,
          }).eq("id", createdAgencyId);
        }
      }

      setInvitesSent(sent);
      if (sent > 0) toast.success(`${sent} invitación(es) enviada(s)`);
      setStep(4);
    } catch (err) {
      console.error(err);
      toast.error("Error al enviar invitaciones");
    } finally {
      setSaving(false);
    }
  };

  const handleStep4 = async (skip: boolean) => {
    if (skip) { setStep(5); return; }
    if (!clientName.trim() || !createdAgencyId) return;
    setSaving(true);
    try {
      await supabase.from("clients").insert({
        agency_id: createdAgencyId,
        name: clientName.trim(),
        billing_type: billingType as any,
        monthly_rate: monthlyRate ? parseFloat(monthlyRate) : null,
        currency,
      });
      setClientCreated(true);
      setStep(5);
    } catch (err) {
      console.error(err);
      toast.error("Error al crear cliente");
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    if (user) {
      await supabase.from("profiles").update({ onboarded: true } as any).eq("id", user.id);
    }
    onComplete();
  };

  const addEmail = () => {
    if (emails.length < 3) setEmails([...emails, ""]);
  };

  const removeEmail = (idx: number) => {
    setEmails(emails.filter((_, i) => i !== idx));
  };

  const updateEmail = (idx: number, val: string) => {
    setEmails(emails.map((e, i) => (i === idx ? val : e)));
  };

  const userDomain = user?.email?.split("@")[1] || "";

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 h-8 w-8 flex items-center justify-center rounded-md hover:bg-background-secondary transition-colors text-foreground-muted"
        aria-label="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="w-full max-w-lg px-6">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-foreground" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Bienvenido a OasisOS 👋</h1>
              <p className="text-foreground-secondary">Configura tu agencia en 4 pasos rápidos</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-label mb-1.5 block">Nombre de la agencia *</label>
                <Input
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Ej: Studio Oasis"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-label mb-1.5 block">Tu cargo</label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ej: Director creativo, Fundador"
                />
              </div>
            </div>
            <Button onClick={handleStep1} disabled={!agencyName.trim() || saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>Empezar <ArrowRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
        )}

        {/* Step 2 — Country & Currency */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">¿Dónde opera tu agencia?</h1>
              <p className="text-foreground-secondary">Lo usaremos en tus cotizaciones y reportes</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-label mb-1.5 block">País</label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-label mb-1.5 block">Moneda base</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleStep2} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>Continuar <ArrowRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
        )}

        {/* Step 3 — Invite team */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Invita a tu equipo</h1>
              <p className="text-foreground-secondary">Puedes hacerlo después desde Ajustes</p>
            </div>
            <div className="space-y-3">
              {emails.map((email, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(idx, e.target.value)}
                    placeholder="correo@equipo.com"
                    className="flex-1"
                  />
                  {emails.length > 1 && (
                    <button onClick={() => removeEmail(idx)} className="text-foreground-muted hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {emails.length < 3 && (
                <button onClick={addEmail} className="text-sm text-accent hover:text-accent/80 flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Agregar otro
                </button>
              )}
            </div>

            {userDomain && (
              <label className="flex items-center gap-3 text-sm text-foreground-secondary cursor-pointer">
                <Switch checked={autoJoin} onCheckedChange={setAutoJoin} />
                Los correos @{userDomain} se unen automáticamente
              </label>
            )}

            <div className="flex gap-3">
              <Button onClick={() => handleStep3(false)} disabled={saving || !emails.some((e) => e.includes("@"))} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>Invitar y continuar <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
              <Button variant="secondary" onClick={() => handleStep3(true)} disabled={saving}>
                Omitir
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — First client */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">¿Con quién estás trabajando?</h1>
              <p className="text-foreground-secondary">Agrega tu primer cliente para empezar a registrar tiempo</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-label mb-1.5 block">Nombre del cliente</label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Acme Corp"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-label mb-1.5 block">Tipo de contrato</label>
                <Select value={billingType} onValueChange={setBillingType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BILLING_TYPES.map((b) => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-label mb-1.5 block">Tarifa mensual (opcional)</label>
                <Input
                  type="number"
                  value={monthlyRate}
                  onChange={(e) => setMonthlyRate(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handleStep4(false)} disabled={saving || !clientName.trim()} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>Agregar <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
              <Button variant="secondary" onClick={() => handleStep4(true)} disabled={saving}>
                Omitir
              </Button>
            </div>
          </div>
        )}

        {/* Step 5 — Done */}
        {step === 5 && (
          <div className="space-y-6 text-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Todo listo, {userName.split(" ")[0]} 🎉
              </h1>
              <p className="text-foreground-secondary">Tu agencia está configurada</p>
            </div>

            <div className="border border-border rounded-lg p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span className="text-foreground">Agencia: <strong>{agencyName}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span className="text-foreground">
                  {COUNTRIES.find((c) => c.value === country)?.label} · {currency}
                </span>
              </div>
              {invitesSent > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span className="text-foreground">{invitesSent} invitación(es) enviada(s)</span>
                </div>
              )}
              {clientCreated && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span className="text-foreground">Cliente: <strong>{clientName}</strong></span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button onClick={handleFinish} className="w-full">
                <Rocket className="h-4 w-4 mr-1" />
                Iniciar mi primera sesión
              </Button>
              <Button variant="secondary" onClick={handleFinish} className="w-full">
                Explorar el sistema
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
