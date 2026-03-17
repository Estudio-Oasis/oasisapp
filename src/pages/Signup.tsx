import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasDemoEntries, migrateDemoEntries } from "@/modules/bitacora/demo/migrateDemoToAccount";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromDemo = searchParams.get("from") === "demo";

  useEffect(() => {
    trackEvent("signup_start", { from_demo: fromDemo });
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

    // Migrate demo entries if they exist
    if (data.user && hasDemoEntries()) {
      const count = await migrateDemoEntries(data.user.id);
      if (count > 0) {
        toast.success(`${count} registros del demo guardados en tu cuenta`);
      }
    }

    navigate("/bitacora");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary px-6">
      <div className="w-full max-w-[400px] rounded-lg border border-border bg-card p-10">
        {/* Logo */}
        <div className="text-center">
          <span className="text-[18px] font-bold tracking-tight text-foreground">Bitácora</span>
        </div>

        {/* Heading */}
        <h1 className="text-h1 text-foreground text-center mt-4">
          {fromDemo ? "Guarda tu día" : "Crea tu cuenta"}
        </h1>
        <p className="text-sm text-foreground-secondary text-center mt-1">
          {fromDemo && demoCount > 0
            ? `Tienes ${demoCount} registro${demoCount > 1 ? "s" : ""} del demo que se guardarán automáticamente`
            : "Empieza a gestionar tu tiempo"}
        </p>

        {/* Form */}
        <form onSubmit={handleSignup} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-md bg-destructive-light px-3 py-2 text-small text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-label">Nombre</label>
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
            <label htmlFor="email" className="text-label">Email</label>
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
            <label htmlFor="password" className="text-label">Contraseña</label>
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
            <label htmlFor="confirmPassword" className="text-label">Confirmar contraseña</label>
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

        {/* Footer */}
        <p className="text-small text-foreground-secondary text-center mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-foreground hover:text-accent transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
