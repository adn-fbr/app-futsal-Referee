export type NotificationChannelStatus = "pending" | "sent" | "failed" | "skipped";

export interface NotificationChannelOutcome {
  status: NotificationChannelStatus;
  errorCode: string | null;
  provider?: string | null;
  requestId?: number | null;
  sentAt?: string | null;
  messageId?: string | null;
}

export function parseAssignmentNotificationRequest(
  body: unknown,
): { ok: true; assignmentId: string } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "INVALID_REQUEST" };
  }

  const candidate = body as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();

  if (keys.length !== 1 || keys[0] !== "assignmentId") {
    return { ok: false, error: "INVALID_REQUEST" };
  }

  const assignmentId = candidate.assignmentId;
  if (typeof assignmentId !== "string" || !/^[0-9a-fA-F-]{36}$/.test(assignmentId.trim())) {
    return { ok: false, error: "MALFORMED_ASSIGNMENT_ID" };
  }

  return { ok: true, assignmentId: assignmentId.trim() };
}

export function normalizeWhatsAppNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  let digits = trimmed;
  if (digits.startsWith("+62")) {
    digits = `62${digits.slice(3)}`;
  }
  if (digits.startsWith("08")) {
    digits = `62${digits.slice(1)}`;
  }

  if (!/^62\d{9,13}$/.test(digits)) {
    return null;
  }

  return digits;
}

export function buildKirisanTemplateParameters(
  refereeName: string,
  assignmentRole: string,
  competitionName: string,
  matchDate: string,
  venue: string,
  assignmentStatus: string,
): string[] {
  return [
    refereeName,
    assignmentRole,
    competitionName,
    "Hubungi Koordinator Wasit",
    matchDate,
    venue,
    assignmentStatus,
  ];
}

export function isTerminalStatus(status: string | null | undefined): boolean {
  return ["sent", "failed", "skipped"].includes((status ?? "").toLowerCase());
}

export function createChannelOutcome(
  status: NotificationChannelStatus,
  errorCode: string | null = null,
  provider: string | null = null,
  requestId: number | null = null,
  sentAt: string | null = null,
  messageId: string | null = null,
): NotificationChannelOutcome {
  return {
    status,
    errorCode,
    provider,
    requestId,
    sentAt,
    messageId,
  };
}
