import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  testEmail: string;
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
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const caller = await resolveCaller(req, supabase);
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!hasAnyRole(caller, ["admin_provinsi"])) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { testEmail }: TestEmailRequest = await req.json();

    if (!testEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Test email address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: settings, error: settingsError } = await supabase
      .from("public_application_settings")
      .select("key, value")
      .in("key", ["email_provider", "sender_email_name", "sender_email_address"]);

    if (settingsError) {
      console.error("Failed to fetch settings:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch email settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse settings to map
    const settingsMap = settings?.reduce((acc, s) => {
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

    // Check if email is configured
    const isEmailConfigured = emailSettings.email_provider === "resend"
      ? !!emailSettings.resend_api_key
      : !!(emailSettings.smtp_host && emailSettings.smtp_user && emailSettings.smtp_password);

    if (!isEmailConfigured) {
      const missingConfig = emailSettings.email_provider === "resend"
        ? "Resend API Key belum dikonfigurasi"
        : "Konfigurasi SMTP belum lengkap";
      
      return new Response(
        JSON.stringify({ success: false, error: missingConfig }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const senderEmail = `${emailSettings.sender_email_name} <${emailSettings.sender_email_address}>`;
    const subject = "✅ Test Email - Konfigurasi Berhasil";
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .success-box { background: #d1fae5; border: 1px solid #34d399; padding: 15px; border-radius: 8px; text-align: center; }
          h1 { margin: 0; font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Test Email Berhasil</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #065f46;">
                Konfigurasi email Anda sudah benar!
              </p>
            </div>
            <p style="margin-top: 20px;">Ini adalah email test dari sistem AFP Sulsel.</p>
            <p><strong>Provider:</strong> ${emailSettings.email_provider.toUpperCase()}</p>
            <p><strong>Pengirim:</strong> ${senderEmail}</p>
            <p><strong>Waktu:</strong> ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Makassar" })} WITA</p>
          </div>
          <div class="footer">
            <p>Email ini dikirim otomatis dari Sistem Manajemen Wasit AFP Sulsel</p>
            <p>© ${new Date().getFullYear()} Asosiasi Futsal Provinsi - Sulawesi Selatan</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending test email via", emailSettings.email_provider, "to:", testEmail);

    let emailResult;
    if (emailSettings.email_provider === "smtp") {
      emailResult = await sendWithSMTP(emailSettings, testEmail, subject, html);
    } else {
      emailResult = await sendWithResend(
        emailSettings.resend_api_key,
        senderEmail,
        testEmail,
        subject,
        html
      );
    }

    console.log("Test email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email test berhasil dikirim",
        provider: emailSettings.email_provider,
        recipient: testEmail 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in test-email-config:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
