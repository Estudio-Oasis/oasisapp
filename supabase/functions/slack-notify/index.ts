import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY");
    if (!SLACK_API_KEY) throw new Error("SLACK_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event_type, channel, data } = await req.json();
    if (!event_type) throw new Error("event_type is required");

    // Resolve channel: explicit > DB setting > fallback
    let targetChannel = channel;
    if (!targetChannel) {
      const { data: settings } = await supabase
        .from("agency_settings")
        .select("slack_channel_id")
        .limit(1)
        .maybeSingle();
      targetChannel = settings?.slack_channel_id || "C0917V4QELS";
    }

    let text = "";
    let blocks: any[] | undefined;

    switch (event_type) {
      case "chat_message": {
        const { sender_name, content, has_image } = data || {};
        text = `💬 *${sender_name || "Alguien"}* envió un mensaje en el Hub`;
        blocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `💬 *${sender_name || "Alguien"}* envió un mensaje en el Hub:\n>${content || "(imagen)"}`,
            },
          },
        ];
        if (has_image) {
          blocks.push({
            type: "context",
            elements: [{ type: "mrkdwn", text: "📷 _Incluye una imagen adjunta_" }],
          });
        }
        break;
      }

      case "status_change": {
        const { user_name, new_status } = data || {};
        const statusEmoji: Record<string, string> = {
          online: "🟢",
          working: "💻",
          break: "☕",
          eating: "🍽️",
          afk: "🌙",
          bathroom: "🚿",
          meeting: "📞",
          offline: "⚫",
        };
        const emoji = statusEmoji[new_status] || "🔄";
        text = `${emoji} ${user_name || "Un miembro"} cambió su estado a *${new_status}*`;
        blocks = [
          {
            type: "section",
            text: { type: "mrkdwn", text },
          },
        ];
        break;
      }

      case "ai_summary": {
        const { summary, conversation_partner, generated_by } = data || {};
        text = `✨ Resumen de IA generado por ${generated_by || "alguien"}`;
        blocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `✨ *Resumen de IA* — Conversación con ${conversation_partner || "?"}\n_Generado por ${generated_by || "?"}_`,
            },
          },
          { type: "divider" },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: summary?.substring(0, 2900) || "Sin contenido",
            },
          },
        ];
        break;
      }

      default:
        text = `📢 Evento: ${event_type}`;
        if (data?.message) text += `\n${data.message}`;
    }

    const response = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": SLACK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: targetChannel,
        text,
        ...(blocks ? { blocks } : {}),
        username: "Oasis Hub",
        icon_emoji: ":palm_tree:",
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      console.error("Slack API error:", JSON.stringify(result));
      throw new Error(`Slack API call failed [${response.status}]: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("slack-notify error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
