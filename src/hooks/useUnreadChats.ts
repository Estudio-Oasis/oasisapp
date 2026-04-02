import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadChats() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkUnread = async () => {
      // Get conversations where I'm a participant
      const { data: convos } = await supabase
        .from("chat_conversations")
        .select("id, updated_at")
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);

      if (!convos || convos.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Get latest message from each conversation that I didn't send
      let count = 0;
      const lastSeenKey = `chat_last_seen_${user.id}`;
      const lastSeenMap: Record<string, string> = JSON.parse(localStorage.getItem(lastSeenKey) || "{}");

      for (const convo of convos) {
        const { data: latestMsg } = await supabase
          .from("chat_messages")
          .select("created_at, sender_id")
          .eq("conversation_id", convo.id)
          .neq("sender_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (latestMsg && latestMsg.length > 0) {
          const lastSeen = lastSeenMap[convo.id];
          if (!lastSeen || new Date(latestMsg[0].created_at) > new Date(lastSeen)) {
            count++;
          }
        }
      }

      setUnreadCount(count);
    };

    checkUnread();

    // Listen for new messages
    const channelName = `unread-chat-notifier-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as { sender_id: string };
          if (msg.sender_id !== user.id) {
            checkUnread();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markConversationRead = (conversationId: string) => {
    if (!user) return;
    const lastSeenKey = `chat_last_seen_${user.id}`;
    const lastSeenMap: Record<string, string> = JSON.parse(localStorage.getItem(lastSeenKey) || "{}");
    lastSeenMap[conversationId] = new Date().toISOString();
    localStorage.setItem(lastSeenKey, JSON.stringify(lastSeenMap));
    // Recalculate after marking
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return { unreadCount, markConversationRead };
}
