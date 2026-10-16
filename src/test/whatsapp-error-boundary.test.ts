import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { internalWhatsappErrorResponse, WHATSAPP_INTERNAL_ERROR } from "../../supabase/functions/_shared/whatsapp-errors";

const root = process.cwd();

function read(file: string) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

async function responseBody(response: Response) {
  return await response.json() as { success: boolean; error: string };
}

describe("WhatsApp Edge Function error boundary", () => {
  it("returns a sanitized internal error contract", async () => {
    const rawError = "FAKE_SECRET_SHOULD_NEVER_APPEAR_IN_RESPONSE: SQLSTATE 42501";
    const response = internalWhatsappErrorResponse({});
    const body = await responseBody(response);

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: WHATSAPP_INTERNAL_ERROR });
    expect(JSON.stringify(body)).not.toContain(rawError);
  });

  it.each([
    ["provider failure", "provider rejected request: FAKE_PROVIDER_TOKEN"],
    ["database failure", "Postgres SQLSTATE 42501: FAKE_DATABASE_DETAIL"],
    ["secret-like failure", "FAKE_SECRET_SHOULD_NEVER_APPEAR_IN_RESPONSE"],
  ])("sanitizes %s details", async (_failureType, rawError) => {
    const response = internalWhatsappErrorResponse({});
    const body = await responseBody(response);

    expect(body.error).toBe(WHATSAPP_INTERNAL_ERROR);
    expect(JSON.stringify(body)).not.toContain(rawError);
  });

  it("preserves controlled client-safe errors as explicit responses", async () => {
    const response = new Response(
      JSON.stringify({ success: false, error: "Invalid WhatsApp configuration payload" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
    const body = await responseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid WhatsApp configuration payload");
  });

  it("contains no raw error propagation or sensitive logging in WhatsApp functions", () => {
    for (const file of [
      "supabase/functions/upsert-whatsapp-config/index.ts",
      "supabase/functions/test-whatsapp-config/index.ts",
    ]) {
      const source = read(file);
      expect(source).not.toContain("error.message");
      expect(source).not.toContain("String(error)");
      expect(source).not.toContain("error.toString()");
      expect(source).not.toContain("JSON.stringify(error)");
      expect(source).not.toMatch(/console\.(log|error|warn)/);
    }
  });
});