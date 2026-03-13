import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { conversation_id } = await req.json();
    if (!conversation_id) throw new Error("conversation_id is required");

    // Fetch messages with sender profiles
    const { data: messages, error: msgError } = await supabase
      .from("chat_messages")
      .select("content, created_at, sender_id")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });

    if (msgError) throw msgError;
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ summary: "No hay mensajes para resumir." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique sender IDs and fetch names
    const senderIds = [...new Set(messages.map((m: any) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", senderIds);

    const nameMap = new Map<string, string>();
    (profiles || []).forEach((p: any) => {
      nameMap.set(p.id, p.name || p.email?.split("@")[0] || "Usuario");
    });

    const transcript = messages
      .map((m: any) => `[${new Date(m.created_at).toLocaleString("es-MX")}] ${nameMap.get(m.sender_id) || "?"}: ${m.content}`)
      .join("\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente que resume conversaciones de chat de equipo en español. Genera un resumen conciso y accionable destacando los puntos clave, decisiones tomadas y pendientes. Formato limpio en texto plano.",
          },
          {
            role: "user",
            content: `Resume la siguiente conversación:\n\n${transcript}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI error:", aiResponse.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "No se pudo generar el resumen.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
