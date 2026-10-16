import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";
import {
  buildKirisanTemplateParameters,
  createChannelOutcome,
  isTerminalStatus,
  normalizeWhatsAppNumber,
  parseAssignmentNotificationRequest,
  type NotificationChannelOutcome,
} from "../../../src/lib/notificationOrchestrator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AssignmentNotificationAggregate {
  id: string;
  assignment_id: string;
  email_status: string | null;
  whatsapp_status: string | null;
  whatsapp_provider: string | null;
  whatsapp_request_id: number | null;
  whatsapp_message_id: string | null;
  whatsapp_error_code: string | null;
  email_error_code: string | null;
  created_at: string;
  updated_at: string;
}

async function claimNotificationChannel(
  supabase: any,
  assignmentId: string,
  channel: "email" | "whatsapp",
  claimId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("claim_notification_channel", {
    p_assignment_id: assignmentId,
    p_channel: channel,
    p_claim_id: claimId,
  });

  if (error) {
    console.error("claim_notification_channel_error", {
      assignmentId,
      channel,
      claimId,
      error: error.message,
    });
    return false;
  }

  return String(data ?? "").toUpperCase() === "CLAIMED";
}

async function finalizeNotificationChannel(
  supabase: any,
  assignmentId: string,
  channel: "email" | "whatsapp",
  claimId: string,
  status: "sent" | "failed",
  provider: string | null,
  requestId: number | null,
  errorCode: string | null,
): Promise<number> {
  const { data, error } = await supabase.rpc("finalize_notification_channel", {
    p_assignment_id: assignmentId,
    p_channel: channel,
    p_claim_id: claimId,
    p_status: status,
    p_provider: provider,
    p_request_id: requestId,
    p_error_code: errorCode,
  });

  if (error) {
    console.error("finalize_notification_channel_error", {
      assignmentId,
      channel,
      claimId,
      status,
      provider,
      requestId,
      error: error.message,
    });
    return 0;
  }

  return Number(data ?? 0);
}

async function ensureAssignmentNotification(
  supabase: any,
  assignmentId: string,
): Promise<AssignmentNotificationAggregate | null> {
  const { data, error } = await supabase
    .from("assignment_notifications")
    .select("id, assignment_id, email_status, whatsapp_status, whatsapp_provider, whatsapp_request_id, whatsapp_message_id, whatsapp_error_code, email_error_code, created_at, updated_at")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("assignment_notifications")
      .upsert(
        {
          assignment_id: assignmentId,
          email_status: "pending",
          whatsapp_status: "pending",
        },
        { onConflict: "assignment_id", ignoreDuplicates: false },
      )
      .select("id, assignment_id, email_status, whatsapp_status, whatsapp_provider, whatsapp_request_id, whatsapp_message_id, whatsapp_error_code, email_error_code, created_at, updated_at")
      .maybeSingle();

    if (insertError) throw insertError;
    return inserted ?? null;
  }

  return data;
}

async function updateNotificationChannel(
  supabase: any,
  assignmentId: string,
  channel: "email" | "whatsapp",
  status: string,
  errorCode: string | null,
  provider?: string | null,
  requestId?: number | null,
  sentAt?: string | null,
  messageId?: string | null,
): Promise<void> {
  const existing = await ensureAssignmentNotification(supabase, assignmentId);
  const nextValues: Record<string, unknown> = {
    assignment_id: assignmentId,
    id: existing?.id ?? undefined,
  };

  if (channel === "email") {
    nextValues.email_status = status;
    nextValues.email_error_code = errorCode;
    nextValues.email_sent_at = sentAt ?? (status === "sent" ? new Date().toISOString() : null);
  } else {
    nextValues.whatsapp_status = status;
    nextValues.whatsapp_error_code = errorCode;
    nextValues.whatsapp_sent_at = sentAt ?? (status === "sent" ? new Date().toISOString() : null);
    nextValues.whatsapp_provider = provider ?? existing?.whatsapp_provider ?? null;
    nextValues.whatsapp_request_id = requestId ?? existing?.whatsapp_request_id ?? null;
    nextValues.whatsapp_message_id = messageId ?? existing?.whatsapp_message_id ?? null;
  }

  const { error } = await supabase
    .from("assignment_notifications")
    .upsert(nextValues, { onConflict: "assignment_id", ignoreDuplicates: false });

  if (error) throw error;
}

async function getAssignmentContext(supabase: any, assignmentId: string, caller: any, correlationId?: string) {
  const { data, error } = await supabase
    .from("event_assignments")
    .select(`
      id,
      event_id,
      referee_id,
      role,
      status,
      event:events!event_id (
        id,
        name,
        date,
        location,
        created_by,
        kabupaten_kota_id
      ),
      referee:profiles!referee_id (
        id,
        full_name,
        email,
        kabupaten_kota_id
      )
    `)
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return { notFound: true } as const;
  }

  if (caller.roles.includes("admin_kab_kota") && data.event?.kabupaten_kota_id !== caller.kabupatenKotaId) {
    return { forbidden: true } as const;
  }

  if (caller.roles.includes("panitia") && data.event?.created_by !== caller.user.id) {
    return { forbidden: true } as const;
  }

  let refereeContact: { whatsapp_number: string | null } | null = null;

  try {
    const { data: contactData, error: contactError } = await supabase
      .from("referee_contacts")
      .select("whatsapp_number")
      .eq("referee_id", data.referee_id)
      .maybeSingle();

    if (contactError) {
      throw contactError;
    }

    refereeContact = contactData ? { whatsapp_number: contactData.whatsapp_number ?? null } : null;
  } catch (error) {
    const safeError = getSafeErrorInfo(error);
    console.error("notification_orchestrator_error", {
      correlation_id: correlationId ?? null,
      phase: "get_referee_contact",
      assignment_id: assignmentId,
      error_name: safeError.error_name,
      error_message: safeError.error_message,
      error_code: safeError.error_code,
      error_details: safeError.error_details,
      error_hint: safeError.error_hint,
    });
    throw error;
  }

  return { notFound: false, assignment: { ...data, referee_contact: refereeContact } };
}

async function callEmailNotification(supabase: any, assignmentId: string, authorization: string | null): Promise<NotificationChannelOutcome> {
  if (!authorization) {
    return createChannelOutcome("failed", "EMAIL_DELIVERY_FAILED");
  }

  try {
    const { data, error } = await supabase.functions.invoke("send-assignment-notification", {
      body: { assignmentId, type: "assignment" },
      headers: {
        Authorization: authorization,
      },
    });

    if (error || !data) {
      return createChannelOutcome("failed", "EMAIL_DELIVERY_FAILED");
    }

    if (data.warning || data.emailSent === false) {
      return createChannelOutcome("skipped", "EMAIL_SERVICE_UNAVAILABLE");
    }

    if (data.success === false || data.status === "failed") {
      return createChannelOutcome("failed", "EMAIL_DELIVERY_FAILED");
    }

    return createChannelOutcome("sent", null);
  } catch {
    return createChannelOutcome("failed", "EMAIL_DELIVERY_FAILED");
  }
}

function buildWhatsAppTemplatePayload(
  assignment: any,
  contactNumber: string,
): { to: string; type: "template"; template: { name: string; language: string; parameters: string[] } } {
  const kickoffTimeLabel = "Hubungi Koordinator Wasit";
  const parameters = [
    assignment.referee?.full_name ?? "Referee",
    assignment.role ?? "CADANGAN",
    assignment.event?.name ?? "Kompetisi",
    kickoffTimeLabel,
    assignment.event?.date ?? "",
    assignment.event?.location ?? "",
    assignment.status ?? "pending",
  ];

  return {
    to: contactNumber,
    type: "template",
    template: {
      name: "afp_sulsel_referee_assignmen_new",
      language: "en_US",
      parameters,
    },
  };
}

async function invokeWhatsAppDelivery(
  supabase: any,
  assignment: any,
  authorization: string | null,
): Promise<NotificationChannelOutcome> {
  const rawContact = assignment.referee_contact?.whatsapp_number ?? null;
  const normalized = normalizeWhatsAppNumber(rawContact);

  if (!normalized) {
    return createChannelOutcome("skipped", "WHATSAPP_CONTACT_MISSING");
  }

  if (!authorization) {
    return createChannelOutcome("failed", "WHATSAPP_DELIVERY_FAILED");
  }

  const payload = buildWhatsAppTemplatePayload(assignment, normalized);

  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: payload,
      headers: {
        Authorization: authorization,
      },
    });

    if (error || !data) {
      return createChannelOutcome("failed", "WHATSAPP_DELIVERY_FAILED");
    }

    const providerResult = data as {
      success?: boolean;
      status?: string;
      provider?: string | null;
      requestId?: number | null;
      messageId?: string | null;
    };

    const normalizedMessageId = typeof providerResult.messageId === "string" && providerResult.messageId.trim().length > 0
      ? providerResult.messageId.trim()
      : null;

    if (providerResult.success === false || providerResult.status === "failed" || !normalizedMessageId) {
      return createChannelOutcome("failed", "WHATSAPP_DELIVERY_FAILED");
    }

    return createChannelOutcome(
      "sent",
      null,
      providerResult.provider ?? null,
      typeof providerResult.requestId === "number" ? providerResult.requestId : null,
      null,
      normalizedMessageId,
    );
  } catch {
    return createChannelOutcome("failed", "WHATSAPP_DELIVERY_FAILED");
  }
}

function getSafeErrorInfo(error: unknown) {
  const asString = (value: unknown): string | undefined => {
    if (typeof value === "string") {
      return value.trim().length > 0 ? value : undefined;
    }

    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
      return String(value);
    }

    return undefined;
  };

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const errorName = asString(record.name) ?? asString((error as { constructor?: { name?: string } })?.constructor?.name) ?? "unknown";
    const errorMessage = asString(record.message) ?? "Unknown error";
    const errorCode = asString(record.code);
    const errorDetails = asString(record.details);
    const errorHint = asString(record.hint);

    return {
      error_name: errorName,
      error_message: errorMessage,
      ...(errorCode ? { error_code: errorCode } : {}),
      ...(errorDetails ? { error_details: errorDetails } : {}),
      ...(errorHint ? { error_hint: errorHint } : {}),
    };
  }

  if (typeof error === "string") {
    return {
      error_name: "string",
      error_message: error.trim() || "Unknown error",
    };
  }

  return {
    error_name: "unknown",
    error_message: "Unknown error",
  };
}

const jsonResponse = (body: Record<string, unknown>, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const handler = async (req: Request): Promise<Response> => {
  const correlationId = crypto.randomUUID();
  let phase = "start";

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");

    phase = "environment_check";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ success: false, error: "Internal server error", correlationId }, 500);
    }

    phase = "service_role_client";
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    phase = "resolve_caller";
    const caller = await resolveCaller(req, supabase);
    if (!caller) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    phase = "authorization";
    if (!hasAnyRole(caller, ["admin_provinsi", "admin_kab_kota", "panitia"])) { return jsonResponse({ success: false, error: "Forbidden" }, 403); }

    phase = "parse_request";
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid request" }, 400);
    }

    const parsed = parseAssignmentNotificationRequest(body);
    if (!parsed.ok) {
      return jsonResponse({ success: false, error: parsed.error }, 400);
    }

    phase = "get_assignment_context";
    let assignmentLookup: Awaited<ReturnType<typeof getAssignmentContext>>;
    try {
      assignmentLookup = await getAssignmentContext(supabase, parsed.assignmentId, caller);
    } catch (error) {
      const safeError = getSafeErrorInfo(error);
      console.error("notification_orchestrator_error", {
        correlation_id: correlationId,
        phase: "get_assignment_context",
        assignment_id: parsed.assignmentId,
        error_name: safeError.error_name,
        error_message: safeError.error_message,
        error_code: safeError.error_code,
        error_details: safeError.error_details,
        error_hint: safeError.error_hint,
      });
      return jsonResponse({ success: false, error: "Internal server error", correlationId }, 500);
    }

    if ("notFound" in assignmentLookup && assignmentLookup.notFound) {
      return jsonResponse({ success: false, error: "NOT_FOUND" }, 404);
    }

    if ("forbidden" in assignmentLookup && assignmentLookup.forbidden) {
      return jsonResponse({ success: false, error: "Forbidden" }, 403);
    }

    const assignment = assignmentLookup.assignment;
    phase = "ensure_notification";
    const notification = await ensureAssignmentNotification(supabase, parsed.assignmentId);

    const existingEmailStatus = notification?.email_status ?? "pending";
    const existingWhatsAppStatus = notification?.whatsapp_status ?? "pending";

    let emailClaimResult: string | null = null;
    let emailResult: NotificationChannelOutcome =
      existingEmailStatus === "sent"
        ? createChannelOutcome("sent", null)
        : isTerminalStatus(existingEmailStatus)
          ? createChannelOutcome(existingEmailStatus as "failed" | "skipped", notification?.email_error_code ?? null)
          : createChannelOutcome("skipped", "NOT_CLAIMED");

    if (existingEmailStatus !== "sent" && !isTerminalStatus(existingEmailStatus)) {
      phase = "claim_email";
      const claimId = crypto.randomUUID();
      const claimed = await claimNotificationChannel(supabase, parsed.assignmentId, "email", claimId);
      emailClaimResult = claimed ? "CLAIMED" : "NOT_CLAIMED";

      if (claimed) {
        phase = "invoke_email";
        emailResult = await callEmailNotification(supabase, parsed.assignmentId, authorization);
        phase = "finalize_email";
        const finalizedCount = await finalizeNotificationChannel(
          supabase,
          parsed.assignmentId,
          "email",
          claimId,
          emailResult.status === "sent" ? "sent" : "failed",
          null,
          null,
          emailResult.status === "failed" ? emailResult.errorCode ?? "EMAIL_DELIVERY_FAILED" : null,
        );

        if (finalizedCount === 1) {
          emailResult = createChannelOutcome(emailResult.status === "sent" ? "sent" : "failed", emailResult.errorCode ?? null);
        } else {
          emailResult = createChannelOutcome("skipped", "NOT_CLAIMED");
        }
      }
    }

    if (emailResult.status !== "pending" && emailResult.status !== "skipped") {
      phase = "persist_email_result";
      await updateNotificationChannel(
        supabase,
        parsed.assignmentId,
        "email",
        emailResult.status,
        emailResult.errorCode,
      );
    }

    let whatsappClaimResult: string | null = null;
    let whatsappResult: NotificationChannelOutcome =
      existingWhatsAppStatus === "sent"
        ? createChannelOutcome("sent", null, notification?.whatsapp_provider ?? null, notification?.whatsapp_request_id ?? null)
        : isTerminalStatus(existingWhatsAppStatus)
          ? createChannelOutcome(existingWhatsAppStatus as "failed" | "skipped", notification?.whatsapp_error_code ?? null, notification?.whatsapp_provider ?? null, notification?.whatsapp_request_id ?? null)
          : createChannelOutcome("skipped", "WHATSAPP_CONTACT_MISSING");

    if (existingWhatsAppStatus !== "sent" && !isTerminalStatus(existingWhatsAppStatus)) {
      phase = "read_channel_status";
      const rawContact = assignment.referee_contact?.whatsapp_number ?? null;
      const normalized = normalizeWhatsAppNumber(rawContact);

      if (!normalized) {
        phase = "claim_whatsapp";
        whatsappResult = createChannelOutcome("skipped", "WHATSAPP_CONTACT_MISSING");
        phase = "persist_whatsapp_result";
        await updateNotificationChannel(
          supabase,
          parsed.assignmentId,
          "whatsapp",
          "skipped",
          "WHATSAPP_CONTACT_MISSING",
          null,
          null,
          null,
          null,
        );
      } else {
        phase = "claim_whatsapp";
        const claimId = crypto.randomUUID();
        const claimed = await claimNotificationChannel(supabase, parsed.assignmentId, "whatsapp", claimId);
        whatsappClaimResult = claimed ? "CLAIMED" : "NOT_CLAIMED";

        if (claimed) {
          phase = "invoke_whatsapp";
          whatsappResult = await invokeWhatsAppDelivery(supabase, assignment, authorization);
          phase = "finalize_whatsapp";
          const finalizedCount = await finalizeNotificationChannel(
            supabase,
            parsed.assignmentId,
            "whatsapp",
            claimId,
            whatsappResult.status === "sent" ? "sent" : "failed",
            whatsappResult.provider ?? null,
            whatsappResult.requestId ?? null,
            whatsappResult.status === "failed" ? whatsappResult.errorCode ?? "WHATSAPP_DELIVERY_FAILED" : null,
          );

          if (finalizedCount === 1) {
            whatsappResult = createChannelOutcome(
              whatsappResult.status === "sent" ? "sent" : "failed",
              whatsappResult.errorCode ?? null,
              whatsappResult.provider ?? null,
              whatsappResult.requestId ?? null,
              whatsappResult.sentAt ?? null,
              whatsappResult.messageId ?? null,
            );
          } else {
            whatsappResult = createChannelOutcome(
              "skipped",
              "NOT_CLAIMED",
              whatsappResult.provider ?? null,
              whatsappResult.requestId ?? null,
              whatsappResult.sentAt ?? null,
              whatsappResult.messageId ?? null,
            );
          }
        }
      }
    }

    if (whatsappResult.status !== "pending") {
      phase = "persist_whatsapp_result";
      await updateNotificationChannel(
        supabase,
        parsed.assignmentId,
        "whatsapp",
        whatsappResult.status,
        whatsappResult.errorCode,
        whatsappResult.provider ?? null,
        whatsappResult.requestId ?? null,
        whatsappResult.sentAt ?? null,
        whatsappResult.messageId ?? null,
      );
    }

    phase = "final_ensure_notification";
    const finalNotification = await ensureAssignmentNotification(supabase, parsed.assignmentId);

    console.log("notification_orchestrator_completed", {
      assignmentId: parsed.assignmentId,
      notificationId: finalNotification?.id ?? null,
      emailStatus: emailResult.status,
      whatsappStatus: whatsappResult.status,
      emailErrorCode: emailResult.errorCode,
      whatsappErrorCode: whatsappResult.errorCode,
      emailClaimResult,
      whatsappClaimResult,
      correlation_id: correlationId,
      phase,
    });

    phase = "complete";
    return jsonResponse(
      {
        success: true,
        assignmentId: parsed.assignmentId,
        notificationId: finalNotification?.id ?? null,
        email: {
          status: emailResult.status,
          claimResult: emailClaimResult,
          errorCode: emailResult.errorCode,
        },
        whatsapp: {
          status: whatsappResult.status,
          claimResult: whatsappClaimResult,
          provider: whatsappResult.provider ?? null,
          requestId: whatsappResult.requestId ?? null,
          errorCode: whatsappResult.errorCode,
        },
      },
      200,
    );
  } catch (error) {
    console.error("notification_orchestrator_unhandled_error", {
      correlation_id: correlationId,
      phase,
      ...getSafeErrorInfo(error),
    });
    return jsonResponse({ success: false, error: "Internal server error", correlationId }, 500);
  }
};

if (typeof Deno !== "undefined") {
  serve((req) => handler(req));
}

export { handler };
