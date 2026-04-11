import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Check, Zap, Users, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { STRIPE_PLANS } from "@/lib/stripe-plans";

const FREE_FEATURES = [
  "Timer ilimitado",
  "14 días de historial",
  "QuickSheet y launcher",
  "Entrada por voz",
  "Resumen diario",
];

const PRO_FEATURES = [
  "Todo lo del plan Solo",
  "Hub de equipo en tiempo real",
  "Hasta 6 miembros",
  "Clientes + Proyectos + Tareas",
  "Cotizaciones con PDF profesional",
  "Finanzas multi-moneda",
  "Vault de credenciales",
  "Panel de Admin",
  "Integración con Slack",
];

const AGENCY_FEATURES = [
  "Todo lo del plan Estudio",
  "Hasta 10 miembros",
  "Soporte prioritario",
  "Acceso anticipado a features",
  "Onboarding personalizado",
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const proMonthly = STRIPE_PLANS.team_6.price;
  const agencyMonthly = STRIPE_PLANS.team_10.price;
  const proAnnual = Math.round(proMonthly * 10);
  const agencyAnnual = Math.round(agencyMonthly * 10);

  const handleCheckout = async (priceId: string, planKey: string) => {
    if (!user) { navigate("/signup"); return; }
    setLoadingPlan(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { price_id: priceId } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Error al iniciar el pago");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
            <span className="text-[10px] text-background leading-none tracking-widest font-bold">O</span>
          </div>
          <span className="text-sm font-semibold text-foreground">OasisOS</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Button variant="secondary" size="sm" onClick={() => navigate("/bitacora")}>Ir al app</Button>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => navigate("/login")}>Iniciar sesión</Button>
              <Button size="sm" onClick={() => navigate("/signup")}>Registrarse</Button>
            </>
          )}
        </div>
      </nav>

      <div className="text-center pt-12 pb-8 px-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Planes simples, sin sorpresas</h1>
        <p className="text-foreground-secondary text-lg max-w-xl mx-auto mb-8">Empieza gratis. Escala cuando tu equipo crezca.</p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-foreground-muted"}`}>Mensual</span>
          <Switch checked={annual} onCheckedChange={setAnnual} />
          <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-foreground-muted"}`}>Anual</span>
          {annual && <span className="text-xs font-semibold text-success bg-success-light px-2 py-0.5 rounded-full">2 meses gratis</span>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SOLO */}
        <div className="border border-border rounded-xl p-6 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-foreground-secondary" />
              <h3 className="text-lg font-bold text-foreground">Solo</h3>
            </div>
            <p className="text-sm text-foreground-secondary mb-4">Bitácora Personal</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">$0</span>
              <span className="text-foreground-muted text-sm">/mes</span>
            </div>
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground-secondary">
                <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />{f}
              </li>
            ))}
          </ul>
          <Button variant="secondary" className="w-full" onClick={() => navigate(user ? "/bitacora" : "/signup")}>
            {user ? "Ya estás aquí" : "Empezar gratis"}
          </Button>
        </div>

        {/* ESTUDIO */}
        <div className="border-2 border-foreground rounded-xl p-6 flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-foreground text-background px-3 py-1 rounded-full">Más popular</span>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-foreground" />
              <h3 className="text-lg font-bold text-foreground">Estudio</h3>
            </div>
            <p className="text-sm text-foreground-secondary mb-4">Equipo hasta 6</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">${annual ? Math.round(proAnnual / 12) : proMonthly}</span>
              <span className="text-foreground-muted text-sm">/mes</span>
            </div>
            {annual && <p className="text-xs text-foreground-muted mt-1">${proAnnual}/año — ahorras ${proMonthly * 2}</p>}
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground-secondary">
                <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />{f}
              </li>
            ))}
          </ul>
          <Button className="w-full" disabled={loadingPlan === "pro"} onClick={() => handleCheckout(STRIPE_PLANS.team_6.price_id, "pro")}>
            {loadingPlan === "pro" ? "Redirigiendo..." : "Empezar 14 días gratis"}
          </Button>
        </div>

        {/* AGENCIA */}
        <div className="border border-border rounded-xl p-6 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-foreground-secondary" />
              <h3 className="text-lg font-bold text-foreground">Agencia</h3>
            </div>
            <p className="text-sm text-foreground-secondary mb-4">Equipo hasta 10</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">${annual ? Math.round(agencyAnnual / 12) : agencyMonthly}</span>
              <span className="text-foreground-muted text-sm">/mes</span>
            </div>
            {annual && <p className="text-xs text-foreground-muted mt-1">${agencyAnnual}/año — ahorras ${agencyMonthly * 2}</p>}
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {AGENCY_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground-secondary">
                <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />{f}
              </li>
            ))}
          </ul>
          <Button variant="secondary" className="w-full" disabled={loadingPlan === "agency"} onClick={() => handleCheckout(STRIPE_PLANS.team_10.price_id, "agency")}>
            {loadingPlan === "agency" ? "Redirigiendo..." : "Empezar 14 días gratis"}
          </Button>
        </div>
      </div>
    </div>
  );
}
