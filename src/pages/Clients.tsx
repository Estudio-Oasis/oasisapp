import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, ChevronRight } from "lucide-react";
import { getClientColor } from "@/lib/timer-utils";
import { getCompletenessLevel, type CompletenessLevel } from "@/lib/clientCompleteness";
import { NewClientModal } from "@/components/NewClientModal";

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

function CompletenessPill({ score }: { score: number }) {
  const { t } = useLanguage();
  const level = getCompletenessLevel(score);
  const config = {
    complete: { bg: "bg-success-light", text: "text-success", label: t("clients.completeness.complete") },
    incomplete: { bg: "bg-accent-light", text: "text-accent-foreground", label: t("clients.completeness.incomplete") },
    critical: { bg: "bg-destructive-light", text: "text-destructive", label: t("clients.completeness.critical") },
  }[level];

  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-micro ${config.bg} ${config.text}`}>
      <span className="text-[8px]">●</span>
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

      {/* Stats */}
      <div className={`grid grid-cols-1 ${isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-1"} gap-4 mb-6`}>
        <div className="border border-border rounded-lg p-5">
          <p className="text-h1 text-foreground">{activeClients.length}</p>
          <p className="text-small text-foreground-secondary">{t("clients.activeClients")}</p>
        </div>
        {isAdmin && (
          <div className="border border-border rounded-lg p-5">
            <p className="text-h1 text-foreground">${totalMRR.toLocaleString()}</p>
            <p className="text-small text-foreground-secondary">{t("clients.mrr")}</p>
          </div>
        )}
        {isAdmin && (
          <div className="border border-border rounded-lg p-5">
            <p className="text-h1 text-foreground">{incompleteCount}</p>
            <p className="text-small text-foreground-secondary">{t("clients.incompleteProfiles")}</p>
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar clientes..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-background-secondary rounded-md p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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
        <div className="flex items-center justify-center py-16 text-foreground-muted text-sm">Cargando...</div>
      ) : filtered.length === 0 && clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-border mb-4" />
          <h2 className="text-h3 text-foreground">Aún no hay clientes</h2>
          <p className="text-sm text-foreground-secondary mt-2">Agrega tu primer cliente para empezar a registrar tiempo e ingresos.</p>
          <Button onClick={() => setModalOpen(true)} className="mt-4">
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-foreground-muted text-sm">No hay clientes que coincidan con los filtros.</div>
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
                className="group flex items-center gap-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-background-secondary transition-colors"
              >
                {/* Avatar */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-background"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[15px] font-semibold text-foreground truncate">{client.name}</span>
                    {client.billing_entity && client.billing_entity !== client.name && (
                      <span className="text-small text-foreground-secondary truncate">vía {client.billing_entity}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-small text-foreground-secondary truncate">
                    {client.contact_name && <span>{client.contact_name}</span>}
                    {client.contact_name && (client.email || client.phone) && <span> · </span>}
                    {client.email && <span className="text-foreground-muted">{client.email}</span>}
                    {!client.email && client.phone && <span className="text-foreground-muted">{client.phone}</span>}
                  </div>
                </div>

                {/* Rate + Completeness - admin only */}
                {isAdmin && (
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    {rate ? (
                      <span className="text-sm font-semibold text-foreground">
                        ${rate.toLocaleString()}{frequencyLabel[freq] || "/mes"}
                      </span>
                    ) : (
                      <span className="text-sm text-foreground-muted">Sin tarifa</span>
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
