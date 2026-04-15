import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/AuthLayout";
import { trackEvent } from "@/lib/analytics";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      trackEvent("login_complete");
      navigate("/home");
    }
  };

  return (
    <AuthLayout>
      <div>
        <h1 className="text-2xl font-bold text-foreground text-center">Bienvenido de vuelta</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Entra a tu sistema
        </p>
      </div>

      <form onSubmit={handleLogin} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Correo</label>
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
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? "Iniciando sesión…" : "Iniciar sesión"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-6">
        ¿No tienes cuenta?{" "}
        <Link to="/signup" className="font-medium text-foreground hover:underline">
          Crea tu agencia gratis
        </Link>
      </p>
    </AuthLayout>
  );
}
