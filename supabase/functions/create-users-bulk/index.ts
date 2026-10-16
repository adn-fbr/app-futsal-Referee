import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkUserData {
  email: string;
  password: string;
  full_name: string;
  role: "admin_provinsi" | "admin_kab_kota" | "panitia" | "wasit" | "evaluator";
  kabupaten_kota_name?: string;
}

interface BulkCreateResult {
  email: string;
  status: "success" | "error";
  message?: string;
  userId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const caller = await resolveCaller(req, supabaseAdmin);
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!hasAnyRole(caller, ["admin_provinsi"])) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Verify the requesting user is an admin_provinsi
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin_provinsi
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin_provinsi")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Only admin_provinsi can bulk create users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { users }: { users: BulkUserData[] } = await req.json();

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: "users array is required and cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit batch size to prevent timeout
    if (users.length > 100) {
      return new Response(
        JSON.stringify({ error: "Maximum 100 users per batch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all kabupaten_kota for name-to-id mapping
    const { data: kabupatenKotaList } = await supabaseAdmin
      .from("kabupaten_kota")
      .select("id, name");

    const kabupatenKotaMap = new Map(
      (kabupatenKotaList || []).map((k) => [k.name.toLowerCase().trim(), k.id])
    );

    const results: BulkCreateResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const userData of users) {
      const { email, password, full_name, role, kabupaten_kota_name } = userData;

      try {
        // Validate required fields
        if (!email || !password || !full_name || !role) {
          results.push({
            email: email || "unknown",
            status: "error",
            message: "Missing required fields: email, password, full_name, role",
          });
          failedCount++;
          continue;
        }

        // Map kabupaten_kota_name to kabupaten_kota_id
        let kabupaten_kota_id: string | undefined;
        if (kabupaten_kota_name) {
          kabupaten_kota_id = kabupatenKotaMap.get(kabupaten_kota_name.toLowerCase().trim());
          if (!kabupaten_kota_id) {
            results.push({
              email,
              status: "error",
              message: `Kabupaten/Kota "${kabupaten_kota_name}" not found`,
            });
            failedCount++;
            continue;
          }
        }

        // Validate that non-admin_provinsi roles have kabupaten_kota
        if (role !== "admin_provinsi" && !kabupaten_kota_id) {
          results.push({
            email,
            status: "error",
            message: "kabupaten_kota_name is required for non-admin_provinsi roles",
          });
          failedCount++;
          continue;
        }

        // Create user with admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name,
          },
        });

        if (createError) {
          results.push({
            email,
            status: "error",
            message: createError.message,
          });
          failedCount++;
          continue;
        }

        // Update profile with kabupaten_kota_id and is_profile_complete
        const isProfileComplete = role !== "wasit";
        
        const profileUpdate: { kabupaten_kota_id?: string; is_profile_complete: boolean; registration_status: string } = {
          is_profile_complete: isProfileComplete,
          registration_status: "approved",
        };
        
        if (kabupaten_kota_id) {
          profileUpdate.kabupaten_kota_id = kabupaten_kota_id;
        }
        
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("id", newUser.user.id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }

        // Assign role (delete existing default role first, then insert new)
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", newUser.user.id);

        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: newUser.user.id,
            role,
          });

        if (roleError) {
          console.error("Error assigning role:", roleError);
          results.push({
            email,
            status: "error",
            message: "User created but role assignment failed: " + roleError.message,
            userId: newUser.user.id,
          });
          failedCount++;
          continue;
        }

        results.push({
          email,
          status: "success",
          userId: newUser.user.id,
        });
        successCount++;

      } catch (error) {
        console.error("Error processing user:", email, error);
        results.push({
          email: email || "unknown",
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: users.length,
          success: successCount,
          failed: failedCount,
        },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
