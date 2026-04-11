import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Users,
  Activity,
  DollarSign,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Agency {
  id: string;
  name: string;
  plan: string;
  plan_override: string | null;
  is_active: boolean;
  created_at: string;
  country: string | null;
  member_count?: number;
}

interface FeedbackItem {
  id: string;
  message: string;
  module: string;
  type: string;
  created_at: string;
  agency_id: string | null;
  user_id: string;
}

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [overrideValue, setOverrideValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [agRes, prRes, fbRes] = await Promise.all([
      supabase.from("agencies").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, agency_id, name, email, role, created_at"),
      supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    const agencyList = (agRes.data || []) as Agency[];
    const profileList = prRes.data || [];

    // Enrich with member count
    agencyList.forEach((a) => {
      a.member_count = profileList.filter((p: any) => p.agency_id === a.id).length;
    });

    setAgencies(agencyList);
    setProfiles(profileList);
    setFeedback((fbRes.data || []) as FeedbackItem[]);
    setLoading(false);
  };

  const activeAgencies = agencies.filter((a) => a.is_active);
  const totalUsers = profiles.length;
  const mrr = agencies.reduce((sum, a) => {
    const plan = a.plan_override || a.plan;
    if (plan === "starter") return sum + 9;
    if (plan === "team" || plan === "estudio") return sum + 16;
    if (plan === "agency" || plan === "agencia") return sum + 20;
    return sum;
  }, 0);

  const filteredAgencies = agencies.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.country || "").toLowerCase().includes(search.toLowerCase())
  );

  const handlePlanOverride = async () => {
    if (!selectedAgency || !user) return;
    setSaving(true);
    try {
      const newOverride = overrideValue === "none" ? null : overrideValue;
      await supabase
        .from("agencies")
        .update({ plan_override: newOverride } as any)
        .eq("id", selectedAgency.id);

      // Audit log
      await supabase.from("super_admin_audit_log" as any).insert({
        admin_id: user.id,
        action: "plan_override",
        target_agency_id: selectedAgency.id,
        metadata: { old_plan: selectedAgency.plan_override, new_plan: newOverride },
      });

      toast.success("Plan actualizado");
      setSelectedAgency(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar plan");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (agency: Agency) => {
    if (!user) return;
    const newStatus = !agency.is_active;
    await supabase
      .from("agencies")
      .update({ is_active: newStatus } as any)
      .eq("id", agency.id);

    await supabase.from("super_admin_audit_log" as any).insert({
      admin_id: user.id,
      action: newStatus ? "activate_agency" : "deactivate_agency",
      target_agency_id: agency.id,
    });

    toast.success(newStatus ? "Agencia activada" : "Agencia desactivada");
    loadData();
  };

  const planBadge = (plan: string, override: string | null) => {
    const effective = override || plan;
    const colors: Record<string, string> = {
      free: "bg-muted text-muted-foreground",
      starter: "bg-blue-100 text-blue-700",
      team: "bg-violet-100 text-violet-700",
      estudio: "bg-violet-100 text-violet-700",
      agency: "bg-amber-100 text-amber-700",
      agencia: "bg-amber-100 text-amber-700",
    };
    return (
      <Badge className={colors[effective] || colors.free}>
        {effective}
        {override && " ⚡"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">OasisOS Super Admin</h1>
        <p className="text-sm text-muted-foreground mb-8">Panel de gestión para administrar agencias beta</p>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Building2, label: "Agencias", value: agencies.length },
            { icon: Users, label: "Usuarios", value: totalUsers },
            { icon: Activity, label: "Activas", value: activeAgencies.length },
            { icon: DollarSign, label: "MRR", value: `$${mrr}` },
          ].map((kpi) => (
            <div key={kpi.label} className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <kpi.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{kpi.label}</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
            </div>
          ))}
        </div>

        <Tabs defaultValue="agencies">
          <TabsList>
            <TabsTrigger value="agencies">Agencias</TabsTrigger>
            <TabsTrigger value="feedback">Feedback ({feedback.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="agencies" className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar agencias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Agencia</th>
                    <th className="text-left p-3 font-medium">Plan</th>
                    <th className="text-center p-3 font-medium">Miembros</th>
                    <th className="text-left p-3 font-medium">País</th>
                    <th className="text-left p-3 font-medium">Estado</th>
                    <th className="text-right p-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgencies.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{a.name}</td>
                      <td className="p-3">{planBadge(a.plan, a.plan_override)}</td>
                      <td className="p-3 text-center">{a.member_count || 0}</td>
                      <td className="p-3 text-muted-foreground">{a.country || "—"}</td>
                      <td className="p-3">
                        <Badge variant={a.is_active ? "default" : "secondary"}>
                          {a.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAgency(a);
                            setOverrideValue(a.plan_override || "none");
                          }}
                        >
                          Plan
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(a)}
                        >
                          {a.is_active ? "Desactivar" : "Activar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="mt-4 space-y-3">
            {feedback.map((fb) => (
              <div key={fb.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{fb.module}</Badge>
                  <Badge variant="outline">{fb.type}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(fb.created_at || "").toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{fb.message}</p>
              </div>
            ))}
            {feedback.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Sin feedback todavía</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Plan Override Dialog */}
      <Dialog open={!!selectedAgency} onOpenChange={(open) => !open && setSelectedAgency(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override de plan — {selectedAgency?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Plan actual: <strong>{selectedAgency?.plan}</strong>
                {selectedAgency?.plan_override && (
                  <> · Override: <strong>{selectedAgency.plan_override}</strong></>
                )}
              </p>
              <Select value={overrideValue} onValueChange={setOverrideValue}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin override (usar plan de Stripe)</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter ($9)</SelectItem>
                  <SelectItem value="estudio">Estudio ($16)</SelectItem>
                  <SelectItem value="agencia">Agencia ($20)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handlePlanOverride} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar override"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
