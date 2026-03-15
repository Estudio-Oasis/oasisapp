import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  isRetryable: (err: any) => boolean,
  maxAttempts = 3,
  baseDelayMs = 2000
): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === maxAttempts) break;
      const delay = baseDelayMs * attempt;
      console.log(`rate_limited_retry attempt=${attempt} delay=${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

function isRateLimitError(err: any): boolean {
  const msg = typeof err === "object" && err !== null ? (err.message || err.msg || "") : String(err);
  return msg.includes("security purposes") || msg.includes("rate") || msg.includes("1 second");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ code: "unauthorized", error: "Unauthorized" }, 401);
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsErr } = await anonClient.auth.getUser();
    if (claimsErr || !claims.user) {
      return jsonResponse({ code: "unauthorized", error: "Unauthorized" }, 401);
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role, agency_id, name")
      .eq("id", claims.user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return jsonResponse({ code: "forbidden", error: "Forbidden: admin only" }, 403);
    }

    const { email, full_name, job_title } = await req.json();

    if (!email) {
      return jsonResponse({ code: "bad_request", error: "Email is required" }, 400);
    }

    // Upsert invitation record
    const { error: inviteRecordErr } = await adminClient
      .from("agency_invitations")
      .upsert(
        {
          email,
          full_name: full_name || null,
          job_title: job_title || null,
          agency_id: callerProfile.agency_id,
          invited_by: claims.user.id,
          role: "member",
          status: "pending",
        },
        { onConflict: "agency_id,email" }
      );

    if (inviteRecordErr) {
      console.error("invite_record_error", inviteRecordErr.message);
      return jsonResponse({ code: "db_error", error: inviteRecordErr.message }, 400);
    }

    // Always redirect to the canonical app URL to avoid auth-bridge interception
    const redirectTo = "https://www.estudiooasis.com/setup";

    // Try inviting via Auth (new users)
    const { error: inviteErr } = await withRetry(
      () =>
        adminClient.auth.admin.inviteUserByEmail(email, {
          data: {
            name: full_name || email.split("@")[0],
            job_title: job_title || null,
            invited_by_name: callerProfile.name || "Admin",
          },
          redirectTo,
        }),
      (err) => isRateLimitError(err)
    );

    if (inviteErr) {
      const isAlreadyRegistered = inviteErr.message.includes("already been registered");

      if (isAlreadyRegistered) {
        console.log("existing_user_resend", email);
        // Existing user — send magic link as notification
        const publicClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!
        );

        const { error: magicLinkErr } = await withRetry(
          () =>
            publicClient.auth.signInWithOtp({
              email,
              options: {
                shouldCreateUser: false,
                emailRedirectTo: redirectTo,
              },
            }),
          (err) => isRateLimitError(err)
        );

        if (magicLinkErr) {
          if (isRateLimitError(magicLinkErr)) {
            console.log("rate_limited_final", email);
            return jsonResponse(
              {
                code: "rate_limited",
                error: "Demasiados intentos. Intenta de nuevo en unos segundos.",
                retry_after_seconds: 10,
              },
              429
            );
          }
          console.error("final_failure magic_link", magicLinkErr.message);
          return jsonResponse({ code: "email_error", error: magicLinkErr.message }, 400);
        }
      } else if (isRateLimitError(inviteErr)) {
        console.log("rate_limited_final", email);
        return jsonResponse(
          {
            code: "rate_limited",
            error: "Demasiados intentos. Intenta de nuevo en unos segundos.",
            retry_after_seconds: 10,
          },
          429
        );
      } else {
        // Unexpected error — rollback invitation
        console.error("final_failure invite", inviteErr.message);
        await adminClient
          .from("agency_invitations")
          .delete()
          .eq("email", email)
          .eq("status", "pending");

        return jsonResponse({ code: "invite_error", error: inviteErr.message }, 400);
      }
    } else {
      console.log("new_user_invite", email);
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error("unhandled_error", err.message);
    return jsonResponse({ code: "internal_error", error: err.message }, 500);
  }
});
