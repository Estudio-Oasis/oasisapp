import { useEffect, useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2, Paperclip, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
  partnerProfile: { id: string; name: string | null; avatar_url: string | null; email: string | null } | null;
}

export function ChatPanel({ open, onOpenChange, conversationId, partnerProfile }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const partnerName = partnerProfile?.name || partnerProfile?.email?.split("@")[0] || "Usuario";

  // Load messages
  useEffect(() => {
    if (!conversationId || !open) return;

    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      setMessages((data || []) as ChatMessage[]);
    };

    load();

    // Realtime
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, open]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const notifySlack = async (eventType: string, data: Record<string, any>) => {
    try {
      await supabase.functions.invoke("slack-notify", {
        body: { event_type: eventType, data },
      });
    } catch (e) {
      console.warn("Slack notify failed (non-blocking):", e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversationId || !user || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });

    if (error) {
      toast.error("No se pudo enviar el mensaje");
      setInput(content);
    } else {
      // Non-blocking Slack notification
      const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).maybeSingle();
      const senderName = profile?.name || profile?.email?.split("@")[0] || "Alguien";
      notifySlack("chat_message", { sender_name: senderName, content });
    }

    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    setSending(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${conversationId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(path, file);

    if (uploadError) {
      toast.error("Error al subir la imagen");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("chat-images")
      .getPublicUrl(path);

    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: "📷 Imagen",
      image_url: urlData.publicUrl,
    });

    if (error) {
      toast.error("No se pudo enviar la imagen");
    }

    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSummarize = async () => {
    if (!conversationId || !user || summarizing) return;
    setSummarizing(true);

    try {
      const { data, error } = await supabase.functions.invoke("summarize-chat", {
        body: { conversation_id: conversationId },
      });

      if (error) throw error;

      const summary = data?.summary || "No se pudo generar el resumen.";

      // Save summary to DB
      await supabase.from("chat_summaries").insert({
        conversation_id: conversationId,
        summary,
        created_by: user.id,
      });

      // Send summary to Slack
      const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).maybeSingle();
      const generatedBy = profile?.name || profile?.email?.split("@")[0] || "Alguien";
      notifySlack("ai_summary", {
        summary,
        conversation_partner: partnerName,
        generated_by: generatedBy,
      });

      toast.success("Resumen generado y guardado");
    } catch (e: any) {
      console.error("Summarize error:", e);
      toast.error("No se pudo generar el resumen");
    } finally {
      setSummarizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 w-full sm:max-w-md">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-sm font-semibold pr-8">{partnerName}</SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSummarize}
            disabled={summarizing || messages.length === 0}
            className="text-xs gap-1.5 w-fit"
          >
            {summarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Resumir con IA
          </Button>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-foreground-muted text-center mt-8">
              Inicia la conversación con {partnerName}
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isMine
                      ? "bg-foreground text-background"
                      : "bg-background-secondary text-foreground border border-border"
                  }`}
                >
                  {msg.image_url && (
                    <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={msg.image_url}
                        alt="Imagen compartida"
                        className="rounded-md max-h-48 w-auto mb-1 cursor-pointer"
                        loading="lazy"
                      />
                    </a>
                  )}
                  {(!msg.image_url || msg.content !== "📷 Imagen") && (
                    <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                  )}
                  <div className={`text-[10px] mt-1 ${isMine ? "text-background/60" : "text-foreground-muted"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="flex-1 min-h-[36px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button size="icon" className="shrink-0" onClick={handleSend} disabled={!input.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
