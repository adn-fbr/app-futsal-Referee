import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../_shared/authorization.ts", () => ({
  resolveCaller: vi.fn(async () => ({ user: { id: "user-1" } })),
  hasAnyRole: vi.fn(() => true),
}));

import { buildGraphPayload, handler, validateMetaApiVersion } from "./index.ts";

const buildValidRequest = () => ({
  to: "081234567890",
  type: "template",
  template: {
    name: "afp_sulsel_referee_assignmen_new",
    language: "en_US",
    parameters: [
      "Referee A",
      "Main Referee",
      "Liga Nasional",
      "19:00",
      "2026-09-22",
      "Stadion Sepakbola",
      "Confirmed",
    ],
  },
});

const makeEnv = (apiVersion: string) =>
  vi.fn((key: string) => {
    const values: Record<string, string> = {
      WHATSAPP_ACCESS_TOKEN: "token-123",
      WHATSAPP_PHONE_NUMBER_ID: "123456789",
      WHATSAPP_API_VERSION: apiVersion,
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-key",
    };
    return values[key] ?? undefined;
  });

describe("send-whatsapp behavioral contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("accepts valid Meta API versions and rejects invalid ones", () => {
    expect(validateMetaApiVersion("v23.0")).toBe(true);
    expect(validateMetaApiVersion("v24.1")).toBe(true);
    expect(validateMetaApiVersion("23.0")).toBe(false);
    expect(validateMetaApiVersion("v23")).toBe(false);
    expect(validateMetaApiVersion("V23.0")).toBe(false);
    expect(validateMetaApiVersion("v23.")).toBe(false);
    expect(validateMetaApiVersion("v23.0/")).toBe(false);
    expect(validateMetaApiVersion("https://graph.facebook.com/v23.0")).toBe(false);
    expect(validateMetaApiVersion("")).toBe(false);
    expect(validateMetaApiVersion(null)).toBe(false);
    expect(validateMetaApiVersion(undefined)).toBe(false);
  });

  it("blocks the Meta provider call when the configured API version is invalid", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("Deno", { env: { get: makeEnv("23.0") } });

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req);
    expect(res.status).toBe(503);
    const payload = await res.json();
    expect(payload).toEqual({ success: false, error: "WhatsApp belum dikonfigurasi" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reaches the Meta Graph API when the version is valid", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ messages: [{ id: "wamid.TEST123" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("Deno", { env: { get: makeEnv("v23.0") } });

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://graph.facebook.com/v23.0/123456789/messages");
  });

  it("keeps recipient_type server-controlled and rejects a client-supplied group value", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("Deno", { env: { get: makeEnv("v23.0") } });

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...buildValidRequest(), recipient_type: "group" }),
    });

    const res = await handler(req);
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();

    const payload = buildGraphPayload(buildValidRequest());
    expect(payload).toMatchObject({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "6281234567890",
      type: "template",
    });
  });

  it("returns the WAMID from the provider message id on successful Meta submission", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ messages: [{ id: "wamid.TEST123" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("Deno", { env: { get: makeEnv("v23.0") } });

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload).toMatchObject({
      success: true,
      provider: "meta",
      status: "submitted",
      messageId: "wamid.TEST123",
      message_id: "wamid.TEST123",
    });
  });

  it("fails generically when a successful Meta response omits the WAMID", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ messages: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("Deno", { env: { get: makeEnv("v23.0") } });

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req);
    expect(res.status).toBe(502);
    const payload = await res.json();
    expect(payload).toEqual({ success: false, error: "Pesan WhatsApp gagal dikirim" });
  });

  it("logs safe diagnostics for provider errors and keeps the caller generic", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        error: {
          type: "OAuthException",
          code: 200,
          error_subcode: 123,
          fbtrace_id: "TEST_TRACE",
          is_transient: false,
          message: "SECRET PROVIDER MESSAGE",
        },
      }), { status: 400 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("Deno", { env: { get: makeEnv("v23.0") } });

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req);
    expect(res.status).toBe(502);
    const payload = await res.json();
    expect(payload).toEqual({ success: false, error: "Pesan WhatsApp gagal dikirim" });
    expect(consoleError).toHaveBeenCalledWith(
      "whatsapp_provider_error",
      expect.objectContaining({
        provider_http_status: 400,
        provider_error_type: "OAuthException",
        provider_error_code: 200,
        provider_error_subcode: 123,
        provider_fbtrace_id: "TEST_TRACE",
        provider_error_is_transient: false,
      }),
    );
    const loggedText = JSON.stringify(consoleError.mock.calls.flat());
    expect(loggedText).not.toContain("SECRET PROVIDER MESSAGE");
    expect(loggedText).not.toContain("token-123");
    expect(loggedText).not.toContain("Authorization");
  });

  it("returns a generic error when Meta fetch throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.fn().mockRejectedValue(new Error("provider exploded"));
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("Deno", { env: { get: makeEnv("v23.0") } });

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req);
    expect(res.status).toBe(502);
    const payload = await res.json();
    expect(payload).toEqual({ success: false, error: "Pesan WhatsApp gagal dikirim" });
    const loggedText = JSON.stringify(consoleError.mock.calls.flat());
    expect(loggedText).not.toContain("provider exploded");
    expect(loggedText).not.toContain("stack");
  });
});
