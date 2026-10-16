 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";
 
// Resend client setup - using fetch directly to avoid type issues
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type",
 };
 
 interface ProfileReminderRequest {
   userIds: string[];
 }
 
async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Asosiasi Futsal Sulsel <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

 const handler = async (req: Request): Promise<Response> => {
   // Handle CORS preflight requests
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     // Verify authentication
     const authHeader = req.headers.get("Authorization");
     if (!authHeader) {
       throw new Error("Missing authorization header");
     }
 
     // Create Supabase client
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey);
    const caller = await resolveCaller(req, supabase);
    if (!caller) throw new Error("Unauthorized");
    if (!hasAnyRole(caller, ["admin_provinsi", "admin_kab_kota"])) throw new Error("Forbidden");
 
     // Verify user is admin
     const token = authHeader.replace("Bearer ", "");
     const { data: { user }, error: authError } = await supabase.auth.getUser(token);
 
     if (authError || !user) {
       throw new Error("Unauthorized");
     }
 
     // Check if user is admin
     const { data: roles } = await supabase
       .from("user_roles")
       .select("role")
       .eq("user_id", user.id);
 
     const isAdmin = roles?.some(r => 
       r.role === "admin_provinsi" || r.role === "admin_kab_kota"
     );
 
     if (!isAdmin) {
       throw new Error("Forbidden: Admin access required");
     }
 
     const { userIds }: ProfileReminderRequest = await req.json();
 
     if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
       throw new Error("Invalid userIds parameter");
     }
 
     console.log(`Sending profile reminder to ${userIds.length} users`);
 
     // Fetch user profiles and emails from auth.users
     let profilesQuery = supabase
       .from("profiles")
       .select("id, full_name")
       .in("id", userIds);
     if (caller.roles.includes("admin_kab_kota")) {
       if (!caller.kabupatenKotaId) throw new Error("Forbidden");
       profilesQuery = profilesQuery.eq("kabupaten_kota_id", caller.kabupatenKotaId);
     }
     const { data: profiles, error: profilesError } = await profilesQuery;
 
     if (profilesError) {
       throw profilesError;
     }
 
     // Get emails from auth.users - need to use admin API
     const results = [];
     
     for (const profile of profiles || []) {
       try {
         // Get user email from auth
         const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(profile.id);
         
         if (authUserError || !authUser.user?.email) {
           console.error(`Failed to get email for user ${profile.id}:`, authUserError);
           results.push({
             userId: profile.id,
             success: false,
             error: "Email not found"
           });
           continue;
         }
 
         const email = authUser.user.email;
 
         // Send email using Resend
        const emailResponse = await sendEmail(
          email,
          "Lengkapi Profil Anda - Asosiasi Futsal Sulsel",
          `
             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
               <h2 style="color: #2563eb;">Halo ${profile.full_name},</h2>
               
               <p>Kami melihat bahwa profil Anda di sistem Asosiasi Futsal Provinsi Sulawesi Selatan belum lengkap.</p>
               
               <p>Untuk dapat mengakses semua fitur sistem, silakan lengkapi profil Anda dengan mengikuti langkah berikut:</p>
               
               <ol style="line-height: 1.8;">
                 <li>Login ke sistem menggunakan email dan password Anda</li>
                 <li>Lengkapi informasi profil yang diminta</li>
                 <li>Upload dokumen yang diperlukan (foto profil, KTP, lisensi)</li>
                 <li>Submit untuk verifikasi</li>
               </ol>
               
               <div style="margin: 30px 0;">
                 <a href="${supabaseUrl.replace('supabase.co', 'lovable.app')}" 
                    style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                   Lengkapi Profil Sekarang
                 </a>
               </div>
               
               <p style="color: #666; font-size: 14px; margin-top: 30px;">
                 Jika Anda memerlukan bantuan, silakan hubungi admin kami.
               </p>
               
               <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
               
               <p style="color: #999; font-size: 12px;">
                 © 2026 Asosiasi Futsal Provinsi Sulawesi Selatan<br>
                 Sistem Manajemen Wasit & Event
               </p>
             </div>
          `
        );
 
         console.log(`Email sent to ${email}:`, emailResponse);
 
         results.push({
           userId: profile.id,
           success: true,
           email: email,
         });
       } catch (error: any) {
         console.error(`Error sending email to user ${profile.id}:`, error);
         results.push({
           userId: profile.id,
           success: false,
           error: error.message,
         });
       }
     }
 
     const successCount = results.filter(r => r.success).length;
     const failedCount = results.filter(r => !r.success).length;
 
     console.log(`Profile reminders sent: ${successCount} success, ${failedCount} failed`);
 
     return new Response(
       JSON.stringify({
         success: true,
         summary: {
           total: userIds.length,
           sent: successCount,
           failed: failedCount,
         },
         results,
       }),
       {
         status: 200,
         headers: {
           "Content-Type": "application/json",
           ...corsHeaders,
         },
       }
     );
   } catch (error: any) {
     console.error("Error in send-profile-reminder function:", error);
     return new Response(
       JSON.stringify({ 
         success: false,
         error: error.message 
       }),
       {
         status: error.message.includes("Unauthorized") ? 401 : 
                 error.message.includes("Forbidden") ? 403 : 500,
         headers: { 
           "Content-Type": "application/json", 
           ...corsHeaders 
         },
       }
     );
   }
 };
 
 serve(handler);