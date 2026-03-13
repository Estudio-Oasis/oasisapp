import { MessageSquare } from "lucide-react";
import type { Conversation } from "@/pages/Hub";

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
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
  if (conversations.length === 0) return null;

  const getPartner = (convo: Conversation): Profile | undefined => {
    const partnerId = convo.participant_a === currentUserId ? convo.participant_b : convo.participant_a;
    return profiles.find((p) => p.id === partnerId);
  };

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">Chats</h2>
      <div className="space-y-1">
        {conversations.map((convo) => {
          const partner = getPartner(convo);
          const partnerName = partner?.name || partner?.email?.split("@")[0] || "Usuario";

          return (
            <button
              key={convo.id}
              onClick={() => onOpenChat(convo.id)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-background-secondary transition-colors text-left"
            >
              <MessageSquare className="h-4 w-4 text-foreground-muted shrink-0" />
              <span className="text-sm font-medium text-foreground flex-1 truncate">{partnerName}</span>
              <span className="text-[10px] text-foreground-muted shrink-0">{timeAgo(convo.updated_at)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
