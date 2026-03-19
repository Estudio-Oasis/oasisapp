import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Eres un asistente de redacción para registros de actividad laboral. El usuario te da una descripción de lo que está haciendo o va a hacer. Tu trabajo es:

1. Generar un TÍTULO CORTO (máximo 10 palabras) que capture la esencia de la actividad. Debe ser claro y accionable, como un nombre de tarea.
2. Generar una DESCRIPCIÓN MEJORADA que limpie la redacción pero conserve TODA la información y contexto que el usuario proporcionó. No resumas ni elimines detalles. Mejora la claridad y estructura.

Responde SOLO en formato JSON:
{"title": "...", "description": "..."}

No agregues explicaciones. Respeta el idioma original del usuario.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI rewrite error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Try to parse JSON from the response
    let title = "";
    let description = "";
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      title = parsed.title || "";
      description = parsed.description || "";
    } catch {
      // Fallback: use raw as single result for backwards compat
      title = raw;
      description = "";
    }

    return new Response(JSON.stringify({ result: title, title, description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rewrite-description error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
