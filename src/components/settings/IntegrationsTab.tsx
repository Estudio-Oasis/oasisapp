import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Hash, CheckCircle2 } from "lucide-react";

interface SlackChannel {
  id: string;
  name: string;
}

interface IntegrationsTabProps {
  agencyId: string;
  isAdmin: boolean;
}

export function IntegrationsTab({ agencyId, isAdmin }: IntegrationsTabProps) {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [selectedChannelName, setSelectedChannelName] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentChannelName, setCurrentChannelName] = useState<string | null>(null);

  // Load current setting
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("agency_settings")
        .select("slack_channel_id, slack_channel_name")
        .eq("agency_id", agencyId)
        .maybeSingle();

      if (data) {
        setSelectedChannelId(data.slack_channel_id || "");
        setSelectedChannelName(data.slack_channel_name || "");
        setCurrentChannelName(data.slack_channel_name || null);
      }
    };
    load();
  }, [agencyId]);

  // Load Slack channels from edge function
  const loadChannels = async () => {
    setLoadingChannels(true);
    try {
      const { data, error } = await supabase.functions.invoke("slack-list-channels");
      if (error) throw error;
      setChannels(data?.channels || []);
    } catch (e) {
      console.error("Failed to load channels:", e);
      toast.error("No se pudieron cargar los canales de Slack");
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleSave = async () => {
    if (!selectedChannelId || !isAdmin) return;
    setSaving(true);

    const { error } = await supabase
      .from("agency_settings")
      .upsert({
        agency_id: agencyId,
        slack_channel_id: selectedChannelId,
        slack_channel_name: selectedChannelName,
        updated_at: new Date().toISOString(),
      }, { onConflict: "agency_id" });

    if (error) {
      toast.error("Error al guardar configuración");
    } else {
      setCurrentChannelName(selectedChannelName);
      toast.success("Canal de Slack actualizado");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light">
            <span className="text-lg">💬</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Slack</h3>
            <p className="text-xs text-foreground-muted">
              Las notificaciones del Hub se envían a un canal de Slack
            </p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Conectado
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs text-foreground-muted">Canal de notificaciones</Label>

          {currentChannelName && (
            <p className="text-sm text-foreground">
              Canal actual: <span className="font-medium">#{currentChannelName}</span>
            </p>
          )}

          {channels.length === 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={loadChannels}
              disabled={loadingChannels || !isAdmin}
            >
              {loadingChannels ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Hash className="h-3.5 w-3.5 mr-1.5" />
              )}
              Cargar canales
            </Button>
          ) : (
            <div className="space-y-3">
              <select
                value={selectedChannelId}
                onChange={(e) => {
                  const ch = channels.find((c) => c.id === e.target.value);
                  setSelectedChannelId(e.target.value);
                  setSelectedChannelName(ch?.name || "");
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={!isAdmin}
              >
                <option value="">Selecciona un canal</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    #{ch.name}
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !selectedChannelId || !isAdmin}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Guardar canal
              </Button>
            </div>
          )}

          {!isAdmin && (
            <p className="text-xs text-foreground-muted italic">
              Solo los administradores pueden cambiar esta configuración.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
