import { useState, useEffect, useRef } from "react";
import { MessageSquare, Sparkles, Download, Send, Loader2, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Conversation } from "@/pages/Hub";

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface ChatSummary {
  id: string;
  conversation_id: string;
  summary: string;
  created_at: string;
}

interface SlackChannel {
  id: string;
  name: string;
}

interface ChatListProps {
  conversations: Conversation[];
  profiles: Profile[];
  currentUserId: string;
  onOpenChat: (conversationId: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function ChatList({ conversations, profiles, currentUserId, onOpenChat }: ChatListProps) {
  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<ChatSummary | null>(null);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [sendingToSlack, setSendingToSlack] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const channelPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations.length === 0) return;
    const ids = conversations.map((c) => c.id);
    supabase
      .from("chat_summaries")
      .select("*")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSummaries((data || []) as ChatSummary[]);
      });
  }, [conversations]);

  if (conversations.length === 0) return null;

  const getPartner = (convo: Conversation): Profile | undefined => {
    const partnerId = convo.participant_a === currentUserId ? convo.participant_b : convo.participant_a;
    return profiles.find((p) => p.id === partnerId);
  };

  const getSummariesForConvo = (convoId: string) => summaries.filter((s) => s.conversation_id === convoId);

  const handleShareToSlack = async () => {
    if (!selectedSummary || !selectedChannel) return;
    setSendingToSlack(true);

    const convo = conversations.find((c) => c.id === selectedSummary.conversation_id);
    const partner = convo ? getPartner(convo) : undefined;
    const partnerName = partner?.name || partner?.email?.split("@")[0] || "?";

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", currentUserId)
        .maybeSingle();
      const myName = profile?.name || profile?.email?.split("@")[0] || "Alguien";

      const { error } = await supabase.functions.invoke("slack-notify", {
        body: {
          event_type: "ai_summary",
          channel: selectedChannel,
          data: {
            summary: selectedSummary.summary,
            conversation_partner: partnerName,
            generated_by: myName,
          },
        },
      });

      if (error) throw error;
      toast.success("Resumen enviado a Slack");
      setShowChannelPicker(false);
      setSelectedChannel("");
    } catch (e) {
      console.error("Share to Slack error:", e);
      toast.error("No se pudo enviar a Slack");
    } finally {
      setSendingToSlack(false);
    }
  };

  const handleOpenChannelPicker = async () => {
    setShowChannelPicker(true);
    if (channels.length === 0) {
      setLoadingChannels(true);
      try {
        const { data, error } = await supabase.functions.invoke("slack-list-channels");
        if (error) throw error;
        setChannels(data?.channels || []);
      } catch (e) {
        toast.error("No se pudieron cargar los canales");
      } finally {
        setLoadingChannels(false);
      }
    }
  };

  return (
    <>
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">Chats</h2>
        <div className="space-y-1">
          {conversations.map((convo) => {
            const partner = getPartner(convo);
            const partnerName = partner?.name || partner?.email?.split("@")[0] || "Usuario";
            const convoSummaries = getSummariesForConvo(convo.id);

            return (
              <div key={convo.id}>
                <button
                  onClick={() => onOpenChat(convo.id)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-background-secondary transition-colors text-left"
                >
                  <MessageSquare className="h-4 w-4 text-foreground-muted shrink-0" />
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{partnerName}</span>
                  <span className="text-[10px] text-foreground-muted shrink-0">{timeAgo(convo.updated_at)}</span>
                </button>
                {convoSummaries.length > 0 && (
                  <div className="ml-10 mb-1 space-y-1">
                    {convoSummaries.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSummary(s);
                          setShowChannelPicker(false);
                          setSelectedChannel("");
                        }}
                        className="flex items-center gap-2 text-xs text-foreground-muted hover:text-foreground transition-colors w-full text-left px-2 py-1 rounded hover:bg-background-secondary"
                      >
                        <Sparkles className="h-3 w-3 shrink-0" />
                        <span className="truncate">Resumen · {timeAgo(s.created_at)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary preview modal */}
      <Dialog open={!!selectedSummary} onOpenChange={(o) => { if (!o) { setSelectedSummary(null); setShowChannelPicker(false); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Resumen de conversación
            </DialogTitle>
          </DialogHeader>
          {selectedSummary && (
            <div className="space-y-3">
              <p className="text-[10px] text-foreground-muted">
                Generado {new Date(selectedSummary.created_at).toLocaleString("es-MX")}
              </p>
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed border border-border rounded-md p-4 bg-background-secondary">
                {selectedSummary.summary}
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Download button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => {
                    const blob = new Blob([selectedSummary.summary], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `resumen-${selectedSummary.id.slice(0, 8)}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar .txt
                </Button>

                {/* Share to Slack button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={handleOpenChannelPicker}
                >
                  <Send className="h-3.5 w-3.5" />
                  Compartir en Slack
                </Button>
              </div>

              {/* Channel picker */}
              {showChannelPicker && (
                <div className="border border-border rounded-md p-3 space-y-2 bg-background">
                  <p className="text-xs font-medium text-foreground">Selecciona un canal de Slack</p>
                  {loadingChannels ? (
                    <div className="flex items-center gap-2 text-xs text-foreground-muted py-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Cargando canales…
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={selectedChannel}
                        onChange={(e) => setSelectedChannel(e.target.value)}
                        className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="">Elige un canal…</option>
                        {channels.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            #{ch.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        className="text-xs gap-1.5"
                        disabled={!selectedChannel || sendingToSlack}
                        onClick={handleShareToSlack}
                      >
                        {sendingToSlack ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Enviar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
