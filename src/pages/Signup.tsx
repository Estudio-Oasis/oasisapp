import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/AuthLayout";
import { hasDemoEntries, migrateDemoEntries } from "@/modules/bitacora/demo/migrateDemoToAccount";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromDemo = searchParams.get("from") === "demo";
  const fromBeta = searchParams.get("ref") === "beta";

  useEffect(() => {
    trackEvent("signup_start", { from_demo: fromDemo, from_beta: fromBeta });
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoCount] = useState(() => {
    try {
      const raw = localStorage.getItem("bitacora_local_entries");
      if (!raw) return 0;
      return JSON.parse(raw).filter((e: any) => e.ended_at).length;
    } catch { return 0; }
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    trackEvent("signup_complete", { from_demo: fromDemo, has_demo_entries: hasDemoEntries() });

    if (data.user && hasDemoEntries()) {
      const count = await migrateDemoEntries(data.user.id);
      if (count > 0) {
        toast.success(`¡Listo! Tu cuenta está creada y tus ${count} registros del demo están guardados.`);
      } else {
        toast.success("¡Listo! Tu cuenta está creada. ¿En qué estás trabajando?");
      }
    } else {
      toast.success("¡Listo! Tu cuenta está creada. ¿En qué estás trabajando?");
    }

    navigate(fromBeta ? "/onboarding?ref=beta" : "/onboarding");
  };

  return (
    <AuthLayout>
      <div>
        <h1 className="text-2xl font-bold text-foreground text-center">
          {fromBeta ? "Únete al beta" : fromDemo ? "Guarda tu día" : "Crea tu agencia"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          {fromBeta
            ? "Acceso anticipado a OasisOS para tu agencia"
            : fromDemo && demoCount > 0
            ? `Tienes ${demoCount} registro${demoCount > 1 ? "s" : ""} del demo que se guardarán automáticamente`
            : "El sistema operativo para tu agencia creativa"}
        </p>
      </div>

      <form onSubmit={handleSignup} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">Nombre</label>
          <Input
            id="name"
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input
            id="email"
            type="email"
            placeholder="tu@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar contraseña</label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading
            ? "Creando cuenta…"
            : fromDemo && demoCount > 0
              ? `Crear cuenta y guardar ${demoCount} registro${demoCount > 1 ? "s" : ""}`
              : "Crear cuenta"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-medium text-foreground hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
