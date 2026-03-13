import { useState, useEffect } from "react";
import { MessageSquare, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
                        onClick={() => setSelectedSummary(s)}
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
      <Dialog open={!!selectedSummary} onOpenChange={(o) => !o && setSelectedSummary(null)}>
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
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
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
                Descargar .txt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
