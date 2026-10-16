import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignmentNotificationRequest {
  assignmentId?: string;
  refereeId?: string;
  eventId?: string;
  type: "assignment" | "reminder";
  role?: string;
}

interface EmailSettings {
  email_provider: string;
  resend_api_key: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: string;
  sender_email_name: string;
  sender_email_address: string;
}

async function sendWithResend(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string
) {
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) throw new Error(error.message);
  return data;
}

async function sendWithSMTP(
  settings: EmailSettings,
  to: string,
  subject: string,
  html: string
) {
  const client = new SMTPClient({
    connection: {
      hostname: settings.smtp_host,
      port: parseInt(settings.smtp_port) || 587,
      tls: settings.smtp_secure === "ssl",
      auth: {
        username: settings.smtp_user,
        password: settings.smtp_password,
      },
    },
  });

  await client.send({
    from: `${settings.sender_email_name} <${settings.sender_email_address}>`,
    to: to,
    subject: subject,
    content: "auto",
    html: html,
  });

  await client.close();
  return { id: `smtp-${Date.now()}` };
}

async function getEmailSettings(supabase: any): Promise<EmailSettings | null> {
  const { data: settings } = await supabase
    .from("public_application_settings")
    .select("key, value")
    .in("key", ["email_provider", "sender_email_name", "sender_email_address"]);

  const settingsMap = settings?.reduce((acc: Record<string, string>, s: { key: string; value: string }) => {
    acc[s.key] = s.value || "";
    return acc;
  }, {} as Record<string, string>) || {};

  const emailSettings: EmailSettings = {
    email_provider: settingsMap.email_provider || "resend",
    resend_api_key: Deno.env.get("RESEND_API_KEY") || "",
    smtp_host: Deno.env.get("SMTP_HOST") || "",
    smtp_port: Deno.env.get("SMTP_PORT") || "587",
    smtp_user: Deno.env.get("SMTP_USER") || "",
    smtp_password: Deno.env.get("SMTP_PASSWORD") || "",
    smtp_secure: Deno.env.get("SMTP_SECURE") || "tls",
    sender_email_name: settingsMap.sender_email_name || "AFP Sulsel",
    sender_email_address: settingsMap.sender_email_address || "onboarding@resend.dev",
  };

  const isEmailConfigured = emailSettings.email_provider === "resend"
    ? !!emailSettings.resend_api_key
    : !!(emailSettings.smtp_host && emailSettings.smtp_user && emailSettings.smtp_password);

  return isEmailConfigured ? emailSettings : null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateRange(startDate: string, endDate: string | null): string {
  if (!endDate || startDate === endDate) {
    return formatDate(startDate);
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} - ${end.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
  }
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const caller = await resolveCaller(req, supabase);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!hasAnyRole(caller, ["admin_provinsi", "admin_kab_kota", "panitia"])) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: AssignmentNotificationRequest = await req.json();
    const { assignmentId, refereeId, eventId, type, role } = body;

    console.log("Processing assignment notification:", body);

    // Get email settings
    const emailSettings = await getEmailSettings(supabase);
    if (!emailSettings) {
      console.warn("Email not configured - skipping notification");
      return new Response(
        JSON.stringify({ success: true, warning: "Email not configured", emailSent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get assignment data if assignmentId is provided
    let assignment: any = null;
    let event: any = null;
    let referee: any = null;

    if (assignmentId) {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("event_assignments")
        .select(`
          *,
          event:event_id (id, name, start_date, end_date, date, location, category, created_by, kabupaten_kota_id, kabupaten_kota:kabupaten_kota_id (name)),
          referee:referee_id (id, full_name)
        `)
        .eq("id", assignmentId)
        .single();

      if (assignmentError) {
        console.error("Assignment not found:", assignmentError);
        return new Response(
          JSON.stringify({ error: "Assignment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      assignment = assignmentData;
      event = assignment.event;
      referee = assignment.referee;
    } else if (eventId && refereeId) {
      // Get event and referee separately
      const [eventResult, refereeResult] = await Promise.all([
        supabase.from("events").select(`*, kabupaten_kota:kabupaten_kota_id (name)`).eq("id", eventId).single(),
        supabase.from("profiles").select("id, full_name").eq("id", refereeId).single()
      ]);

      if (eventResult.error || refereeResult.error) {
        console.error("Event or referee not found");
        return new Response(
          JSON.stringify({ error: "Event or referee not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      event = eventResult.data;
      referee = refereeResult.data;
    }

    if (!event || !referee) {
      return new Response(
        JSON.stringify({ error: "Missing event or referee data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (
      caller.roles.includes("admin_kab_kota") &&
      event.kabupaten_kota_id !== caller.kabupatenKotaId
    ) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (caller.roles.includes("panitia") && event.created_by !== caller.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get referee email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(referee.id);

    if (userError || !userData?.user?.email) {
      console.error("Referee email not found:", userError);
      return new Response(
        JSON.stringify({ error: "Referee email not found", emailSent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipientEmail = userData.user.email;
    const eventStartDate = event.start_date || event.date;
    const eventEndDate = event.end_date || event.start_date || event.date;
    const eventDateDisplay = formatDateRange(eventStartDate, eventEndDate);
    const roleLabel = (role || assignment?.role || "CADANGAN") === "UTAMA" ? "Wasit Utama" : "Wasit Cadangan";
    const senderEmail = `${emailSettings.sender_email_name} <${emailSettings.sender_email_address}>`;

    let emailSubject: string;
    let emailHtml: string;

    if (type === "assignment") {
      emailSubject = `[Penugasan Baru] ${event.name}`;
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a56db, #3b82f6); color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 25px; border: 1px solid #e5e7eb; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .info-row { display: flex; margin-bottom: 12px; padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #3b82f6; }
            .info-label { font-weight: bold; width: 140px; color: #374151; }
            .info-value { flex: 1; }
            .role-badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 20px; font-weight: bold; }
            .action-required { background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 6px; margin-top: 20px; }
            h1 { margin: 0; font-size: 22px; }
            h2 { color: #1f2937; margin-top: 0; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚽ Penugasan Wasit Baru</h1>
            </div>
            <div class="content">
              <p>Halo <strong>${referee.full_name}</strong>,</p>
              <p>Anda telah ditugaskan sebagai wasit untuk event berikut:</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <span class="role-badge">${roleLabel}</span>
              </div>
              
              <h2>📋 Detail Event</h2>
              <div class="info-row">
                <span class="info-label">Nama Event:</span>
                <span class="info-value"><strong>${event.name}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">Tanggal:</span>
                <span class="info-value">${eventDateDisplay}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Lokasi:</span>
                <span class="info-value">${event.location || "-"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Kabupaten/Kota:</span>
                <span class="info-value">${event.kabupaten_kota?.name || "-"}</span>
              </div>
              ${event.category ? `
              <div class="info-row">
                <span class="info-label">Kategori:</span>
                <span class="info-value">${event.category}</span>
              </div>
              ` : ""}
              
              <div class="action-required">
                <strong>⚠️ Tindakan Diperlukan:</strong>
                <p style="margin: 8px 0 0 0;">Silakan login ke aplikasi untuk <strong>mengkonfirmasi</strong> atau <strong>menolak</strong> penugasan ini.</p>
              </div>
            </div>
            <div class="footer">
              <p>Email ini dikirim otomatis dari Sistem Manajemen Wasit AFP Sulsel</p>
              <p>© ${new Date().getFullYear()} Asosiasi Futsal Provinsi - Sulawesi Selatan</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Reminder notification
      const daysUntilEvent = Math.ceil((new Date(eventStartDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const reminderText = daysUntilEvent === 1 ? "besok" : `dalam ${daysUntilEvent} hari`;

      emailSubject = `[Reminder] Event ${event.name} ${reminderText}`;
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 25px; border: 1px solid #e5e7eb; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .info-row { display: flex; margin-bottom: 12px; padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #f59e0b; }
            .info-label { font-weight: bold; width: 140px; color: #374151; }
            .info-value { flex: 1; }
            .countdown { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .countdown-text { font-size: 24px; font-weight: bold; color: #92400e; }
            h1 { margin: 0; font-size: 22px; }
            h2 { color: #1f2937; margin-top: 0; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Reminder Event</h1>
            </div>
            <div class="content">
              <p>Halo <strong>${referee.full_name}</strong>,</p>
              <p>Ini adalah pengingat bahwa Anda memiliki jadwal bertugas sebagai wasit:</p>
              
              <div class="countdown">
                <div class="countdown-text">📅 ${reminderText.toUpperCase()}</div>
              </div>
              
              <h2>📋 Detail Event</h2>
              <div class="info-row">
                <span class="info-label">Nama Event:</span>
                <span class="info-value"><strong>${event.name}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">Tanggal:</span>
                <span class="info-value">${eventDateDisplay}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Lokasi:</span>
                <span class="info-value">${event.location || "-"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Peran Anda:</span>
                <span class="info-value">${roleLabel}</span>
              </div>
              
              <p style="margin-top: 20px; color: #6b7280;">Pastikan Anda sudah mempersiapkan diri untuk event ini. Sukses!</p>
            </div>
            <div class="footer">
              <p>Email ini dikirim otomatis dari Sistem Manajemen Wasit AFP Sulsel</p>
              <p>© ${new Date().getFullYear()} Asosiasi Futsal Provinsi - Sulawesi Selatan</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    console.log("Sending email via", emailSettings.email_provider, "to:", recipientEmail);

    let emailResult;
    if (emailSettings.email_provider === "smtp") {
      emailResult = await sendWithSMTP(emailSettings, recipientEmail, emailSubject, emailHtml);
    } else {
      emailResult = await sendWithResend(
        emailSettings.resend_api_key,
        senderEmail,
        recipientEmail,
        emailSubject,
        emailHtml
      );
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, recipientEmail, emailId: emailResult?.id, emailSent: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-assignment-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
