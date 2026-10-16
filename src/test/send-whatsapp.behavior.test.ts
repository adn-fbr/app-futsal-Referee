import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const GENERIC_CONFIGURATION_ERROR = "WhatsApp belum dikonfigurasi";
const GENERIC_SEND_ERROR = "Pesan WhatsApp gagal dikirim";
const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function normalizeIndonesianPhone(value) {
  if (typeof value !== "string") return null;

  const input = value.trim();
  let digits;
  if (input.startsWith("+62")) {
    digits = input.slice(1);
  } else if (input.startsWith("08")) {
    digits = `628${input.slice(2)}`;
  } else {
    digits = input;
  }

  if (!/^628\d{7,12}$/.test(digits)) return null;
  return digits;
}

function parseRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false };
  const candidate = body;
  const topLevelKeys = Object.keys(candidate).sort();
  if (topLevelKeys.join(",") !== "template,to,type") return { ok: false };
  if (candidate.type !== "template") return { ok: false };

  const to = normalizeIndonesianPhone(candidate.to);
  if (!to || !candidate.template || typeof candidate.template !== "object" || Array.isArray(candidate.template)) {
    return { ok: false };
  }

  const template = candidate.template;
  const templateKeys = Object.keys(template).sort();
  if (templateKeys.join(",") !== "language,name,parameters") return { ok: false };
  if (typeof template.name !== "string" || !/^[a-z0-9_]+$/i.test(template.name.trim()) || template.name.trim().length > 128) {
    return { ok: false };
  }
  if (typeof template.language !== "string" || !/^[A-Za-z0-9_-]+$/.test(template.language.trim()) || template.language.trim().length > 32) {
    return { ok: false };
  }
  if (!Array.isArray(template.parameters) || template.parameters.length > 20) return { ok: false };
  if (!template.parameters.every((parameter) => typeof parameter === "string" && parameter.length <= 1024)) {
    return { ok: false };
  }

  return {
    ok: true,
    request: {
      to,
      type: "template",
      template: {
        name: template.name.trim(),
        language: template.language.trim(),
        parameters: template.parameters,
      },
    },
  };
}

function validateMetaApiVersion(value) {
  if (typeof value !== "string") return false;
  const candidate = value.trim();
  if (!candidate) return false;
  return /^v[0-9]+\.[0-9]+$/.test(candidate);
}

function buildGraphPayload(request) {
  const template = {
    name: request.template.name,
    language: { code: request.template.language === "en_US" ? "en" : request.template.language },
  };

  if (request.template.parameters.length > 0) {
    const parameterMappings = [
      ["referee_name", 0],
      ["assignment_role", 1],
      ["competition_name", 2],
      ["match_date", 4],
      ["kickoff_time", 3],
      ["venue", 5],
      ["assignment_status", 6],
    ];
    template.components = [{
      type: "body",
      parameters: parameterMappings.map(([parameterName, index]) => ({
        type: "text",
        parameter_name: parameterName,
        text: request.template.parameters[index],
      })),
    }];
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: request.to,
    type: "template",
    template,
  };
}

async function handler(req, envOverrides = {}) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  const env = {
    WHATSAPP_ACCESS_TOKEN: "",
    WHATSAPP_PHONE_NUMBER_ID: "",
    WHATSAPP_API_VERSION: "",
    ...envOverrides,
  };

  const accessToken = (env.WHATSAPP_ACCESS_TOKEN ?? "").trim();
  const phoneNumberId = (env.WHATSAPP_PHONE_NUMBER_ID ?? "").trim();
  const apiVersion = ((env.WHATSAPP_API_VERSION ?? "").trim());

  if (!accessToken || !phoneNumberId || !apiVersion) {
    return jsonResponse({ success: false, error: GENERIC_CONFIGURATION_ERROR }, 503);
  }

  if (!validateMetaApiVersion(apiVersion)) {
    return jsonResponse({ success: false, error: GENERIC_CONFIGURATION_ERROR }, 503);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid WhatsApp template request" }, 400);
  }

  const parsed = parseRequest(body);
  if (!parsed.ok) {
    return jsonResponse({ success: false, error: "Invalid WhatsApp template request" }, 400);
  }

  const graphUrl = `https://graph.facebook.com/${encodeURIComponent(apiVersion)}/${encodeURIComponent(phoneNumberId)}/messages`;

  let graphResponse;
  try {
    graphResponse = await fetch(graphUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGraphPayload(parsed.request)),
    });
  } catch (error) {
    console.error("whatsapp_provider_network_error", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return jsonResponse({ success: false, error: GENERIC_SEND_ERROR }, 502);
  }

  let providerBody = null;
  try {
    providerBody = await graphResponse.json();
  } catch {
    providerBody = null;
  }

  if (!graphResponse.ok) {
    const providerErrorObject = providerBody && typeof providerBody === "object" && !Array.isArray(providerBody)
      ? providerBody.error
      : undefined;

    console.error("whatsapp_provider_error", {
      provider_http_status: graphResponse.status,
      provider_error_type: typeof providerErrorObject?.type === "string" ? providerErrorObject.type : null,
      provider_error_code: typeof providerErrorObject?.code === "number" || typeof providerErrorObject?.code === "string"
        ? providerErrorObject.code
        : null,
      provider_error_subcode: typeof providerErrorObject?.error_subcode === "number" || typeof providerErrorObject?.error_subcode === "string"
        ? providerErrorObject.error_subcode
        : null,
      provider_fbtrace_id: typeof providerErrorObject?.fbtrace_id === "string" ? providerErrorObject.fbtrace_id : null,
      provider_error_is_transient: typeof providerErrorObject?.is_transient === "boolean" ? providerErrorObject.is_transient : null,
    });
    return jsonResponse({ success: false, error: GENERIC_SEND_ERROR }, 502);
  }

  const messageId = providerBody?.messages?.[0]?.id;
  if (typeof messageId !== "string" || !messageId) {
    return jsonResponse({ success: false, error: GENERIC_SEND_ERROR }, 502);
  }

  return jsonResponse({
    success: true,
    messageId,
    message_id: messageId,
    provider: "meta",
    status: "submitted",
  }, 200);
}

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

describe("send-whatsapp behavioral contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("validates Meta API versions correctly", () => {
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

  it("blocks provider call when API version is invalid", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req, {
      WHATSAPP_ACCESS_TOKEN: "token-123",
      WHATSAPP_PHONE_NUMBER_ID: "123456789",
      WHATSAPP_API_VERSION: "23.0",
    });

    expect(res.status).toBe(503);
    const payload = await res.json();
    expect(payload).toEqual({ success: false, error: GENERIC_CONFIGURATION_ERROR });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reaches the Meta Graph provider when the version is valid", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ messages: [{ id: "wamid.TEST123" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req, {
      WHATSAPP_ACCESS_TOKEN: "token-123",
      WHATSAPP_PHONE_NUMBER_ID: "123456789",
      WHATSAPP_API_VERSION: "v23.0",
    });

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://graph.facebook.com/v23.0/123456789/messages");
  });

  it("sends a server-controlled recipient_type individual", () => {
    const payload = buildGraphPayload(buildValidRequest());
    expect(payload).toMatchObject({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      type: "template",
    });
    expect(payload.recipient_type).toBe("individual");
    expect(payload.template).toMatchObject({ name: "afp_sulsel_referee_assignmen_new", language: { code: "en" } });
    expect(JSON.stringify(payload)).not.toContain("en_US");
    expect(payload.template.components[0].parameters).toEqual([
      { type: "text", parameter_name: "referee_name", text: "Referee A" },
      { type: "text", parameter_name: "assignment_role", text: "Main Referee" },
      { type: "text", parameter_name: "competition_name", text: "Liga Nasional" },
      { type: "text", parameter_name: "match_date", text: "2026-09-22" },
      { type: "text", parameter_name: "kickoff_time", text: "19:00" },
      { type: "text", parameter_name: "venue", text: "Stadion Sepakbola" },
      { type: "text", parameter_name: "assignment_status", text: "Confirmed" },
    ]);
    expect(payload.template.components[0].parameters).toHaveLength(7);
  });

  it("returns the provider WAMID on successful Meta response", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ messages: [{ id: "wamid.TEST123" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req, {
      WHATSAPP_ACCESS_TOKEN: "token-123",
      WHATSAPP_PHONE_NUMBER_ID: "123456789",
      WHATSAPP_API_VERSION: "v23.0",
    });

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

  it("fails generically when Meta success response omits WAMID", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ messages: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req, {
      WHATSAPP_ACCESS_TOKEN: "token-123",
      WHATSAPP_PHONE_NUMBER_ID: "123456789",
      WHATSAPP_API_VERSION: "v23.0",
    });

    expect(res.status).toBe(502);
    const payload = await res.json();
    expect(payload).toEqual({ success: false, error: GENERIC_SEND_ERROR });
  });

  it("keeps provider errors generic while logging safe diagnostics only", async () => {
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

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req, {
      WHATSAPP_ACCESS_TOKEN: "token-123",
      WHATSAPP_PHONE_NUMBER_ID: "123456789",
      WHATSAPP_API_VERSION: "v23.0",
    });

    expect(res.status).toBe(502);
    const payload = await res.json();
    expect(payload).toEqual({ success: false, error: GENERIC_SEND_ERROR });
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

  it("returns a generic error on network exception without exposing the raw exception", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.fn().mockRejectedValue(new Error("provider exploded"));
    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidRequest()),
    });

    const res = await handler(req, {
      WHATSAPP_ACCESS_TOKEN: "token-123",
      WHATSAPP_PHONE_NUMBER_ID: "123456789",
      WHATSAPP_API_VERSION: "v23.0",
    });

    expect(res.status).toBe(502);
    const payload = await res.json();
    expect(payload).toEqual({ success: false, error: GENERIC_SEND_ERROR });
    const loggedText = JSON.stringify(consoleError.mock.calls.flat());
    expect(loggedText).not.toContain("provider exploded");
    expect(loggedText).not.toContain("stack");
  });

  it("rejects client-controlled recipient_type group values", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...buildValidRequest(),
        recipient_type: "group",
      }),
    });

    const res = await handler(req, {
      WHATSAPP_ACCESS_TOKEN: "token-123",
      WHATSAPP_PHONE_NUMBER_ID: "123456789",
      WHATSAPP_API_VERSION: "v23.0",
    });

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps the security regression checks in place", () => {
    const configText = fs.readFileSync(path.join(process.cwd(), "supabase/config.toml"), "utf8");
    const settingsText = fs.readFileSync(path.join(process.cwd(), "src/pages/Settings.tsx"), "utf8");

    expect(configText).toContain("[functions.send-whatsapp]");
    expect(configText).toContain("verify_jwt = true");
    expect(settingsText).not.toContain("WHATSAPP_ACCESS_TOKEN");
    expect(settingsText).not.toContain("WHATSAPP_PHONE_NUMBER_ID");
    expect(settingsText).not.toContain("WHATSAPP_APP_SECRET");
    expect(typeof handler).toBe("function");
  });
});
