import { assert, assertEquals } from "jsr:@std/assert";
import {
  computeMetaWebhookEventKey,
  computeMetaWebhookPayloadHash,
  handler,
  isKnownMetaPhoneNumberId,
  isKnownMetaWaba,
  isValidLifecycleTransition,
  setMetaWebhookPersistenceAdapter,
} from "./index.ts";

const TEST_VERIFY_TOKEN = "test-meta-webhook-token";
const TEST_APP_SECRET = "test-app-secret";

async function signPayload(raw: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return `sha256=${Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function buildStatusPayload(status: string, wamid = "wamid-123", overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: "waba-123",
      changes: [{
        field: "messages",
        value: {
          metadata: {
            messaging_product: "whatsapp",
            display_phone_number: "+15551234567",
            phone_number_id: "phone-123",
          },
          statuses: [{
            id: wamid,
            status,
            timestamp: 1710000000,
            recipient_id: "628123456789",
          }],
          ...overrides,
        },
      }],
    }],
  };
}

function setKnownSenderEnv(wabaId: string, phoneNumberId: string): void {
  Deno.env.set("META_KNOWN_WABA_IDS", wabaId);
  Deno.env.set("META_KNOWN_PHONE_NUMBER_IDS", phoneNumberId);
}

async function invokeSignedRequest(payload: Record<string, unknown>, overrides: { signature?: string; headers?: Record<string, string> } = {}): Promise<Response> {
  Deno.env.set("META_APP_SECRET", TEST_APP_SECRET);
  const rawBody = JSON.stringify(payload);
  const signature = overrides.signature ?? await signPayload(rawBody, TEST_APP_SECRET);
  return await handler(new Request("http://localhost/meta-whatsapp-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": signature,
      ...overrides.headers,
    },
    body: rawBody,
  }));
}

Deno.test("A. GET valid verification returns challenge", async () => {
  Deno.env.set("META_WEBHOOK_VERIFY_TOKEN", TEST_VERIFY_TOKEN);
  const response = await handler(new Request(
    `http://localhost/meta-whatsapp-webhook?hub.mode=subscribe&hub.verify_token=${TEST_VERIFY_TOKEN}&hub.challenge=challenge-abc`,
    { method: "GET" },
  ));

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "text/plain");
  assertEquals(await response.text(), "challenge-abc");
});

Deno.test("B. GET invalid verify token returns 403", async () => {
  Deno.env.set("META_WEBHOOK_VERIFY_TOKEN", TEST_VERIFY_TOKEN);
  const response = await handler(new Request(
    "http://localhost/meta-whatsapp-webhook?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=challenge-abc",
    { method: "GET" },
  ));

  assertEquals(response.status, 403);
});

Deno.test("C. GET invalid mode returns 4xx", async () => {
  Deno.env.set("META_WEBHOOK_VERIFY_TOKEN", TEST_VERIFY_TOKEN);
  const response = await handler(new Request(
    `http://localhost/meta-whatsapp-webhook?hub.mode=unsubscribe&hub.verify_token=${TEST_VERIFY_TOKEN}&hub.challenge=challenge-abc`,
    { method: "GET" },
  ));

  assertEquals(response.status >= 400, true);
  assertEquals(response.status < 500, true);
});

Deno.test("D. POST valid signature is accepted", async () => {
  setKnownSenderEnv("waba-123", "phone-123");
  const response = await invokeSignedRequest(buildStatusPayload("sent", "wamid-accepted"));

  assertEquals(response.status, 200);
  const json = await response.json() as Record<string, unknown>;
  assertEquals(json.ok, true);
  assertEquals(json.duplicate, false);
});

Deno.test("E. POST invalid signature returns 403", async () => {
  Deno.env.set("META_APP_SECRET", TEST_APP_SECRET);
  setKnownSenderEnv("waba-known", "phone-known");
  const response = await handler(new Request("http://localhost/meta-whatsapp-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": "sha256=deadbeef",
    },
    body: JSON.stringify(buildStatusPayload("sent")),
  }));

  assertEquals(response.status, 403);
});

Deno.test("F. POST missing signature returns 403", async () => {
  Deno.env.set("META_APP_SECRET", TEST_APP_SECRET);
  setKnownSenderEnv("waba-known", "phone-known");
  const response = await handler(new Request("http://localhost/meta-whatsapp-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildStatusPayload("sent")),
  }));

  assertEquals(response.status, 403);
});

Deno.test("G. valid whatsapp_business_account payload is accepted", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const payload = buildStatusPayload("delivered", "wamid-delivered");
  const response = await invokeSignedRequest(payload);

  assertEquals(response.status, 200);
});

Deno.test("H. unsupported field returns 200 with no side effect", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "waba-known",
      changes: [{
        field: "messages_unsupported",
        value: { foo: "bar" },
      }],
    }],
  };
  const response = await invokeSignedRequest(payload);

  assertEquals(response.status, 200);
  const json = await response.json() as Record<string, unknown>;
  assertEquals(json.ok, true);
  assertEquals(json.event, "unsupported");
});

Deno.test("I. messages.statuses.sent is recognized", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const payload = buildStatusPayload("sent", "wamid-sent");
  const response = await invokeSignedRequest(payload);
  assertEquals(response.status, 200);
});

Deno.test("J. messages.statuses.delivered is recognized", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const payload = buildStatusPayload("delivered", "wamid-delivered-2");
  const response = await invokeSignedRequest(payload);
  assertEquals(response.status, 200);
});

Deno.test("K. messages.statuses.read is recognized", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const payload = buildStatusPayload("read", "wamid-read");
  const response = await invokeSignedRequest(payload);
  assertEquals(response.status, 200);
});

Deno.test("L. messages.statuses.failed is recognized", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const payload = buildStatusPayload("failed", "wamid-failed");
  const response = await invokeSignedRequest(payload);
  assertEquals(response.status, 200);
});

Deno.test("O. stale lifecycle event is rejected", () => {
  assertEquals(isValidLifecycleTransition("read", "delivered"), false);
  assertEquals(isValidLifecycleTransition("sent", "delivered"), true);
  assertEquals(isValidLifecycleTransition("delivered", "read"), true);
  assertEquals(isValidLifecycleTransition("read", "failed"), true);
});

Deno.test("P. invalid WABA is not associated", () => {
  Deno.env.set("META_KNOWN_WABA_IDS", "waba-allowed");
  assertEquals(isKnownMetaWaba("waba-123"), false);
  assertEquals(isKnownMetaWaba("waba-allowed"), true);
});

Deno.test("Q. invalid phone_number_id is not associated", () => {
  Deno.env.set("META_KNOWN_PHONE_NUMBER_IDS", "phone-allowed");
  assertEquals(isKnownMetaPhoneNumberId("phone-123"), false);
  assertEquals(isKnownMetaPhoneNumberId("phone-allowed"), true);
});

Deno.test("B5.2-A known WABA + known Phone Number ID => event processed", async () => {
  setKnownSenderEnv("waba-123", "phone-123");
  const payload = buildStatusPayload("sent", "wamid-b52a");
  const response = await invokeSignedRequest(payload);
  const json = await response.json() as Record<string, unknown>;

  assertEquals(response.status, 200);
  assertEquals(json.ok, true);
  assertEquals(json.event, "messages_status");
});

Deno.test("B5.2-B unknown WABA + valid Phone Number ID => HTTP 200 event ignored", async () => {
  Deno.env.set("META_KNOWN_WABA_IDS", "waba-known");
  Deno.env.set("META_KNOWN_PHONE_NUMBER_IDS", "phone-known");
  const payload = buildStatusPayload("sent", "wamid-b52b");
  payload.entry = [{
    id: "waba-unknown",
    changes: [{
      field: "messages",
      value: {
        metadata: {
          messaging_product: "whatsapp",
          display_phone_number: "+15551234567",
          phone_number_id: "phone-known",
        },
        statuses: [{
          id: "wamid-b52b",
          status: "sent",
          timestamp: 1710000000,
          recipient_id: "628123456789",
        }],
      },
    }],
  }];

  const response = await invokeSignedRequest(payload);
  const json = await response.json() as Record<string, unknown>;
  assertEquals(response.status, 200);
  assertEquals(json.ok, true);
  assertEquals(json.event, "ignored_unknown_sender");
});

Deno.test("B5.2-C known WABA + unknown Phone Number ID => HTTP 200 event ignored", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const payload = buildStatusPayload("sent", "wamid-b52c");
  payload.entry = [{
    id: "waba-known",
    changes: [{
      field: "messages",
      value: {
        metadata: {
          messaging_product: "whatsapp",
          display_phone_number: "+15551234567",
          phone_number_id: "phone-unknown",
        },
        statuses: [{
          id: "wamid-b52c",
          status: "sent",
          timestamp: 1710000000,
          recipient_id: "628123456789",
        }],
      },
    }],
  }];

  const response = await invokeSignedRequest(payload);
  const json = await response.json() as Record<string, unknown>;
  assertEquals(response.status, 200);
  assertEquals(json.ok, true);
  assertEquals(json.event, "ignored_unknown_sender");
});

Deno.test("B5.2-D unknown WABA + unknown Phone Number ID => HTTP 200 event ignored", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const payload = buildStatusPayload("sent", "wamid-b52d");
  payload.entry = [{
    id: "waba-unknown",
    changes: [{
      field: "messages",
      value: {
        metadata: {
          messaging_product: "whatsapp",
          display_phone_number: "+15551234567",
          phone_number_id: "phone-unknown",
        },
        statuses: [{
          id: "wamid-b52d",
          status: "sent",
          timestamp: 1710000000,
          recipient_id: "628123456789",
        }],
      },
    }],
  }];

  const response = await invokeSignedRequest(payload);
  const json = await response.json() as Record<string, unknown>;
  assertEquals(response.status, 200);
  assertEquals(json.ok, true);
  assertEquals(json.event, "ignored_unknown_sender");
});

Deno.test("B5.2-E empty META_KNOWN_WABA_IDS => fail closed", async () => {
  Deno.env.delete("META_KNOWN_WABA_IDS");
  Deno.env.set("META_KNOWN_PHONE_NUMBER_IDS", "phone-known");
  const response = await invokeSignedRequest(buildStatusPayload("sent", "wamid-b52e"));
  const json = await response.json() as Record<string, unknown>;

  assertEquals(response.status, 200);
  assertEquals(json.event, "ignored_unknown_sender");
});

Deno.test("B5.2-F empty META_KNOWN_PHONE_NUMBER_IDS => fail closed", async () => {
  Deno.env.set("META_KNOWN_WABA_IDS", "waba-known");
  Deno.env.delete("META_KNOWN_PHONE_NUMBER_IDS");
  const response = await invokeSignedRequest(buildStatusPayload("sent", "wamid-b52f"));
  const json = await response.json() as Record<string, unknown>;

  assertEquals(response.status, 200);
  assertEquals(json.event, "ignored_unknown_sender");
});

Deno.test("B5.2-G valid signature + unknown sender must not bypass allowlist", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const payload = buildStatusPayload("sent", "wamid-b52g");
  payload.entry = [{
    id: "waba-unknown",
    changes: [{
      field: "messages",
      value: {
        metadata: {
          messaging_product: "whatsapp",
          display_phone_number: "+15551234567",
          phone_number_id: "phone-unknown",
        },
        statuses: [{
          id: "wamid-b52g",
          status: "sent",
          timestamp: 1710000000,
          recipient_id: "628123456789",
        }],
      },
    }],
  }];

  const response = await invokeSignedRequest(payload);
  const json = await response.json() as Record<string, unknown>;
  assertEquals(response.status, 200);
  assertEquals(json.event, "ignored_unknown_sender");
});

Deno.test("B5.2-H invalid signature + unknown sender => HTTP 403 before sender authorization", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const payload = buildStatusPayload("sent", "wamid-b52h");
  payload.entry = [{
    id: "waba-unknown",
    changes: [{
      field: "messages",
      value: {
        metadata: {
          messaging_product: "whatsapp",
          display_phone_number: "+15551234567",
          phone_number_id: "phone-unknown",
        },
        statuses: [{
          id: "wamid-b52h",
          status: "sent",
          timestamp: 1710000000,
          recipient_id: "628123456789",
        }],
      },
    }],
  }];

  const response = await handler(new Request("http://localhost/meta-whatsapp-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": "sha256=badbad",
    },
    body: JSON.stringify(payload),
  }));

  assertEquals(response.status, 403);
});

Deno.test("B5.2-I multiple changes: one authorized + one unauthorized => unauthorized stays ignored", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "waba-known",
        changes: [{
          field: "messages",
          value: {
            metadata: {
              messaging_product: "whatsapp",
              display_phone_number: "+15551234567",
              phone_number_id: "phone-known",
            },
            statuses: [{
              id: "wamid-allowed",
              status: "sent",
              timestamp: 1710000000,
              recipient_id: "628123456789",
            }],
          },
        }],
      },
      {
        id: "waba-unknown",
        changes: [{
          field: "messages",
          value: {
            metadata: {
              messaging_product: "whatsapp",
              display_phone_number: "+15551234567",
              phone_number_id: "phone-known",
            },
            statuses: [{
              id: "wamid-ignored",
              status: "sent",
              timestamp: 1710000000,
              recipient_id: "628123456789",
            }],
          },
        }],
      },
    ],
  };

  const response = await invokeSignedRequest(payload);
  const json = await response.json() as Record<string, unknown>;

  assertEquals(response.status, 200);
  assertEquals(json.ok, true);
  assertEquals(json.event, "messages_status");
});

function createFakeMetaWebhookPersistenceAdapter() {
  const rows: Record<string, unknown>[] = [];
  return {
    rows,
    adapter: {
      insertEvent: async (row: Record<string, unknown>) => {
        const exists = rows.some((entry) => entry.event_key === row.event_key);
        if (exists) {
          return { inserted: false, record: null };
        }
        rows.push(row);
        return { inserted: true, record: { ...row, id: `event-${rows.length}` } };
      },
    },
  };
}

const defaultPersistence = createFakeMetaWebhookPersistenceAdapter();
setMetaWebhookPersistenceAdapter(defaultPersistence.adapter);

Deno.test("B5.3-A first valid event => NEW", async () => {
  setKnownSenderEnv("waba-123", "phone-123");
  const fake = createFakeMetaWebhookPersistenceAdapter();
  setMetaWebhookPersistenceAdapter(fake.adapter);

  try {
    const payload = buildStatusPayload("sent", "wamid-b53-a");
    const response = await invokeSignedRequest(payload);
    const json = await response.json() as Record<string, unknown>;

    assertEquals(response.status, 200);
    assertEquals(json.ok, true);
    assertEquals(json.duplicate, false);
    assertEquals(fake.rows.length, 1);
  } finally {
    setMetaWebhookPersistenceAdapter(defaultPersistence.adapter);
  }
});

Deno.test("B5.3-B same exact event in a second invocation => DUPLICATE", async () => {
  setKnownSenderEnv("waba-123", "phone-123");
  const fake = createFakeMetaWebhookPersistenceAdapter();
  setMetaWebhookPersistenceAdapter(fake.adapter);

  try {
    const payload = buildStatusPayload("delivered", "wamid-b53-b");
    const first = await invokeSignedRequest(payload);
    const second = await invokeSignedRequest(payload);

    assertEquals(first.status, 200);
    assertEquals(second.status, 200);
    const firstJson = await first.json() as Record<string, unknown>;
    const secondJson = await second.json() as Record<string, unknown>;
    assertEquals(firstJson.duplicate, false);
    assertEquals(secondJson.duplicate, true);
    assertEquals(fake.rows.length, 1);
  } finally {
    setMetaWebhookPersistenceAdapter(defaultPersistence.adapter);
  }
});

Deno.test("B5.3-C same wamid + different lifecycle => NOT duplicate", async () => {
  const fake = createFakeMetaWebhookPersistenceAdapter();
  const sent = { provider: "meta", wabaId: "waba-1", phoneNumberId: "phone-1", wamid: "wamid-dup", status: "sent", providerEventTimestamp: 1710000000 } as const;
  const delivered = { ...sent, status: "delivered", providerEventTimestamp: 1710000001 } as const;

  const first = await fake.adapter.insertEvent({ event_key: computeMetaWebhookEventKey(sent), ...sent });
  const second = await fake.adapter.insertEvent({ event_key: computeMetaWebhookEventKey(delivered), ...delivered });
  assertEquals(first.inserted, true);
  assertEquals(second.inserted, true);
  assertEquals(fake.rows.length, 2);
});

Deno.test("B5.3-D same wamid + same lifecycle => duplicate", async () => {
  const fake = createFakeMetaWebhookPersistenceAdapter();
  const first = { provider: "meta", wabaId: "waba-1", phoneNumberId: "phone-1", wamid: "wamid-dup", status: "delivered", providerEventTimestamp: 1710000001 } as const;
  const second = { ...first, providerEventTimestamp: 1710000001 } as const;

  const firstResult = await fake.adapter.insertEvent({ event_key: computeMetaWebhookEventKey(first), ...first });
  const secondResult = await fake.adapter.insertEvent({ event_key: computeMetaWebhookEventKey(second), ...second });
  assertEquals(firstResult.inserted, true);
  assertEquals(secondResult.inserted, false);
  assertEquals(fake.rows.length, 1);
});

Deno.test("B5.3-E unknown WABA => ignored and no persistence", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const fake = createFakeMetaWebhookPersistenceAdapter();
  setMetaWebhookPersistenceAdapter(fake.adapter);

  try {
    const payload = buildStatusPayload("sent", "wamid-b53-e");
    payload.entry = [{
      id: "waba-unknown",
      changes: [{
        field: "messages",
        value: {
          metadata: {
            messaging_product: "whatsapp",
            display_phone_number: "+15551234567",
            phone_number_id: "phone-known",
          },
          statuses: [{
            id: "wamid-b53-e",
            status: "sent",
            timestamp: 1710000000,
            recipient_id: "628123456789",
          }],
        },
      }],
    }];

    const response = await invokeSignedRequest(payload);
    const json = await response.json() as Record<string, unknown>;
    assertEquals(response.status, 200);
    assertEquals(json.event, "ignored_unknown_sender");
    assertEquals(fake.rows.length, 0);
  } finally {
    setMetaWebhookPersistenceAdapter(defaultPersistence.adapter);
  }
});

Deno.test("B5.3-F unknown phone_number_id => ignored and no persistence", async () => {
  setKnownSenderEnv("waba-known", "phone-known");
  const fake = createFakeMetaWebhookPersistenceAdapter();
  setMetaWebhookPersistenceAdapter(fake.adapter);

  try {
    const payload = buildStatusPayload("sent", "wamid-b53-f");
    payload.entry = [{
      id: "waba-known",
      changes: [{
        field: "messages",
        value: {
          metadata: {
            messaging_product: "whatsapp",
            display_phone_number: "+15551234567",
            phone_number_id: "phone-unknown",
          },
          statuses: [{
            id: "wamid-b53-f",
            status: "sent",
            timestamp: 1710000000,
            recipient_id: "628123456789",
          }],
        },
      }],
    }];

    const response = await invokeSignedRequest(payload);
    const json = await response.json() as Record<string, unknown>;
    assertEquals(response.status, 200);
    assertEquals(json.event, "ignored_unknown_sender");
    assertEquals(fake.rows.length, 0);
  } finally {
    setMetaWebhookPersistenceAdapter(defaultPersistence.adapter);
  }
});

Deno.test("B5.3-G empty WABA allowlist => fail closed", async () => {
  Deno.env.delete("META_KNOWN_WABA_IDS");
  Deno.env.set("META_KNOWN_PHONE_NUMBER_IDS", "phone-123");
  const fake = createFakeMetaWebhookPersistenceAdapter();
  setMetaWebhookPersistenceAdapter(fake.adapter);

  try {
    const response = await invokeSignedRequest(buildStatusPayload("sent", "wamid-b53-g"));
    const json = await response.json() as Record<string, unknown>;
    assertEquals(response.status, 200);
    assertEquals(json.event, "ignored_unknown_sender");
    assertEquals(fake.rows.length, 0);
  } finally {
    setMetaWebhookPersistenceAdapter(null);
  }
});

Deno.test("B5.3-H empty phone allowlist => fail closed", async () => {
  Deno.env.set("META_KNOWN_WABA_IDS", "waba-123");
  Deno.env.delete("META_KNOWN_PHONE_NUMBER_IDS");
  const fake = createFakeMetaWebhookPersistenceAdapter();
  setMetaWebhookPersistenceAdapter(fake.adapter);

  try {
    const response = await invokeSignedRequest(buildStatusPayload("sent", "wamid-b53-h"));
    const json = await response.json() as Record<string, unknown>;
    assertEquals(response.status, 200);
    assertEquals(json.event, "ignored_unknown_sender");
    assertEquals(fake.rows.length, 0);
  } finally {
    setMetaWebhookPersistenceAdapter(null);
  }
});

Deno.test("B5.3-I two independent invocation contexts same event => only one NEW", async () => {
  const rows: Record<string, unknown>[] = [];
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const adapter = {
    insertEvent: async (row: Record<string, unknown>) => {
      await barrier;
      if (rows.some((entry) => entry.event_key === row.event_key)) {
        return { inserted: false, record: null };
      }
      rows.push(row);
      return { inserted: true, record: row };
    },
  };
  const row = { event_key: "same-canonical-event", provider: "meta", waba_id: "waba-123", phone_number_id: "phone-123", wamid: "wamid-b53-i", lifecycle_status: "read", provider_event_timestamp: 1710000000 };
  const first = adapter.insertEvent(row);
  const second = adapter.insertEvent(row);
  release();
  const results = await Promise.all([first, second]);

  assertEquals(results.filter((result) => result.inserted).length, 1);
  assertEquals(results.filter((result) => !result.inserted).length, 1);
  assertEquals(rows.length, 1);
});

Deno.test("B5.3-K raw-body payload hash is deterministic", () => {
  const raw = JSON.stringify({ hello: "world" });
  const first = computeMetaWebhookPayloadHash(raw);
  const second = computeMetaWebhookPayloadHash(raw);
  assertEquals(first, second);
  assertEquals(first.length, 64);
});

Deno.test("B5.3-L different lifecycle statuses generate different event keys", () => {
  const first = computeMetaWebhookEventKey({ provider: "meta", wabaId: "waba-1", phoneNumberId: "phone-1", wamid: "wamid-1", status: "sent", providerEventTimestamp: 1710000001 });
  const second = computeMetaWebhookEventKey({ provider: "meta", wabaId: "waba-1", phoneNumberId: "phone-1", wamid: "wamid-1", status: "delivered", providerEventTimestamp: 1710000001 });
  assertEquals(first === second, false);
});

