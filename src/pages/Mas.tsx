import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import {
  ListTodo, Users, FileText, DollarSign, Shield, Settings,
  ChevronRight, Radar, BarChart3, MessageSquare, LogOut,
} from "lucide-react";

interface ItemDef {
  to: string;
  label: string;
  icon: any;
  desc?: string;
  paidOnly?: boolean;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const sections: { title: string; items: ItemDef[] }[] = [
  {
    title: "Trabajo",
    items: [
      { to: "/tasks", label: "Tareas", icon: ListTodo, desc: "Tu backlog y entregables", paidOnly: true },
      { to: "/clients", label: "Clientes", icon: Users, desc: "Cuentas y proyectos", paidOnly: true },
      { to: "/quotes", label: "Cotizaciones", icon: FileText, desc: "Pipeline y propuestas", paidOnly: true },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { to: "/finances", label: "Finanzas", icon: DollarSign, desc: "Ingresos, facturas y gastos", paidOnly: true, adminOnly: true },
      { to: "/vault", label: "Vault", icon: Shield, desc: "Credenciales por cliente", paidOnly: true },
    ],
  },
  {
    title: "Comando",
    items: [
      { to: "/comando", label: "Centro de comando", icon: Radar, desc: "Pulso en vivo de la organización", superAdminOnly: true },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { to: "/settings", label: "Ajustes", icon: Settings, desc: "Equipo, perfil, plan" },
    ],
  },
];

export default function MasPage() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useRole();
  const { isFree } = usePlan();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [profile, setProfile] = useState<{ name: string | null; email: string | null; avatar_url: string | null }>({
    name: null, email: null, avatar_url: null,
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name, email, avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => data && setProfile(data));
    supabase.from("super_admin_users" as any).select("id").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsSuperAdmin(!!data));
  }, [user?.id]);

  void initials;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const initials = (profile.name || profile.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5 pb-4">
      {/* Bold hero — v2 */}
      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Más</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground leading-none">
          {profile.name?.split(" ")[0] || "Hola"}
        </h1>
        <p className="mt-1.5 text-[12px] text-foreground-muted truncate">{profile.email}</p>
        <Link to="/settings" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:underline underline-offset-2">
          Ver perfil <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {sections.map((section) => {
        const items = section.items.filter((i) => {
          if (i.paidOnly && isFree) return false;
          if (i.adminOnly && !isAdmin) return false;
          if (i.superAdminOnly && !isSuperAdmin) return false;
          return true;
        });
        if (items.length === 0) return null;
        return (
          <div key={section.title} className="space-y-2">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
              {section.title}
            </p>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card divide-y divide-border/60">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                    <item.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    {item.desc && (
                      <p className="text-[11px] text-foreground-muted truncate">{item.desc}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-foreground-muted" />
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      <button
        onClick={() => void signOut()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm text-destructive active:scale-[0.99] transition-transform"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </div>
  );
}
