import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are a data extraction assistant for an agency management system.
Extract client information from the user's text and return ONLY valid JSON.
No explanation, no markdown, just raw JSON.

Return this exact structure (use null for missing fields):
{
  "name": string | null,
  "contact_name": string | null,
  "email": string | null,
  "phone": string | null,
  "website": string | null,
  "billing_entity": string | null,
  "monthly_rate": number | null,
  "currency": string | null,
  "payment_method": string | null,
  "payment_frequency": "monthly" | "biweekly" | "weekly" | "project" | null,
  "communication_channel": string | null,
  "notes": string | null,
  "suggestions": [
    {
      "field": string,
      "issue": string,
      "suggested_value": string | null
    }
  ]
}

CRITICAL RULES:
1. RATE RULE — "biweekly" means the amount stated IS the monthly total, paid in two installments. Do NOT multiply by 2.
   Example: "$2,500 biweekly" → monthly_rate: 2500, payment_frequency: "biweekly"
   The biweekly amount per payment = monthly_rate / 2.

2. BILLING ENTITY — Only populate billing_entity when the text explicitly says a DIFFERENT company or person pays (not the client themselves).

3. EMAIL — Extract exactly as written in the text.

4. CURRENCY — Default to "USD" unless explicitly mentioned otherwise.

5. SUGGESTIONS — Populate the suggestions array with any inconsistencies or improvements you detected. Examples:
   - If contact_name says "Thomas Higgins" but email handle is "thomashiggs", add: { "field": "contact_name", "issue": "Email suggests last name may be 'Higgs' not 'Higgins'", "suggested_value": "Thomas Higgs" }
   - If monthly_rate > 0 but payment_method is null, add: { "field": "payment_method", "issue": "Payment method not mentioned — worth confirming", "suggested_value": null }
   - If communication_channel is filled but no credentials mentioned, add: { "field": "credentials", "issue": "Consider saving access details in the credentials vault", "suggested_value": null }
   Return empty array [] if no suggestions.

6. NOTES — Put any context that doesn't fit other fields into notes. Write notes in the same language as the input text.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text field" }), {
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
        temperature: 0,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const extracted = JSON.parse(cleaned);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-client error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
