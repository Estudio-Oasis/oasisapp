import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const prompts: Record<string, string> = {
  enrich_notes:
    "You are a concise agency assistant. Given the following client details, write a clean 2-3 sentence summary for the Notes field that captures the most useful context about this client relationship. Be factual, professional, and brief. Write in the same language the client info seems to be in. Return only the notes text, no JSON, no labels.",
  rate_context:
    "You are a financial context assistant. Given a monthly rate in USD, provide a single line with: the per-payment amount if biweekly/weekly, and approximate equivalents in MXN, COP, and EUR using rough current rates (use: 1 USD ≈ 17.5 MXN, 4,100 COP, 0.93 EUR). Format: '$2,500/mo · $1,250 biweekly · ≈ MXN $43,750 · COP $10.25M · €2,325'. Return only that one line of text.",
  channel_tips:
    "You are a communication assistant. Given a communication channel (like Slack, WhatsApp, Teams), suggest in 1-2 sentences what credentials or access details would be useful to save for a client relationship (e.g. workspace URL, handle, group name). Be specific and brief.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, context } = await req.json();
    if (!action || !prompts[action]) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
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

    const userMessage = typeof context === "string" ? context : JSON.stringify(context, null, 2);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: prompts[action] },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI helper error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-field-helper error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
