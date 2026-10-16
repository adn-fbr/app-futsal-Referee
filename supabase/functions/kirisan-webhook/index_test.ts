import { assertEquals, assert } from "jsr:@std/assert";
import {
  handler,
  setKirisanPersistenceAdapter,
  validateKirisanSendStatus,
  type KirisanPersistenceAdapter,
} from "./index.ts";



const TEST_SECRET = "super-secret";

function createValidPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    channels: {
      email: {
        id: 98765,
        processing_time: "891ms",
        status: true,
      },
    },
    event: "send_status",
    id: 98765,
    production: false,
    request_id: 12345,
    status: "sent",
    timestamp: 1789882005,
    ...overrides,
  };
}

function validate(
  payload: Record<string, unknown>,
  overrides: Partial<{
    eventHeader: string | null;
    webhookSecret: string | null;
    allowProduction: boolean;
  }> = {},
) {
  Deno.env.set("KIRISAN_WEBHOOK_SECRET", TEST_SECRET);

  return validateKirisanSendStatus(payload, {
    eventHeader: "send_status",
    webhookSecret: TEST_SECRET,
    allowProduction: false,
    ...overrides,
  });
}

type FakePersistence = {
  adapter: KirisanPersistenceAdapter;
  ledgerRows: Record<string, unknown>[];
  auditRows: Record<string, unknown>[];
};

function createFakePersistence(options: {
  ledgerError?: { code?: string; message?: string };
  duplicate?: boolean;
  auditError?: { code?: string; message?: string };
  ledgerId?: string;
} = {}): FakePersistence {
  const ledgerRows: Record<string, unknown>[] = [];
  const auditRows: Record<string, unknown>[] = [];
  const ledgerId = options.ledgerId ?? "11111111-1111-4111-8111-111111111111";

  return {
    ledgerRows,
    auditRows,
    adapter: {
      insertLedger: async (row) => {
        ledgerRows.push(row);
        if (options.duplicate) {
          return { data: null, error: { code: "23505", message: "duplicate key" } };
        }
        if (options.ledgerError) {
          return { data: null, error: options.ledgerError };
        }
        return { data: { id: ledgerId }, error: null };
      },
      insertAuditLog: async (row) => {
        auditRows.push(row);
        if (options.auditError) {
          return { data: null, error: options.auditError };
        }
        return { data: null, error: null };
      },
    },
  };
}

async function invokeWebhook(
  payload: Record<string, unknown>,
  persistence: KirisanPersistenceAdapter,
  headers: Record<string, string> = {},
  rawBody = JSON.stringify(payload),
): Promise<Response> {
  Deno.env.set("KIRISAN_WEBHOOK_SECRET", TEST_SECRET);
  setKirisanPersistenceAdapter(persistence);

  try {
    return await handler(new Request("http://localhost/kirisan-webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kirisan-Event": "send_status",
        "X-Webhook-Secret": TEST_SECRET,
        ...headers,
      },
      body: rawBody,
    }));
  } finally {
    setKirisanPersistenceAdapter(null);
  }
}

async function responseBody(response: Response): Promise<Record<string, unknown>> {
  return await response.json() as Record<string, unknown>;
}

Deno.test("valid test send_status payload is accepted with normalized metadata", () => {
  const result = validate(createValidPayload());

  assert(result.ok);
  assertEquals(result.provider, "kirisan");
  assertEquals(result.environment, "test");
  assertEquals(result.eventType, "send_status");
  assertEquals(result.normalizedStatus, "sent");
  assertEquals(result.providerRequestId, 12345);
  assertEquals(result.providerSendId, 98765);
  assertEquals(result.providerMessageId, null);
  assertEquals(result.processingTimeMs, 891);
  assertEquals(result.idempotencyKey, "kirisan:test:send_status:12345");
  assertEquals(result.isProduction, false);
});

Deno.test("wrong secret is rejected", () => {
  const result = validate(createValidPayload(), { webhookSecret: "wrong-secret" });

  assertEquals(result.ok, false);
  assertEquals(result.code, "WEBHOOK_SECRET_INVALID");
});

Deno.test("wrong event header is rejected", () => {
  const result = validate(createValidPayload(), { eventHeader: "incoming_message" });

  assertEquals(result.ok, false);
  assertEquals(result.code, "EVENT_HEADER_INVALID");
});

Deno.test("missing configured secret fails closed", () => {
  const previousSecret = Deno.env.get("KIRISAN_WEBHOOK_SECRET");
  Deno.env.delete("KIRISAN_WEBHOOK_SECRET");

  try {
    const result = validateKirisanSendStatus(createValidPayload(), {
      eventHeader: "send_status",
      webhookSecret: TEST_SECRET,
      allowProduction: false,
    });

    assertEquals(result.ok, false);
    assertEquals(result.code, "WEBHOOK_CONFIGURATION_MISSING");
  } finally {
    if (previousSecret === undefined) {
      Deno.env.delete("KIRISAN_WEBHOOK_SECRET");
    } else {
      Deno.env.set("KIRISAN_WEBHOOK_SECRET", previousSecret);
    }
  }
});

Deno.test("missing production field is rejected", () => {
  const payload = createValidPayload();
  delete payload.production;

  const result = validate(payload);

  assertEquals(result.ok, false);
  assertEquals(result.code, "PRODUCTION_FLAG_INVALID");
});

Deno.test("non-boolean production field is rejected", () => {
  const result = validate(createValidPayload({ production: "false" }));

  assertEquals(result.ok, false);
  assertEquals(result.code, "PRODUCTION_FLAG_INVALID");
});

Deno.test("production payload is blocked in test mode", () => {
  const result = validate(createValidPayload({ production: true }));

  assertEquals(result.ok, false);
  assertEquals(result.code, "PRODUCTION_PAYLOAD_BLOCKED");
});

Deno.test("channel id never becomes provider message id", () => {
  const result = validate(createValidPayload());

  assert(result.ok);
  assertEquals(result.providerRequestId, 12345);
  assertEquals(result.providerSendId, 98765);
  assertEquals(result.providerMessageId, null);
});

Deno.test("empty channels are rejected", () => {
  const result = validate(createValidPayload({ channels: {} }));

  assertEquals(result.ok, false);
  assertEquals(result.code, "CHANNELS_INVALID");
});

Deno.test("invalid status is rejected by the strict contract", () => {
  const result = validate(createValidPayload({ status: "delivered" }));

  assertEquals(result.ok, false);
  assertEquals(result.code, "STATUS_INVALID");
});

Deno.test("request_id must remain an integer", () => {
  const result = validate(createValidPayload({ request_id: "12345" }));

  assertEquals(result.ok, false);
  assertEquals(result.code, "REQUEST_ID_INVALID");
});

Deno.test("send id must remain an integer", () => {
  const result = validate(createValidPayload({ id: "98765" }));

  assertEquals(result.ok, false);
  assertEquals(result.code, "SEND_ID_INVALID");
});

Deno.test("timestamp must remain an integer", () => {
  const result = validate(createValidPayload({ timestamp: "1789882005" }));

  assertEquals(result.ok, false);
  assertEquals(result.code, "TIMESTAMP_INVALID");
});

Deno.test("channel status must remain boolean", () => {
  const result = validate(createValidPayload({
    channels: {
      email: {
        id: 98765,
        status: "true",
      },
    },
  }));

  assertEquals(result.ok, false);
  assertEquals(result.code, "CHANNEL_STATUS_INVALID");
});

Deno.test("idempotency key is deterministic for identical request ids", () => {
  const first = validate(createValidPayload({ request_id: 12345 }));
  const second = validate(createValidPayload({ request_id: 12345 }));
  const next = validate(createValidPayload({ request_id: 12346 }));

  assert(first.ok);
  assert(second.ok);
  assert(next.ok);
  assertEquals(first.idempotencyKey, "kirisan:test:send_status:12345");
  assertEquals(second.idempotencyKey, "kirisan:test:send_status:12345");
  assertEquals(next.idempotencyKey, "kirisan:test:send_status:12346");
});

Deno.test("handler persists the ledger and audit row successfully", async () => {
  const persistence = createFakePersistence();
  const response = await invokeWebhook(createValidPayload(), persistence.adapter);
  const body = await responseBody(response);

  assertEquals(response.status, 200);
  assertEquals(body, { success: true, duplicate: false });
  assertEquals(persistence.ledgerRows.length, 1);
  assertEquals(persistence.ledgerRows[0].provider_request_id, 12345);
  assertEquals(persistence.ledgerRows[0].provider_send_id, 98765);
  assertEquals(persistence.ledgerRows[0].provider_message_id, null);
  assertEquals(persistence.ledgerRows[0].provider_status, "sent");
  assertEquals(persistence.ledgerRows[0].normalized_status, "sent");
  assertEquals(persistence.ledgerRows[0].processing_time_ms, 891);
  assertEquals(persistence.ledgerRows[0].idempotency_key, "kirisan:test:send_status:12345");
  assertEquals(persistence.ledgerRows[0].production, false);
  assertEquals(persistence.auditRows.length, 1);
  assertEquals(persistence.auditRows[0].entity_type, "message_delivery_ledger");
  assertEquals(persistence.auditRows[0].entity_id, "11111111-1111-4111-8111-111111111111");
});

Deno.test("missing secret configuration returns 503 without writing", async () => {
  const persistence = createFakePersistence();
  const previousSecret = Deno.env.get("KIRISAN_WEBHOOK_SECRET");
  Deno.env.delete("KIRISAN_WEBHOOK_SECRET");
  setKirisanPersistenceAdapter(persistence.adapter);

  try {
    const response = await handler(new Request("http://localhost/kirisan-webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kirisan-Event": "send_status",
        "X-Webhook-Secret": TEST_SECRET,
      },
      body: JSON.stringify(createValidPayload()),
    }));

    assertEquals(response.status, 503);
    assertEquals(persistence.ledgerRows.length, 0);
    assertEquals(persistence.auditRows.length, 0);
  } finally {
    setKirisanPersistenceAdapter(null);
    if (previousSecret === undefined) {
      Deno.env.delete("KIRISAN_WEBHOOK_SECRET");
    } else {
      Deno.env.set("KIRISAN_WEBHOOK_SECRET", previousSecret);
    }
  }
});

Deno.test("missing or wrong webhook secret returns 403 without writing", async () => {
  const missingSecretPersistence = createFakePersistence();
  const missingSecretResponse = await invokeWebhook(
    createValidPayload(),
    missingSecretPersistence.adapter,
    { "X-Webhook-Secret": "" },
  );
  assertEquals(missingSecretResponse.status, 403);
  assertEquals(missingSecretPersistence.ledgerRows.length, 0);

  const wrongSecretPersistence = createFakePersistence();
  const wrongSecretResponse = await invokeWebhook(
    createValidPayload(),
    wrongSecretPersistence.adapter,
    { "X-Webhook-Secret": "wrong-secret" },
  );
  assertEquals(wrongSecretResponse.status, 403);
  assertEquals(wrongSecretPersistence.ledgerRows.length, 0);
});

Deno.test("body event mismatch returns 400 without writing", async () => {
  const persistence = createFakePersistence();
  const response = await invokeWebhook(
    createValidPayload({ event: "incoming_message" }),
    persistence.adapter,
  );

  assertEquals(response.status, 400);
  assertEquals(persistence.ledgerRows.length, 0);
  assertEquals(persistence.auditRows.length, 0);
});

Deno.test("unknown provider status is preserved and normalized to unknown", async () => {
  const persistence = createFakePersistence();
  const response = await invokeWebhook(
    createValidPayload({ status: "unknown" }),
    persistence.adapter,
  );

  assertEquals(response.status, 200);
  assertEquals(persistence.ledgerRows[0].provider_status, "unknown");
  assertEquals(persistence.ledgerRows[0].normalized_status, "unknown");
});

Deno.test("duplicate ledger request returns idempotent success without audit insert", async () => {
  const persistence = createFakePersistence({ duplicate: true });
  const response = await invokeWebhook(createValidPayload(), persistence.adapter);
  const body = await responseBody(response);

  assertEquals(response.status, 200);
  assertEquals(body, { success: true, duplicate: true });
  assertEquals(persistence.ledgerRows.length, 1);
  assertEquals(persistence.auditRows.length, 0);
});

Deno.test("ledger database error returns 500 and does not write audit", async () => {
  const persistence = createFakePersistence({ ledgerError: { code: "42P01" } });
  const response = await invokeWebhook(createValidPayload(), persistence.adapter);

  assertEquals(response.status, 500);
  assertEquals(persistence.ledgerRows.length, 1);
  assertEquals(persistence.auditRows.length, 0);
});

Deno.test("audit database error returns 500 without deleting the ledger", async () => {
  const persistence = createFakePersistence({ auditError: { code: "42501" } });
  const response = await invokeWebhook(createValidPayload(), persistence.adapter);

  assertEquals(response.status, 500);
  assertEquals(persistence.ledgerRows.length, 1);
  assertEquals(persistence.auditRows.length, 1);
});

Deno.test("payload hash uses the raw request body and no raw payload is stored", async () => {
  const persistence = createFakePersistence();
  const payload = createValidPayload({ request_id: 12347 });
  const rawBody = JSON.stringify(payload, null, 2);
  const expectedDigest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rawBody),
  );
  const expectedHash = Array.from(new Uint8Array(expectedDigest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const response = await invokeWebhook(payload, persistence.adapter, {}, rawBody);
  assertEquals(response.status, 200);
  assertEquals(persistence.ledgerRows[0].payload_hash, expectedHash);
  assertEquals("raw_payload" in persistence.ledgerRows[0], false);
  assertEquals(JSON.stringify(persistence.ledgerRows).includes(rawBody), false);
});

Deno.test("ledger and audit persistence do not contain the webhook secret", async () => {
  const persistence = createFakePersistence();
  const response = await invokeWebhook(createValidPayload(), persistence.adapter);

  assertEquals(response.status, 200);
  assertEquals(JSON.stringify(persistence.ledgerRows).includes(TEST_SECRET), false);
  assertEquals(JSON.stringify(persistence.auditRows).includes(TEST_SECRET), false);
});
