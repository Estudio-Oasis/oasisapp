import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { X, ArrowRight, Loader2, Check, Rocket } from "lucide-react";
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

const PROFILE_TYPES = [
  { value: "freelancer", label: "Freelancer", emoji: "🎨" },
  { value: "founder", label: "Fundador", emoji: "🚀" },
  { value: "employee", label: "Empleado", emoji: "💼" },
  { value: "other", label: "Otro", emoji: "✨" },
];

export function OnboardingWizard({ open, userName, onComplete, onSkip }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isBeta = searchParams.get("ref") === "beta";
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — Profile
  const [displayName, setDisplayName] = useState(userName || "");
  const [profileType, setProfileType] = useState("");
  const [country, setCountry] = useState("MX");
  const [currency, setCurrency] = useState("MXN");
  const [incomeTarget, setIncomeTarget] = useState("");
  const [availableHours, setAvailableHours] = useState("40");

  // Step 2 — First client
  const [clientName, setClientName] = useState("");
  const [billingType, setBillingType] = useState("monthly");

  // Created data
  const [createdAgencyId, setCreatedAgencyId] = useState<string | null>(null);
  const [clientCreated, setClientCreated] = useState(false);

  if (!open) return null;

  const handleClose = async () => {
    if (user) {
      await supabase.from("profiles").update({ onboarding_skipped: true } as any).eq("id", user.id);
    }
    onSkip();
  };

  const handleStep1 = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Guard: prevent double-creation
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("agency_id")
        .eq("id", user.id)
        .single();
      if (existingProfile?.agency_id) {
        setCreatedAgencyId(existingProfile.agency_id);
        setStep(2);
        setSaving(false);
        return;
      }

      // Create a personal workspace (agency record behind the scenes)
      const workspaceName = displayName.trim() || userName || "Mi espacio";
      const { data: agency, error: agencyErr } = await supabase
        .from("agencies")
        .insert({
          name: workspaceName,
          country,
          base_currency: currency,
          ...(isBeta ? { plan_override: "agencia" } : {}),
        } as any)
        .select("id")
        .single();
      if (agencyErr) throw agencyErr;

      const agencyId = agency!.id;
      setCreatedAgencyId(agencyId);

      // Update profile
      await supabase.from("profiles").update({
        agency_id: agencyId,
        name: displayName.trim() || null,
        job_title: profileType || null,
        role: "admin",
        profile_type: profileType || null,
        income_target: incomeTarget ? Number(incomeTarget) : null,
        income_currency: currency,
        available_hours_per_week: availableHours ? Number(availableHours) : null,
      } as any).eq("id", user.id);

      // Create agency_settings
      await supabase.from("agency_settings").insert({
        agency_id: agencyId,
        default_currency: currency,
      });

      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error("Error al configurar tu espacio");
    } finally {
      setSaving(false);
    }
  };

  const handleStep2 = async (skip: boolean) => {
    if (skip) { setStep(3); return; }
    if (!clientName.trim() || !createdAgencyId) return;
    setSaving(true);
    try {
      await supabase.from("clients").insert({
        agency_id: createdAgencyId,
        name: clientName.trim(),
        billing_type: billingType as any,
        currency,
      });
      setClientCreated(true);
      setStep(3);
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

  const TOTAL_STEPS = 3;

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
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-foreground" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step 1 — How do you work? */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">¿Cómo trabajas? 👋</h1>
              <p className="text-foreground-secondary">Configura tu espacio en un minuto</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-label mb-1.5 block">Tu nombre</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-label mb-1.5 block">¿Cómo te describes?</label>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_TYPES.map((pt) => (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => setProfileType(pt.value === profileType ? "" : pt.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        profileType === pt.value
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      {pt.emoji} {pt.label}
                    </button>
                  ))}
                </div>
              </div>
            <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-label mb-1.5 block">Moneda</label>
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

              {/* Economic basics */}
              <div>
                <label className="text-label mb-1.5 block">¿Cuánto quieres ganar al mes?</label>
                <Input
                  type="number"
                  min={0}
                  value={incomeTarget}
                  onChange={(e) => setIncomeTarget(e.target.value)}
                  placeholder={`ej: 50,000 ${currency}`}
                />
              </div>
              <div>
                <label className="text-label mb-1.5 block">Horas disponibles por semana</label>
                <Input
                  type="number"
                  min={1}
                  max={80}
                  value={availableHours}
                  onChange={(e) => setAvailableHours(e.target.value)}
                  placeholder="40"
                />
              </div>
            </div>
            <Button onClick={handleStep1} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>Continuar <ArrowRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
        )}

        {/* Step 2 — First client */}
        {step === 2 && (
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
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handleStep2(false)} disabled={saving || !clientName.trim()} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>Agregar <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
              <Button variant="secondary" onClick={() => handleStep2(true)} disabled={saving}>
                Omitir
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Todo listo, {(displayName || userName).split(" ")[0]} 🎉
              </h1>
              <p className="text-foreground-secondary">Tu espacio está configurado</p>
            </div>

            <div className="border border-border rounded-lg p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span className="text-foreground">
                  {COUNTRIES.find((c) => c.value === country)?.label} · {currency}
                </span>
              </div>
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
