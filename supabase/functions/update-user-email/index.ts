import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateEmailRequest {
  user_id: string;
  new_email: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const caller = await resolveCaller(req, supabaseAdmin);
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!hasAnyRole(caller, ["admin_provinsi", "admin_kab_kota"])) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = 
      await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .in("role", ["admin_provinsi", "admin_kab_kota"])
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Hanya admin yang dapat mengubah email user" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, new_email }: UpdateEmailRequest = await req.json();

    if (!user_id || !new_email) {
      return new Response(
        JSON.stringify({ error: "user_id dan new_email harus diisi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(new_email)) {
      return new Response(
        JSON.stringify({ error: "Format email tidak valid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (caller.roles.includes("admin_kab_kota")) {
      const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
        .from("profiles")
        .select("kabupaten_kota_id")
        .eq("id", user_id)
        .maybeSingle();
      if (
        targetProfileError ||
        !targetProfile ||
        !caller.kabupatenKotaId ||
        targetProfile.kabupaten_kota_id !== caller.kabupatenKotaId
      ) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Get old email for audit log
    const { data: oldUserData } = await supabaseAdmin.auth.admin.getUserById(user_id);
    const oldEmail = oldUserData?.user?.email;

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", new_email)
      .neq("id", user_id)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Email sudah digunakan oleh user lain" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update email in auth.users
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { email: new_email, email_confirm: true }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      action: "USER_EMAIL_UPDATED",
      entity_type: "profiles",
      entity_id: user_id,
      actor_id: requestingUser.id,
      old_data: { email: oldEmail },
      new_data: { email: new_email },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating user email:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
