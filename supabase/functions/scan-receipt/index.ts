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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    const mimeType = imageFile.type || "image/jpeg";

    const systemPrompt = `Analyze this payment receipt or transaction screenshot and extract the following information as JSON. Be precise — only extract what is clearly visible.

Return ONLY valid JSON with this exact structure:
{
  "amount_received": number or null,
  "currency_received": "USD" | "MXN" | "COP" | "EUR" | "OTHER" or null,
  "date_received": "YYYY-MM-DD" or null,
  "sender_name": string or null,
  "reference": string or null,
  "transaction_id": string or null,
  "method": "wise" | "spei" | "transfer" | "other" or null,
  "confidence": "high" | "medium" | "low",
  "notes": string or null
}

Rules:
- For Wise transactions: transaction_id usually starts with #
- method = "wise" if you see the Wise logo or "Wise" text
- method = "spei" if you see SPEI or Mexican bank transfer indicators
- If you see "Money added" or similar, this is an incoming payment
- currency: look for USD, MXN, $ signs with context, or explicit currency labels
- date: convert any format to YYYY-MM-DD
- sender_name: the name of the person/company who sent the money
- Do not guess — return null for fields you cannot clearly read`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: "text",
                text: "Extract payment data from this receipt image.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI scanning failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Parse JSON from the response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Could not parse AI response", raw: content }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-receipt error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
