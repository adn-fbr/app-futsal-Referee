 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 interface RefereeWithExpiringLicense {
   id: string;
   full_name: string;
   email: string;
   license_level: string;
   license_expiry: string;
   days_until_expiry: number;
 }
 
 serve(async (req) => {
   // Handle CORS preflight requests
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     // Create Supabase client with service role for admin access
     const supabaseAdmin = createClient(
       Deno.env.get("SUPABASE_URL") ?? "",
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
     );

     const caller = await resolveCaller(req, supabaseAdmin);
     if (!caller || !hasAnyRole(caller, ["admin_provinsi"])) {
       return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
     }
 
     console.log("Checking for expiring licenses...");
 
     // Get referees with licenses expiring in the next 30 days
     const thirtyDaysFromNow = new Date();
     thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
 
     const { data: expiringReferees, error: fetchError } = await supabaseAdmin
       .from("profiles")
       .select(`
         id,
         full_name,
         license_level,
         license_expiry
       `)
       .not("license_expiry", "is", null)
       .lte("license_expiry", thirtyDaysFromNow.toISOString().split("T")[0])
       .gte("license_expiry", new Date().toISOString().split("T")[0])
       .eq("is_active", true)
       .is("deleted_at", null);
 
     if (fetchError) {
       console.error("Error fetching expiring licenses:", fetchError);
       throw fetchError;
     }
 
     console.log(`Found ${expiringReferees?.length || 0} referees with expiring licenses`);
 
     if (!expiringReferees || expiringReferees.length === 0) {
       return new Response(
         JSON.stringify({ 
           success: true, 
           message: "No expiring licenses found",
           count: 0 
         }),
         {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
           status: 200,
         }
       );
     }
 
     // Get email addresses from auth.users
     const refereeIds = expiringReferees.map(r => r.id);
     const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
 
     if (authError) {
       console.error("Error fetching auth users:", authError);
       throw authError;
     }
 
     // Map emails to referee data
     const refereesWithEmails: RefereeWithExpiringLicense[] = expiringReferees
       .map(referee => {
         const authUser = authUsers.users.find(u => u.id === referee.id);
         if (!authUser?.email) return null;
 
         const expiryDate = new Date(referee.license_expiry);
         const today = new Date();
         const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
 
         return {
           id: referee.id,
           full_name: referee.full_name,
           email: authUser.email,
           license_level: referee.license_level,
           license_expiry: referee.license_expiry,
           days_until_expiry: daysUntilExpiry,
         };
       })
       .filter((r): r is RefereeWithExpiringLicense => r !== null);
 
     console.log(`Sending reminders to ${refereesWithEmails.length} referees`);
 
     // Get Resend API key
     const resendApiKey = Deno.env.get("RESEND_API_KEY");
     if (!resendApiKey) {
       throw new Error("RESEND_API_KEY not configured");
     }
 
     // Send emails
     const emailResults = await Promise.allSettled(
       refereesWithEmails.map(async (referee) => {
         const expiryDate = new Date(referee.license_expiry).toLocaleDateString("id-ID", {
           day: "numeric",
           month: "long",
           year: "numeric",
         });
 
         let urgencyLevel = "informasi";
         let urgencyColor = "#3b82f6";
         if (referee.days_until_expiry <= 7) {
           urgencyLevel = "MENDESAK";
           urgencyColor = "#ef4444";
         } else if (referee.days_until_expiry <= 14) {
           urgencyLevel = "penting";
           urgencyColor = "#f59e0b";
         }
 
         const emailBody = {
           from: "FFSS System <noreply@futsal-federasi.id>",
           to: [referee.email],
           subject: `⚠️ Pengingat: Lisensi ${referee.license_level} Anda Akan Berakhir`,
           html: `
             <!DOCTYPE html>
             <html>
               <head>
                 <meta charset="utf-8">
                 <style>
                   body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                   .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                   .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                   .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
                   .alert-box { background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                   .info-table { width: 100%; background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
                   .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
                   .info-label { font-weight: bold; color: #64748b; }
                   .info-value { color: #1e293b; }
                   .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                   .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
                 </style>
               </head>
               <body>
                 <div class="container">
                   <div class="header">
                     <h1>🏆 Federasi Futsal Sulawesi Selatan</h1>
                     <p>Sistem Manajemen Wasit</p>
                   </div>
                   <div class="content">
                     <h2>Halo, ${referee.full_name}!</h2>
                     
                     <div class="alert-box">
                       <h2 style="margin: 0; text-transform: uppercase;">${urgencyLevel}</h2>
                       <p style="margin: 10px 0 0 0; font-size: 18px;">Lisensi Anda akan berakhir dalam ${referee.days_until_expiry} hari</p>
                     </div>
 
                     <p>Ini adalah pengingat otomatis bahwa lisensi wasit Anda akan segera berakhir.</p>
 
                     <div class="info-table">
                       <div class="info-row">
                         <span class="info-label">Tingkat Lisensi:</span>
                         <span class="info-value">${referee.license_level}</span>
                       </div>
                       <div class="info-row">
                         <span class="info-label">Tanggal Berakhir:</span>
                         <span class="info-value">${expiryDate}</span>
                       </div>
                       <div class="info-row" style="border: none;">
                         <span class="info-label">Sisa Waktu:</span>
                         <span class="info-value" style="color: ${urgencyColor}; font-weight: bold;">${referee.days_until_expiry} hari lagi</span>
                       </div>
                     </div>
 
                     <p><strong>Tindakan yang perlu dilakukan:</strong></p>
                     <ul>
                       <li>Segera hubungi admin provinsi untuk perpanjangan lisensi</li>
                       <li>Siapkan dokumen yang diperlukan untuk perpanjangan</li>
                       <li>Pastikan semua persyaratan perpanjangan terpenuhi</li>
                     </ul>
 
                     <p style="color: #dc2626; font-weight: bold;">⚠️ Penting: Jika lisensi berakhir, Anda tidak dapat ditugaskan pada event baru sampai lisensi diperpanjang.</p>
 
                     <div style="text-align: center;">
                       <a href="${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app") || "#"}" class="button">
                         Login ke Dashboard
                       </a>
                     </div>
 
                     <div class="footer">
                       <p>Email ini dikirim secara otomatis oleh sistem FFSS.</p>
                       <p>Jika Anda memiliki pertanyaan, silakan hubungi admin provinsi Anda.</p>
                       <p>&copy; ${new Date().getFullYear()} Federasi Futsal Sulawesi Selatan</p>
                     </div>
                   </div>
                 </div>
               </body>
             </html>
           `,
         };
 
         const response = await fetch("https://api.resend.com/emails", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             Authorization: `Bearer ${resendApiKey}`,
           },
           body: JSON.stringify(emailBody),
         });
 
         if (!response.ok) {
           const error = await response.text();
           console.error(`Failed to send email to ${referee.email}:`, error);
           throw new Error(`Email failed: ${error}`);
         }
 
         console.log(`Email sent successfully to ${referee.email}`);
         return { success: true, email: referee.email };
       })
     );
 
     // Count successes and failures
     const successful = emailResults.filter(r => r.status === "fulfilled").length;
     const failed = emailResults.filter(r => r.status === "rejected").length;
 
     console.log(`Email summary: ${successful} sent, ${failed} failed`);
 
     return new Response(
       JSON.stringify({
         success: true,
         message: "License reminder emails sent",
         total: refereesWithEmails.length,
         sent: successful,
         failed: failed,
         referees: refereesWithEmails.map(r => ({
           name: r.full_name,
           email: r.email,
           days_until_expiry: r.days_until_expiry,
         })),
       }),
       {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
         status: 200,
       }
     );
   } catch (error) {
     console.error("Error in send-license-reminder:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(
       JSON.stringify({ error: errorMessage }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });