import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

type SlackApiResponse = {
  ok?: boolean;
  error?: string;
  warning?: string;
  response_metadata?: { warnings?: string[] };
  [key: string]: unknown;
};

async function postToSlack(
  endpoint: string,
  payload: Record<string, unknown>,
  lovableApiKey: string,
  slackApiKey: string,
): Promise<{ response: Response; result: SlackApiResponse }> {
  const response = await fetch(`${GATEWAY_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": slackApiKey,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  let result: SlackApiResponse = {};
  try {
    result = (await response.json()) as SlackApiResponse;
  } catch {
    result = { ok: false, error: "invalid_json_response" };
  }

  return { response, result };
}

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

    const messagePayload: Record<string, unknown> = {
      channel: targetChannel,
      text,
      ...(blocks ? { blocks } : {}),
      username: "Oasis Hub",
      icon_emoji: ":palm_tree:",
    };

    let { response, result } = await postToSlack(
      "chat.postMessage",
      messagePayload,
      LOVABLE_API_KEY,
      SLACK_API_KEY,
    );

    // Public channels can be joined on demand; private channels still require manual invite.
    if (result.error === "not_in_channel" && targetChannel) {
      const joinAttempt = await postToSlack(
        "conversations.join",
        { channel: targetChannel },
        LOVABLE_API_KEY,
        SLACK_API_KEY,
      );

      if (joinAttempt.response.ok && joinAttempt.result.ok) {
        const retry = await postToSlack(
          "chat.postMessage",
          messagePayload,
          LOVABLE_API_KEY,
          SLACK_API_KEY,
        );
        response = retry.response;
        result = retry.result;
      } else {
        console.error("Slack join error:", JSON.stringify(joinAttempt.result));
        throw new Error(
          `Slack bot is not in channel ${targetChannel}. Invite \"Lovable App\" to this channel and retry. Join failed [${joinAttempt.response.status}]: ${JSON.stringify(joinAttempt.result)}`,
        );
      }
    }

    if (!response.ok || !result.ok) {
      console.error("Slack API error:", JSON.stringify(result));
      throw new Error(`Slack API call failed [${response.status}]: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error: unknown) {
    console.error("slack-notify error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
