import { supabase } from "@/integrations/supabase/client";

type AuthAuditAction = "AUTH_LOGIN" | "AUTH_LOGOUT" | "AUTH_PASSWORD_RESET";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function logAuthAudit(params: {
  action: AuthAuditAction;
  userId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabase.from("audit_logs").insert({
      action: params.action,
      entity_type: "auth",
      entity_id: params.userId,
      actor_id: params.userId,
      metadata: {
        user_agent: navigator.userAgent,
        ...params.metadata,
      },
    } as never);
  } catch {
    // jangan blokir UX bila logging gagal
  }
}

export async function writeAuditLog(params: {
  action: string;
  actorId: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("audit_logs").insert({
    action: params.action,
    entity_type: "event",
    entity_id: params.entityId,
    actor_id: params.actorId,
    metadata: params.metadata ?? null,
    old_data: params.oldData ?? null,
    new_data: params.newData ?? null,
  } as never);

  if (error) throw error;
}

export async function logAuthEvent(params: {
  event:
    | "AUTH_LOGIN"
    | "AUTH_LOGOUT"
    | "AUTH_PASSWORD_RESET"
    | "AUTH_LOGIN_FAILED";
  success: boolean;
  userId?: string;
  identifier?: string; // email/username for hashing only
  metadata?: Record<string, unknown>;
}) {
  try {
    const identifier_hash = params.identifier
      ? await sha256Hex(params.identifier.trim().toLowerCase())
      : null;

    await supabase.from("auth_event_logs").insert({
      event: params.event,
      success: params.success,
      user_id: params.userId ?? null,
      identifier_hash,
      metadata: {
        user_agent: navigator.userAgent,
        ...params.metadata,
      },
    } as never);
  } catch {
    // jangan blokir UX bila logging gagal
  }
}
