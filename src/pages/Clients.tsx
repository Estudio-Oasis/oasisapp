import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatWidget } from "@/components/ui/widget-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Users, ChevronRight, Building2, TrendingUp, AlertTriangle, MoreHorizontal, Trash2, Archive } from "lucide-react";
import { getClientColor } from "@/lib/timer-utils";
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
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const { t } = useLanguage();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "incomplete">("all");
  const [modalOpen, setModalOpen] = useState(false);

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
                    <CompletenessPill score={client.completeness_score ?? 0} />
                  </div>
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
    </div>
  );
}
