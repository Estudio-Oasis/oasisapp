import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatWidget } from "@/components/ui/widget-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Users, ChevronRight, Building2, TrendingUp, AlertTriangle, MoreHorizontal, Trash2, Archive } from "lucide-react";
import { getClientColor } from "@/lib/timer-utils";
import { formatDuration } from "@/lib/timer-utils";
import { getCompletenessLevel, type CompletenessLevel } from "@/lib/clientCompleteness";
import { NewClientModal } from "@/components/NewClientModal";
import { toast } from "sonner";

interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contact_name: string | null;
  billing_entity: string | null;
  monthly_rate: number | null;
  currency: string;
  status: string;
  payment_frequency: string | null;
  completeness_score: number | null;
}

const frequencyLabel: Record<string, string> = {
  monthly: "/mes",
  biweekly: "/qna",
  weekly: "/sem",
  project: "/proy",
};

function CompletenessPill({ score, hasActivity }: { score: number; hasActivity?: boolean }) {
  const { t } = useLanguage();
  const level = getCompletenessLevel(score);

  // Only show CRITICAL if there's activity and low completeness
  if (level === "critical" && !hasActivity) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-background-secondary text-foreground-muted">
        <span className="text-[7px]">●</span>
        {t("clients.completeness.noActivity")}
      </span>
    );
  }

  const config = {
    complete: { bg: "bg-success/10", text: "text-success", label: t("clients.completeness.complete") },
    incomplete: { bg: "bg-accent/10", text: "text-accent", label: t("clients.completeness.incomplete") },
    critical: { bg: "bg-destructive/10", text: "text-destructive", label: t("clients.completeness.critical") },
  }[level];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${config.bg} ${config.text}`}>
      <span className="text-[7px]">●</span>
      {config.label}
    </span>
  );
}

export default function ClientsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const { t } = useLanguage();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "incomplete">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null);
  const [clientStats, setClientStats] = useState<Record<string, { totalMins: number; lastActivity: string | null }>>({});

  const handleArchiveClient = async (client: ClientRow) => {
    const { error } = await supabase
      .from("clients")
      .update({ status: "inactive" })
      .eq("id", client.id);
    if (error) { toast.error("No se pudo archivar"); return; }
    toast.success(`"${client.name}" archivado`);
    fetchClients();
  };

  const handleDeleteClient = async () => {
    if (!deleteTarget) return;
    // Unlink time_entries and tasks first
    await Promise.all([
      supabase.from("time_entries").update({ client_id: null }).eq("client_id", deleteTarget.id),
      supabase.from("tasks").update({ client_id: null }).eq("client_id", deleteTarget.id),
    ]);
    const { error } = await supabase.from("clients").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("No se pudo eliminar"); return; }
    toast.success(`"${deleteTarget.name}" eliminado`);
    setDeleteTarget(null);
    fetchClients();
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, name, email, phone, contact_name, billing_entity, monthly_rate, currency, status, payment_frequency, completeness_score")
      .order("created_at", { ascending: false });
    setClients((data as ClientRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch time entry stats per client
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data } = await supabase
        .from("time_entries")
        .select("client_id, started_at, duration_min")
        .gte("started_at", startOfMonth)
        .not("client_id", "is", null)
        .not("ended_at", "is", null);
      const map: Record<string, { totalMins: number; lastActivity: string | null }> = {};
      (data || []).forEach((e: any) => {
        const cid = e.client_id;
        if (!cid) return;
        if (!map[cid]) map[cid] = { totalMins: 0, lastActivity: null };
        map[cid].totalMins += Number(e.duration_min) || 0;
        if (!map[cid].lastActivity || e.started_at > map[cid].lastActivity!) {
          map[cid].lastActivity = e.started_at;
        }
      });
      setClientStats(map);
    };
    fetchStats();
  }, [user?.id]);

  const filtered = clients.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q) && !c.contact_name?.toLowerCase().includes(q)) return false;
    }
    if (filter === "active") return c.status === "active";
    if (filter === "inactive") return c.status === "inactive";
    if (filter === "incomplete") return (c.completeness_score ?? 0) < 80;
    return true;
  });

  const activeClients = clients.filter((c) => c.status === "active");
  const totalMRR = activeClients.reduce((sum, c) => sum + (c.monthly_rate || 0), 0);
  const incompleteCount = clients.filter((c) => (c.completeness_score ?? 0) < 80).length;

  const filters: { key: typeof filter; label: string }[] = [
    { key: "all", label: t("common.all") },
    { key: "active", label: t("common.active") },
    { key: "inactive", label: t("common.inactive") },
    { key: "incomplete", label: t("clients.incomplete") },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h1 text-foreground">{t("clients.title")}</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("clients.newClient")}
        </Button>
      </div>

      {/* Stats as widgets */}
      <div className={`grid grid-cols-1 ${isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-1"} gap-3 mb-6`}>
        <StatWidget
          label={t("clients.activeClients")}
          value={activeClients.length}
          icon={Building2}
          accent="default"
        />
        {isAdmin && (
          <StatWidget
            label={t("clients.mrr")}
            value={`$${totalMRR.toLocaleString()}`}
            icon={TrendingUp}
            accent="green"
          />
        )}
        {isAdmin && (
          <StatWidget
            label={t("clients.incompleteProfiles")}
            value={incompleteCount}
            icon={AlertTriangle}
            accent={incompleteCount > 0 ? "amber" : "default"}
            onClick={() => setFilter(filter === "incomplete" ? "all" : "incomplete")}
            active={filter === "incomplete"}
          />
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("clients.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-background-secondary rounded-xl p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-foreground text-background"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-foreground-muted text-sm">{t("common.loading")}</div>
      ) : filtered.length === 0 && clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-border mb-4" />
          <h2 className="text-h3 text-foreground">{t("clients.noClients")}</h2>
          <p className="text-sm text-foreground-secondary mt-2">{t("clients.addFirst")}</p>
          <Button onClick={() => setModalOpen(true)} className="mt-4">
            <Plus className="h-4 w-4" />
            {t("clients.newClient")}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-foreground-muted text-sm">{t("clients.noMatch")}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((client) => {
            const initials = client.name.slice(0, 2).toUpperCase();
            const color = getClientColor(client.name);
            const rate = client.monthly_rate;
            const freq = client.payment_frequency || "monthly";

            return (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="group flex items-center gap-3 rounded-2xl border border-border/60 dark:border-border/40 bg-card p-4 cursor-pointer hover:border-border dark:hover:border-border/60 transition-all"
              >
                {/* Avatar */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-background"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[15px] font-semibold text-foreground truncate">{client.name}</span>
                    {client.billing_entity && client.billing_entity !== client.name && (
                      <span className="text-[12px] text-foreground-muted truncate">{t("clients.via")} {client.billing_entity}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-foreground-secondary truncate mt-0.5">
                    {client.contact_name && <span>{client.contact_name}</span>}
                    {client.contact_name && (client.email || client.phone) && <span>·</span>}
                    {client.email && <span className="text-foreground-muted">{client.email}</span>}
                    {!client.email && client.phone && <span className="text-foreground-muted">{client.phone}</span>}
                  </div>
                </div>

                {/* Hours this month */}
                <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 min-w-[80px]">
                  {(() => {
                    const stats = clientStats[client.id];
                    if (stats && stats.totalMins > 0) {
                      const timeAgoStr = stats.lastActivity
                        ? (() => {
                            const diff = Date.now() - new Date(stats.lastActivity).getTime();
                            const days = Math.floor(diff / 86400000);
                            if (days === 0) return "hoy";
                            if (days === 1) return "ayer";
                            return `hace ${days}d`;
                          })()
                        : null;
                      return (
                        <>
                          <span className="text-[12px] font-semibold text-foreground tabular-nums">{formatDuration(stats.totalMins)}</span>
                          {timeAgoStr && <span className="text-[10px] text-foreground-muted">{timeAgoStr}</span>}
                        </>
                      );
                    }
                    return <span className="text-[10px] text-foreground-muted">Sin actividad</span>;
                  })()}
                </div>

                {/* Rate + Completeness */}
                {isAdmin && (
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    {rate ? (
                      <span className="text-[13px] font-semibold text-foreground tabular-nums">
                        ${rate.toLocaleString()}{frequencyLabel[freq] || "/mes"}
                      </span>
                    ) : (
                      <span className="text-[12px] text-foreground-muted">{t("clients.noRate")}</span>
                    )}
                    <CompletenessPill score={client.completeness_score ?? 0} hasActivity={(clientStats[client.id]?.totalMins ?? 0) > 0} />
                  </div>
                )}

                {/* Menu */}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-secondary opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => handleArchiveClient(client)} className="gap-2">
                        <Archive className="h-3.5 w-3.5" />
                        Archivar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTarget(client)} className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <ChevronRight className="h-4 w-4 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      <NewClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchClients}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar "{deleteTarget?.name}"?</DialogTitle>
            <DialogDescription>
              Se desvinculará de sus entradas de tiempo y tareas. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteClient}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
