import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgencyProfileTab } from "@/components/settings/AgencyProfileTab";
import { MembersTab } from "@/components/settings/MembersTab";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { BillingSettingsTab } from "@/components/settings/BillingSettingsTab";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { useSubscription } from "@/hooks/useSubscription";
import { STRIPE_PLANS } from "@/lib/stripe-plans";
import { toast } from "sonner";
import { CheckCircle2, Crown, ExternalLink } from "lucide-react";

export interface Agency {
  id: string;
  name: string;
  logo_url: string | null;
  base_currency: string;
  country: string | null;
  tax_id: string | null;
  legal_name: string | null;
  fiscal_address: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_routing: string | null;
  bank_clabe: string | null;
  bank_swift: string | null;
  allowed_email_domain: string | null;
}

export default function Settings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isFree } = usePlan();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("member");
  const [profile, setProfile] = useState<{ name: string; email: string; work_start_hour: number; work_end_hour: number } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("agency_id, role, name, email, work_start_hour, work_end_hour")
      .eq("id", user.id)
      .single();

    if (prof?.role) setUserRole(prof.role);
    if (prof) setProfile({ name: prof.name || "", email: prof.email || "", work_start_hour: prof.work_start_hour, work_end_hour: prof.work_end_hour });

    if (prof?.agency_id) {
      const { data } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", prof.agency_id)
        .single();
      if (data) setAgency(data as Agency);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateAgency = async (name: string) => {
    if (!user) return;
    const agencyId = crypto.randomUUID();
    const { error: insertError } = await supabase.from("agencies").insert({ id: agencyId, name });
    if (insertError) { toast.error("No se pudo crear la agencia"); return; }
    const { error: profileError } = await supabase.from("profiles").update({ agency_id: agencyId, role: "admin" as const }).eq("id", user.id);
    if (profileError) { toast.error("Agencia creada, pero no se pudo vincular tu perfil"); return; }
    await fetchData();
    setUserRole("admin");
    toast.success("¡Agencia creada!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  // Free user without agency — show individual profile
  if (!agency && isFree) {
    return <FreeProfileView profile={profile} userId={user?.id} onUpdate={fetchData} />;
  }

  // Pro user without agency — prompt to create
  if (!agency) {
    return <CreateAgencyPrompt onCreate={handleCreateAgency} />;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-h1 text-foreground">{t("settings.title")}</h1>
      <p className="text-small text-foreground-secondary mt-1">
        {t("settings.subtitle")}
      </p>

      <Tabs defaultValue="agency" className="mt-6">
        <TabsList className="bg-background-secondary">
          <TabsTrigger value="agency">{t("settings.agencyProfile")}</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
          <TabsTrigger value="members">{t("settings.members")}</TabsTrigger>
          <TabsTrigger value="integrations">{t("settings.integrations")}</TabsTrigger>
        </TabsList>

        <TabsContent value="agency" className="mt-4">
          <AgencyProfileTab
            agency={agency}
            isAdmin={userRole === "admin"}
            onUpdate={(updated) => setAgency(updated)}
          />
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <BillingSettingsTab
            agencyId={agency.id}
            isAdmin={userRole === "admin"}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MembersTab
            agencyId={agency.id}
            isAdmin={userRole === "admin"}
            allowedDomain={agency.allowed_email_domain}
          />
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <IntegrationsTab
            agencyId={agency.id}
            isAdmin={userRole === "admin"}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Free individual profile ── */
function FreeProfileView({ profile, userId, onUpdate }: { profile: { name: string; email: string; work_start_hour: number; work_end_hour: number } | null; userId?: string; onUpdate: () => void }) {
  const [name, setName] = useState(profile?.name || "");
  const [startHour, setStartHour] = useState(profile?.work_start_hour ?? 9);
  const [endHour, setEndHour] = useState(profile?.work_end_hour ?? 18);
  const [saving, setSaving] = useState(false);

  // Economic profile state
  const [incomeTarget, setIncomeTarget] = useState<string>("");
  const [incomeMinimum, setIncomeMinimum] = useState<string>("");
  const [incomeCurrency, setIncomeCurrency] = useState("MXN");
  const [availableHours, setAvailableHours] = useState<string>("");
  const [workDays, setWorkDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [profileType, setProfileType] = useState<string>("");
  const [economyLoaded, setEconomyLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("income_target, income_minimum, income_currency, available_hours_per_week, work_days, profile_type")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setIncomeTarget(data.income_target != null ? String(data.income_target) : "");
          setIncomeMinimum(data.income_minimum != null ? String(data.income_minimum) : "");
          setIncomeCurrency((data.income_currency as string) || "MXN");
          setAvailableHours(data.available_hours_per_week != null ? String(data.available_hours_per_week) : "");
          setWorkDays((data.work_days as string[]) || ["mon", "tue", "wed", "thu", "fri"]);
          setProfileType((data.profile_type as string) || "");
        }
        setEconomyLoaded(true);
      });
  }, [userId]);

  // Calculate rates locally
  const hrs = Number(availableHours) || 0;
  const monthlyHours = hrs * 4.33;
  const rateTarget = hrs > 0 && incomeTarget ? Math.round((Number(incomeTarget) / monthlyHours) * 100) / 100 : null;
  const rateMinimum = hrs > 0 && incomeMinimum ? Math.round((Number(incomeMinimum) / monthlyHours) * 100) / 100 : null;
  const ratePremium = rateTarget ? Math.round(rateTarget * 1.3 * 100) / 100 : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: name.trim(),
      work_start_hour: startHour,
      work_end_hour: endHour,
      income_target: incomeTarget ? Number(incomeTarget) : null,
      income_minimum: incomeMinimum ? Number(incomeMinimum) : null,
      income_currency: incomeCurrency,
      available_hours_per_week: availableHours ? Number(availableHours) : null,
      work_days: workDays,
      profile_type: profileType || null,
    } as any).eq("id", userId);
    setSaving(false);
    if (error) { toast.error("No se pudo guardar"); return; }
    toast.success("Perfil actualizado");
    onUpdate();
  };

  const DAYS = [
    { key: "mon", label: "L" },
    { key: "tue", label: "M" },
    { key: "wed", label: "Mi" },
    { key: "thu", label: "J" },
    { key: "fri", label: "V" },
    { key: "sat", label: "S" },
    { key: "sun", label: "D" },
  ];

  const PROFILE_TYPES = [
    { value: "freelancer", label: "Freelancer", emoji: "🎨" },
    { value: "founder", label: "Fundador", emoji: "🚀" },
    { value: "employee", label: "Empleado", emoji: "💼" },
    { value: "other", label: "Otro", emoji: "✨" },
  ];

  const CURRENCIES = [
    { value: "MXN", label: "MXN" },
    { value: "USD", label: "USD" },
    { value: "COP", label: "COP" },
    { value: "ARS", label: "ARS" },
    { value: "CLP", label: "CLP" },
    { value: "EUR", label: "EUR" },
  ];

  return (
    <div className="max-w-lg">
      <h1 className="text-h1 text-foreground">Mi perfil</h1>
      <p className="text-small text-foreground-secondary mt-1">
        Configura tu perfil y modelo económico
      </p>

      <form onSubmit={handleSave} className="mt-8 space-y-5">
        {/* Basic info */}
        <div className="space-y-1.5">
          <label className="text-label">Nombre</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
        </div>

        <div className="space-y-1.5">
          <label className="text-label">Correo</label>
          <Input value={profile?.email || ""} disabled className="opacity-60" />
        </div>

        <div className="space-y-1.5">
          <label className="text-label">¿Cómo te describes?</label>
          <div className="flex flex-wrap gap-2">
            {PROFILE_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setProfileType(profileType === pt.value ? "" : pt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-label">Inicio de jornada</label>
            <Input type="number" min={0} max={23} value={startHour} onChange={(e) => setStartHour(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-label">Fin de jornada</label>
            <Input type="number" min={0} max={23} value={endHour} onChange={(e) => setEndHour(Number(e.target.value))} />
          </div>
        </div>

        {/* Work days */}
        <div className="space-y-1.5">
          <label className="text-label">Días laborales</label>
          <div className="flex gap-1.5">
            {DAYS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setWorkDays(prev => prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key])}
                className={`h-8 w-8 rounded-full text-xs font-semibold border transition-colors ${
                  workDays.includes(d.key)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground-muted hover:bg-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Economic section */}
        <div className="border-t border-border pt-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Tu modelo económico</h2>
            <p className="text-[11px] text-foreground-secondary mt-0.5">Define tu objetivo y el sistema calcula tu valor hora</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-label">Ingreso mensual objetivo</label>
              <Input
                type="number"
                min={0}
                value={incomeTarget}
                onChange={(e) => setIncomeTarget(e.target.value)}
                placeholder="ej: 50000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Moneda</label>
              <select
                value={incomeCurrency}
                onChange={(e) => setIncomeCurrency(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-label">Ingreso mínimo aceptable</label>
            <Input
              type="number"
              min={0}
              value={incomeMinimum}
              onChange={(e) => setIncomeMinimum(e.target.value)}
              placeholder="ej: 30000"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-label">Horas disponibles por semana</label>
            <Input
              type="number"
              min={1}
              max={80}
              value={availableHours}
              onChange={(e) => setAvailableHours(e.target.value)}
              placeholder="ej: 40"
            />
          </div>

          {/* Calculated rates */}
          {rateTarget && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2">
              <p className="text-[10px] font-semibold text-accent uppercase tracking-wider">Tus valores hora calculados</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {rateMinimum && (
                  <div>
                    <p className="text-lg font-bold text-foreground-secondary">${rateMinimum.toLocaleString()}</p>
                    <p className="text-[10px] text-foreground-muted">Mínimo</p>
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-accent">${rateTarget.toLocaleString()}</p>
                  <p className="text-[10px] text-foreground-muted">Objetivo</p>
                </div>
                {ratePremium && (
                  <div>
                    <p className="text-lg font-bold text-foreground">${ratePremium.toLocaleString()}</p>
                    <p className="text-[10px] text-foreground-muted">Premium</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-foreground-muted text-center">{incomeCurrency}/hr</p>
            </div>
          )}
        </div>

        <PlanSection />

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-border">
        <a
          href="https://tally.so/r/wMrqBp"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            import("@/lib/analytics").then(({ trackEvent }) =>
              trackEvent("feedback_clicked", { source: "settings" })
            );
          }}
          className="text-[12px] text-foreground-muted hover:text-foreground transition-colors"
        >
          ¿Ideas o feedback? Cuéntanos →
        </a>
      </div>
    </div>
  );
}

function CreateAgencyPrompt({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onCreate(name.trim());
    setSaving(false);
  };

  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light">
          <span className="text-xl">🏢</span>
        </div>
        <h2 className="text-h2 text-foreground mt-4">Crea tu equipo</h2>
        <p className="text-small text-foreground-secondary mt-2">
          Crea un espacio para gestionar a tu equipo, clientes y operación.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="text"
            placeholder="Nombre de tu agencia"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "Creando…" : "Crear agencia →"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Plan / Subscription section ── */
function PlanSection() {
  const { subscribed, planName, subscriptionEnd, loading, openCheckout, openPortal } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      await openCheckout(priceId);
    } catch {
      toast.error("No se pudo iniciar el checkout");
    }
    setCheckoutLoading(null);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-background-secondary p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (subscribed) {
    return (
      <div className="rounded-lg border-2 border-accent bg-accent/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">{planName || "Plan de equipo"}</span>
        </div>
        {subscriptionEnd && (
          <p className="text-[11px] text-foreground-secondary">
            Próxima renovación: {new Date(subscriptionEnd).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        <Button variant="outline" size="sm" onClick={openPortal} className="mt-2 gap-1.5">
          Administrar suscripción <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-background-secondary p-3">
        <p className="text-[12px] text-foreground-secondary">
          <span className="font-semibold text-foreground">Bitácora Personal</span> · Registro ilimitado, 14 días de historial.
        </p>
      </div>
      <p className="text-[12px] font-medium text-foreground-secondary">Pasa a un plan de equipo:</p>
      <div className="grid gap-2">
        {Object.values(STRIPE_PLANS).map((plan) => (
          <div key={plan.price_id} className={`rounded-lg border p-3 flex items-center justify-between ${plan.popular ? "border-accent bg-accent/5" : "border-border"}`}>
            <div>
              <span className="text-sm font-semibold text-foreground">{plan.name}</span>
              {plan.popular && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">Popular</span>}
              <p className="text-[11px] text-foreground-secondary">{plan.seats} miembros · {plan.label}</p>
            </div>
            <Button
              size="sm"
              variant={plan.popular ? "default" : "outline"}
              disabled={checkoutLoading === plan.price_id}
              onClick={() => handleCheckout(plan.price_id)}
            >
              {checkoutLoading === plan.price_id ? "…" : "Elegir"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
