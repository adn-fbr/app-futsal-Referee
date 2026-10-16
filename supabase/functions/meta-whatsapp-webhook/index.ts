import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type MetaWebhookLifecycleStatus = "sent" | "delivered" | "read" | "failed";

export type MetaWebhookEventIdentity = {
  provider: "meta";
  wabaId: string;
  phoneNumberId: string;
  wamid: string;
  status: MetaWebhookLifecycleStatus;
  providerEventTimestamp?: number | null;
};

export type MetaWebhookTransportResult = {
  ok: true;
  duplicate: boolean;
  event: "messages_status" | "unsupported" | "ignored_unknown_sender";
  wabaId?: string;
  phoneNumberId?: string;
  wamid?: string;
  status?: MetaWebhookLifecycleStatus;
};

export interface MetaWebhookPersistenceAdapter {
  insertEvent: (row: Record<string, unknown>) => Promise<{ inserted: boolean; record: Record<string, unknown> | null }>;
}

let metaWebhookPersistenceAdapter: MetaWebhookPersistenceAdapter | null = null;

export function setMetaWebhookPersistenceAdapter(adapter: MetaWebhookPersistenceAdapter | null): void {
  metaWebhookPersistenceAdapter = adapter;
}

function createSupabasePersistenceAdapter(): MetaWebhookPersistenceAdapter | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async insertEvent(row) {
      const { data, error } = await supabase
        .from("meta_webhook_events")
        .upsert(row, {
          onConflict: "provider,waba_id,phone_number_id,wamid,lifecycle_status,provider_event_timestamp",
          ignoreDuplicates: true,
        })
        .select()
        .maybeSingle();

      if (error) {
        throw new Error("Webhook event persistence failed");
      }

      return {
        inserted: Boolean(data),
        record: data as Record<string, unknown> | null,
      };
    },
  };
}

const META_SUPPORTED_MESSAGE_STATUSES = new Set<MetaWebhookLifecycleStatus>([
  "sent",
  "delivered",
  "read",
  "failed",
]);

const META_STATUS_ORDER: Record<MetaWebhookLifecycleStatus, number> = {
  sent: 0,
  delivered: 1,
  read: 2,
  failed: 3,
};

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

function parseCommaSeparatedEnv(name: string): Set<string> {
  const rawValue = Deno.env.get(name);
  if (!rawValue) {
    return new Set();
  }

  return new Set(
    rawValue
      .split(",")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0),
  );
}

export function isKnownMetaWaba(wabaId: string | null | undefined): boolean {
  if (typeof wabaId !== "string" || wabaId.trim().length === 0) {
    return false;
  }

  const configured = parseCommaSeparatedEnv("META_KNOWN_WABA_IDS");
  if (configured.size === 0) {
    return false;
  }

  return configured.has(wabaId.trim());
}

export function isKnownMetaPhoneNumberId(phoneNumberId: string | null | undefined): boolean {
  if (typeof phoneNumberId !== "string" || phoneNumberId.trim().length === 0) {
    return false;
  }

  const configured = parseCommaSeparatedEnv("META_KNOWN_PHONE_NUMBER_IDS");
  if (configured.size === 0) {
    return false;
  }

  return configured.has(phoneNumberId.trim());
}

export function isValidLifecycleTransition(previous: string, next: string): boolean {
  const validPrevious = previous as MetaWebhookLifecycleStatus;
  const validNext = next as MetaWebhookLifecycleStatus;

  if (!META_SUPPORTED_MESSAGE_STATUSES.has(validPrevious) || !META_SUPPORTED_MESSAGE_STATUSES.has(validNext)) {
    return false;
  }

  if (validPrevious === validNext) {
    return false;
  }

  if (validNext === "failed") {
    return validPrevious !== "failed";
  }

  if (validPrevious === "failed") {
    return false;
  }

  if (validPrevious === "sent") {
    return validNext === "delivered";
  }

  if (validPrevious === "delivered") {
    return validNext === "read";
  }

  return false;
}

function sha256Hex(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const words: number[] = [];
  const bitLength = bytes.length * 8;

  for (let index = 0; index < bytes.length; index += 1) {
    words[index >> 2] |= bytes[index] << (24 - (index % 4) * 8);
  }

  words[words.length >> 2] |= 0x80 << (24 - (words.length % 4) * 8);
  while ((words.length * 4) % 64 !== 56) {
    words[words.length >> 2] |= 0 << (24 - (words.length % 4) * 8);
    words.push(0);
  }
  words.push(bitLength >>> 0);
  words.push((bitLength / 0x100000000) >>> 0);

  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const schedule = new Array<number>(64).fill(0);
  let a = 0x6a09e667;
  let b = 0xbb67ae85;
  let c = 0x3c6ef372;
  let d = 0xa54ff53a;
  let e = 0x510e527f;
  let f = 0x9b05688c;
  let g = 0x1f83d9ab;
  let h = 0x5be0cd19;

  for (let chunkIndex = 0; chunkIndex < words.length; chunkIndex += 16) {
    for (let offset = 0; offset < 16; offset += 1) {
      schedule[offset] = words[chunkIndex + offset];
    }
    for (let offset = 16; offset < 64; offset += 1) {
      const s0 = ((schedule[offset - 15] >>> 7) | (schedule[offset - 15] << 25)) ^ ((schedule[offset - 15] >>> 18) | (schedule[offset - 15] << 14)) ^ (schedule[offset - 15] >>> 3);
      const s1 = ((schedule[offset - 2] >>> 17) | (schedule[offset - 2] << 15)) ^ ((schedule[offset - 2] >>> 19) | (schedule[offset - 2] << 13)) ^ (schedule[offset - 2] >>> 10);
      schedule[offset] = (schedule[offset - 16] + s0 + schedule[offset - 7] + s1) >>> 0;
    }

    let currentA = a;
    let currentB = b;
    let currentC = c;
    let currentD = d;
    let currentE = e;
    let currentF = f;
    let currentG = g;
    let currentH = h;

    for (let offset = 0; offset < 64; offset += 1) {
      const s1 = ((currentE >>> 6) | (currentE << 26)) ^ ((currentE >>> 11) | (currentE << 21)) ^ ((currentE >>> 25) | (currentE << 7));
      const ch = (currentE & currentF) ^ (~currentE & currentG);
      const temp1 = (currentH + s1 + ch + constants[offset] + schedule[offset]) >>> 0;
      const s0 = ((currentA >>> 2) | (currentA << 30)) ^ ((currentA >>> 13) | (currentA << 19)) ^ ((currentA >>> 22) | (currentA << 10));
      const maj = (currentA & currentB) ^ (currentA & currentC) ^ (currentB & currentC);
      const temp2 = (s0 + maj) >>> 0;

      currentH = currentG;
      currentG = currentF;
      currentF = currentE;
      currentE = (currentD + temp1) >>> 0;
      currentD = currentC;
      currentC = currentB;
      currentB = currentA;
      currentA = (temp1 + temp2) >>> 0;
    }

    a = (a + currentA) >>> 0;
    b = (b + currentB) >>> 0;
    c = (c + currentC) >>> 0;
    d = (d + currentD) >>> 0;
    e = (e + currentE) >>> 0;
    f = (f + currentF) >>> 0;
    g = (g + currentG) >>> 0;
    h = (h + currentH) >>> 0;
  }

  const digest = [a, b, c, d, e, f, g, h].map((word) => word >>> 0).map((word) => word.toString(16).padStart(8, "0")).join("");
  return digest;
}

export function computeMetaWebhookPayloadHash(rawBody: string): string {
  return sha256Hex(rawBody);
}

export function computeMetaWebhookEventKey(event: MetaWebhookEventIdentity): string {
  const canonical = [
    event.provider,
    event.wabaId,
    event.phoneNumberId,
    event.wamid,
    event.status,
    String(event.providerEventTimestamp ?? "n/a"),
  ].join(":");

  return sha256Hex(canonical);
}

function constantTimeEquals(expected: string, actual: string): boolean {
  const expectedBytes = new TextEncoder().encode(expected);
  const actualBytes = new TextEncoder().encode(actual);
  if (expectedBytes.length !== actualBytes.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < expectedBytes.length; index += 1) {
    result |= expectedBytes[index] ^ actualBytes[index];
  }
  return result === 0;
}

async function computeHmacSha256(rawBody: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeMetaStatus(status: unknown): MetaWebhookLifecycleStatus | null {
  if (status === "sent" || status === "delivered" || status === "read" || status === "failed") {
    return status;
  }
  return null;
}

function normalizeEventIdentity(value: unknown): MetaWebhookEventIdentity | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const wabaId = typeof candidate.wabaId === "string" ? candidate.wabaId : typeof candidate.waba_id === "string" ? candidate.waba_id : null;
  const phoneNumberId = typeof candidate.phoneNumberId === "string" ? candidate.phoneNumberId : typeof candidate.phone_number_id === "string" ? candidate.phone_number_id : null;
  const wamid = typeof candidate.wamid === "string" ? candidate.wamid : null;
  const status = normalizeMetaStatus(candidate.status);
  const ts = typeof candidate.providerEventTimestamp === "number" ? candidate.providerEventTimestamp : typeof candidate.timestamp === "number" ? candidate.timestamp : null;

  if (!wabaId || !phoneNumberId || !wamid || !status) {
    return null;
  }

  return {
    provider: "meta",
    wabaId,
    phoneNumberId,
    wamid,
    status,
    providerEventTimestamp: ts ?? null,
  };
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function persistMetaWebhookEvent(
  event: MetaWebhookEventIdentity,
  rawBody: string,
  adapter: MetaWebhookPersistenceAdapter,
): Promise<{ duplicate: boolean; record: Record<string, unknown> | null }> {

  const eventKey = computeMetaWebhookEventKey(event);
  const row = {
    event_key: eventKey,
    provider: "meta",
    waba_id: event.wabaId,
    phone_number_id: event.phoneNumberId,
    wamid: event.wamid,
    lifecycle_status: event.status,
    provider_event_timestamp: event.providerEventTimestamp ?? null,
    received_at: new Date().toISOString(),
    payload_hash: computeMetaWebhookPayloadHash(rawBody),
  };

  const result = await adapter.insertEvent(row);
  return {
    duplicate: !result.inserted,
    record: result.record,
  };
}

function parseMetaStatusEntry(entry: Record<string, unknown>): MetaWebhookTransportResult | null {
  const value = entry.value;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const metaValue = value as Record<string, unknown>;
  const metadata = metaValue.metadata && typeof metaValue.metadata === "object" ? metaValue.metadata as Record<string, unknown> : null;
  const statuses = Array.isArray(metaValue.statuses) ? metaValue.statuses : [];
  const wabaId = typeof entry.id === "string" ? entry.id : null;
  const phoneNumberId = metadata ? asString(metadata.phone_number_id) : null;
  const messagingProduct = metadata ? asString(metadata.messaging_product) : null;
  const displayPhoneNumber = metadata ? asString(metadata.display_phone_number) : null;

  if (!wabaId) {
    return null;
  }

  if (metadata && (messagingProduct || displayPhoneNumber || phoneNumberId)) {
    // Metadata is extracted without persisting or exposing raw payload values beyond safe fields.
  }

  if (statuses.length === 0) {
    return {
      ok: true,
      duplicate: false,
      event: "unsupported",
    };
  }

  const candidate = statuses[0] as Record<string, unknown> | undefined;
  if (!candidate || typeof candidate !== "object") {
    return {
      ok: true,
      duplicate: false,
      event: "unsupported",
    };
  }

  const wamid = asString(candidate.id);
  const providerStatus = normalizeMetaStatus(candidate.status);
  const eventTimestamp = typeof candidate.timestamp === "number" ? candidate.timestamp : null;

  if (!wamid || !providerStatus || !phoneNumberId) {
    return {
      ok: true,
      duplicate: false,
      event: "unsupported",
    };
  }

  const event = normalizeEventIdentity({
    provider: "meta",
    wabaId,
    phoneNumberId,
    wamid,
    status: providerStatus,
    providerEventTimestamp: eventTimestamp,
  });

  if (!event) {
    return {
      ok: true,
      duplicate: false,
      event: "unsupported",
    };
  }

  return {
    ok: true,
    duplicate: false,
    event: "messages_status",
    wabaId: event.wabaId,
    phoneNumberId: event.phoneNumberId,
    wamid: event.wamid,
    status: event.status,
  };
}

export const handler = async (req: Request): Promise<Response> => {
  const startedAt = Date.now();

  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const verifyToken = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const configuredToken = Deno.env.get("META_WEBHOOK_VERIFY_TOKEN");

    if (mode !== "subscribe") {
      return textResponse("Invalid mode", 403);
    }

    if (!configuredToken || !verifyToken || !constantTimeEquals(configuredToken, verifyToken)) {
      return textResponse("Forbidden", 403);
    }

    if (!challenge || challenge.trim().length === 0) {
      return textResponse("Missing challenge", 400);
    }

    return textResponse(challenge, 200);
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const rawBody = await req.text();
  console.info("meta_webhook_received", {
    correlation_id: crypto.randomUUID(),
    payload_bytes: rawBody.length,
  });
  const providedSignature = req.headers.get("X-Hub-Signature-256");
  const appSecret = Deno.env.get("META_APP_SECRET");

  if (!providedSignature || !providedSignature.startsWith("sha256=")) {
    return jsonResponse({ ok: false, error: "Invalid signature" }, 403);
  }

  if (!appSecret) {
    return jsonResponse({ ok: false, error: "Invalid signature" }, 403);
  }

  const expectedSignature = `sha256=${await computeHmacSha256(rawBody, appSecret)}`;
  if (!constantTimeEquals(expectedSignature, providedSignature)) {
    return jsonResponse({ ok: false, error: "Invalid signature" }, 403);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ ok: false, error: "Malformed JSON" }, 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return jsonResponse({ ok: false, error: "Invalid payload" }, 400);
  }

  const body = payload as Record<string, unknown>;
  if (body.object !== "whatsapp_business_account" || !Array.isArray(body.entry)) {
    return jsonResponse({ ok: false, error: "Invalid payload" }, 400);
  }

  const persistenceAdapter = metaWebhookPersistenceAdapter ?? createSupabasePersistenceAdapter();
  if (!persistenceAdapter) {
    return jsonResponse({ ok: false, error: "Webhook persistence is not configured" }, 503);
  }
  let accepted: MetaWebhookTransportResult = {
    ok: true,
    duplicate: false,
    event: "unsupported",
  };
  let ignoredUnknownSender = false;
  let ignoredWabaId: string | null = null;
  let ignoredPhoneNumberId: string | null = null;

  for (const entry of body.entry) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }

    const entryRecord = entry as Record<string, unknown>;
    const changes = Array.isArray(entryRecord.changes) ? entryRecord.changes : [];
    for (const change of changes) {
      if (!change || typeof change !== "object" || Array.isArray(change)) {
        continue;
      }

      const changeRecord = change as Record<string, unknown>;
      if (changeRecord.field !== "messages") {
        continue;
      }

      const value = changeRecord.value;
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        continue;
      }

      const metadata = (value as Record<string, unknown>).metadata;
      const wabaId = asString(entryRecord.id);
      const phoneNumberId = metadata && typeof metadata === "object" ? asString((metadata as Record<string, unknown>).phone_number_id) : null;

      if (!wabaId || !phoneNumberId || !isKnownMetaWaba(wabaId) || !isKnownMetaPhoneNumberId(phoneNumberId)) {
        ignoredUnknownSender = true;
        ignoredWabaId = wabaId ?? ignoredWabaId;
        ignoredPhoneNumberId = phoneNumberId ?? ignoredPhoneNumberId;
        console.info("meta_webhook_unknown_sender", {
          correlation_id: crypto.randomUUID(),
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          ignored: true,
        });
        continue;
      }

      const statuses = Array.isArray((value as Record<string, unknown>).statuses)
        ? ((value as Record<string, unknown>).statuses as Array<Record<string, unknown>>)
        : [];
      const firstStatus = statuses[0];
      const event = normalizeEventIdentity({
        provider: "meta",
        wabaId: wabaId,
        phoneNumberId: phoneNumberId,
        wamid: asString(firstStatus?.id ?? null),
        status: normalizeMetaStatus(firstStatus?.status ?? null),
        providerEventTimestamp: typeof firstStatus?.timestamp === "number" ? firstStatus.timestamp as number : null,
      });

      if (!event) {
        continue;
      }

      let persistenceResult: { duplicate: boolean; record: Record<string, unknown> | null };
      try {
        persistenceResult = await persistMetaWebhookEvent(event, rawBody, persistenceAdapter);
      } catch {
        console.error("meta_webhook_persistence_failed", {
          correlation_id: crypto.randomUUID(),
          provider: event.provider,
          waba_id: event.wabaId,
          phone_number_id: event.phoneNumberId,
          wamid: event.wamid,
          status: event.status,
        });
        return jsonResponse({ ok: false, error: "Webhook persistence failed" }, 503);
      }

      if (persistenceResult.duplicate) {
        console.info("meta_webhook_duplicate", {
          correlation_id: crypto.randomUUID(),
          provider: event.provider,
          waba_id: event.wabaId,
          phone_number_id: event.phoneNumberId,
          wamid: event.wamid,
          status: event.status,
          duplicate: true,
        });
        accepted = {
          ok: true,
          duplicate: true,
          event: "messages_status",
          wabaId: event.wabaId,
          phoneNumberId: event.phoneNumberId,
          wamid: event.wamid,
          status: event.status,
        };
        continue;
      }

      const parsed = parseMetaStatusEntry({
        id: entryRecord.id,
        value,
      } as Record<string, unknown>);

      if (parsed) {
        accepted = parsed;
      }
    }
  }

  const processingDurationMs = Date.now() - startedAt;
  console.info("meta_webhook_processed", {
    correlation_id: crypto.randomUUID(),
    event_field: accepted.event,
    waba_id: accepted.wabaId,
    phone_number_id: accepted.phoneNumberId,
    wamid: accepted.wamid,
    status: accepted.status,
    duplicate: accepted.duplicate,
    processing_duration_ms: processingDurationMs,
  });

  if (accepted.event !== "unsupported") {
    return jsonResponse({ ok: true, duplicate: accepted.duplicate, event: accepted.event, wabaId: accepted.wabaId, phoneNumberId: accepted.phoneNumberId, wamid: accepted.wamid, status: accepted.status }, 200);
  }

  if (ignoredUnknownSender) {
    return jsonResponse({ ok: true, event: "ignored_unknown_sender" }, 200);
  }

  return jsonResponse({ ok: true, duplicate: false, event: "unsupported" }, 200);
};

if (import.meta.main) {
  Deno.serve((req: Request) => handler(req));
}
