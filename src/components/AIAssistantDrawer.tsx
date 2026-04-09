import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Send, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED_QUESTIONS = [
  "¿Cómo registro horas para un cliente?",
  "¿Cómo envío una cotización?",
  "¿Cómo invito a mi equipo?",
  "¿Cómo veo las finanzas del mes?",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIAssistantDrawer({ open, onOpenChange }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("oasis-ai-chat", {
        body: { messages: newMessages },
      });

      if (error) throw error;

      const assistantContent = data?.content || data?.message || "No pude procesar tu pregunta. Intenta de nuevo.";
      setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
    } catch (err: any) {
      if (err?.status === 429) {
        toast.error("Demasiadas preguntas. Espera un momento e intenta de nuevo.");
      } else if (err?.status === 402) {
        toast.error("Créditos de AI agotados.");
      } else {
        toast.error("Error al conectar con OasisAI");
      }
      setMessages([...newMessages, { role: "assistant", content: "Lo siento, hubo un error. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            OasisAI
          </SheetTitle>
          <p className="text-xs text-foreground-muted">Pregúntame cómo usar el sistema</p>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-foreground-muted text-center mb-4">Prueba con una pregunta:</p>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-border/50 bg-card text-sm text-foreground hover:bg-muted/40 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-accent" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-card border border-border/50 text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-foreground-secondary" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="bg-card border border-border/50 rounded-xl px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }}
              placeholder="¿Cómo puedo...?"
              className="h-9 text-sm"
              disabled={loading}
            />
            <Button size="sm" onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="h-9 px-3">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
