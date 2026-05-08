import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Loader2, History, Filter, Globe, User as UserIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Category = "profile" | "auth" | "identity" | "session" | "security" | "preferences" | "team" | "other";

interface ActivityRow {
  id: string;
  user_id: string;
  agency_id: string | null;
  category: Category;
  action: string;
  description: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface ProfileLite {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const CATEGORY_LABEL: Record<Category | "all", string> = {
  all: "Todas",
  profile: "Perfil",
  auth: "Autenticación",
  identity: "Identidades",
  session: "Sesiones",
  security: "Seguridad",
  preferences: "Preferencias",
  team: "Equipo",
  other: "Otro",
};

const CATEGORY_TONE: Record<Category, string> = {
  profile: "bg-accent/10 text-accent",
  auth: "bg-primary/10 text-primary",
  identity: "bg-primary/10 text-primary",
  session: "bg-foreground-muted/10 text-foreground-secondary",
  security: "bg-destructive/10 text-destructive",
  preferences: "bg-foreground-muted/10 text-foreground-secondary",
  team: "bg-accent/10 text-accent",
  other: "bg-foreground-muted/10 text-foreground-muted",
};

const RANGE_OPTIONS = [
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: "90", label: "Últimos 90 días" },
  { value: "all", label: "Todo" },
];

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function shortUA(ua: string | null) {
  if (!ua) return null;
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Linux/.test(ua)) return "Linux";
  return null;
}

export function ActivityHistorySection() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [scope, setScope] = useState<"me" | "agency" | "all">("me");
  const [category, setCategory] = useState<Category | "all">("all");
  const [range, setRange] = useState<string>("30");

  // Detect super admin
  useEffect(() => {
    if (!user) return;
    supabase
      .from("super_admin_users" as never)
      .select("id")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsSuperAdmin(!!data));
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    let q = supabase
      .from("account_activity_log" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (scope === "me") q = q.eq("user_id", user.id);
    if (category !== "all") q = q.eq("category", category);
    if (range !== "all") {
      const since = new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString();
      q = q.gte("created_at", since);
    }

    q.then(async ({ data, error }) => {
      if (error || !data) {
        setRows([]);
        setLoading(false);
        return;
      }
      const list = data as unknown as ActivityRow[];
      setRows(list);

      // Hydrate profile names for non-self rows
      const ids = Array.from(new Set(list.map((r) => r.user_id))).filter((id) => id !== user.id);
      if (ids.length > 0) {
        const { data: pdata } = await supabase
          .from("profiles")
          .select("id, name, email, avatar_url")
          .in("id", ids);
        const map: Record<string, ProfileLite> = {};
        (pdata ?? []).forEach((p: ProfileLite) => {
          map[p.id] = p;
        });
        setProfiles(map);
      } else {
        setProfiles({});
      }
      setLoading(false);
    });
  }, [user?.id, scope, category, range]);

  const grouped = useMemo(() => {
    const out: Record<string, ActivityRow[]> = {};
    rows.forEach((r) => {
      const day = new Date(r.created_at).toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      out[day] = out[day] ?? [];
      out[day].push(r);
    });
    return out;
  }, [rows]);

  const canSeeAgency = isAdmin || isSuperAdmin;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <History className="h-3 w-3" />
        <span className="text-label">Historial de actividad</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {canSeeAgency && (
          <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="me">Solo yo</SelectItem>
              <SelectItem value="agency">Todo el workspace</SelectItem>
              {isSuperAdmin && <SelectItem value="all">Todas las cuentas</SelectItem>}
            </SelectContent>
          </Select>
        )}
        <Select value={category} onValueChange={(v) => setCategory(v as Category | "all")}>
          <SelectTrigger className="h-8 text-xs">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CATEGORY_LABEL) as (Category | "all")[]).map((k) => (
              <SelectItem key={k} value={k}>
                {CATEGORY_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-foreground-muted py-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-foreground-muted">
          Sin eventos en este rango.
        </div>
      ) : (
        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
          {Object.entries(grouped).map(([day, list]) => (
            <div key={day} className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                {day}
              </p>
              {list.map((r) => {
                const ownerProfile = r.user_id === user?.id ? null : profiles[r.user_id];
                const ownerLabel =
                  r.user_id === user?.id
                    ? "Tú"
                    : ownerProfile?.name ?? ownerProfile?.email ?? r.user_id.slice(0, 8);
                return (
                  <div
                    key={r.id}
                    className="rounded-md border border-border bg-background-secondary px-3 py-2 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">
                          {r.description ?? r.action}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-foreground-muted flex-wrap">
                          <span
                            className={`px-1.5 py-px rounded text-[10px] font-medium ${CATEGORY_TONE[r.category]}`}
                          >
                            {CATEGORY_LABEL[r.category]}
                          </span>
                          <span>{fmtDateTime(r.created_at)}</span>
                          {shortUA(r.user_agent) && (
                            <span className="flex items-center gap-0.5">
                              <Globe className="h-2.5 w-2.5" />
                              {shortUA(r.user_agent)}
                            </span>
                          )}
                          {scope !== "me" && (
                            <span className="flex items-center gap-0.5">
                              <UserIcon className="h-2.5 w-2.5" />
                              {ownerLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {rows.length === 200 && (
            <p className="text-[11px] text-foreground-muted text-center">
              Mostrando los 200 eventos más recientes.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
