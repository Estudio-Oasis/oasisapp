import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the calling user is admin
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsErr } = await anonClient.auth.getUser();
    if (claimsErr || !claims.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for admin operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check caller is admin
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role, agency_id, name")
      .eq("id", claims.user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, full_name, job_title } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the invitation record
    const { error: inviteRecordErr } = await adminClient
      .from("agency_invitations")
      .insert({
        email,
        full_name: full_name || null,
        job_title: job_title || null,
        agency_id: callerProfile.agency_id,
        invited_by: claims.user.id,
        role: "member",
        status: "pending",
      });

    if (inviteRecordErr) {
      return new Response(
        JSON.stringify({ error: inviteRecordErr.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Try to invite via Supabase Auth (sends email to new users)
    const { error: inviteErr } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          name: full_name || email.split("@")[0],
          job_title: job_title || null,
          invited_by_name: callerProfile.name || "Admin",
        },
        redirectTo: `${req.headers.get("origin") || Deno.env.get("SUPABASE_URL")}/setup`,
      });

    // If user already exists, that's fine — invitation record was created above
    if (inviteErr && !inviteErr.message.includes("already been registered")) {
      // Rollback invitation record for unexpected errors
      await adminClient
        .from("agency_invitations")
        .delete()
        .eq("email", email)
        .eq("status", "pending");

      return new Response(JSON.stringify({ error: inviteErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, user: inviteData.user }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
