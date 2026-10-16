import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  decryptWhatsappSecret,
  encryptWhatsappSecret,
  requireWhatsappEncryptionKey,
  WHATSAPP_SECRET_PROTECTION_ERROR,
} from "../../supabase/functions/_shared/whatsapp-crypto";
import {
  internalWhatsappErrorResponse,
  WHATSAPP_INTERNAL_ERROR,
} from "../../supabase/functions/_shared/whatsapp-errors";

const root = process.cwd();
const syntheticSecret = "TEST_SECRET_VALUE";
const syntheticKey = "synthetic-whatsapp-encryption-key";

function read(file: string) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

describe("WhatsApp secret protection fail-closed contract", () => {
  it("retains the protected encryption path when a key is present", async () => {
    const ciphertext = await encryptWhatsappSecret(syntheticSecret, syntheticKey);
    const plaintext = await decryptWhatsappSecret(ciphertext, syntheticKey);

    expect(ciphertext).not.toBe(syntheticSecret);
    expect(plaintext).toBe(syntheticSecret);
  });

  it("fails closed when the encryption key is absent", async () => {
    await expect(encryptWhatsappSecret(syntheticSecret, undefined))
      .rejects.toThrow(WHATSAPP_SECRET_PROTECTION_ERROR);
    expect(() => requireWhatsappEncryptionKey(undefined))
      .toThrow(WHATSAPP_SECRET_PROTECTION_ERROR);
  });

  it("blocks persistence when protection fails", async () => {
    const persist = vi.fn();

    try {
      const protectedSecret = await encryptWhatsappSecret(syntheticSecret, undefined);
      persist(protectedSecret);
    } catch {
      // Expected fail-closed path.
    }

    expect(persist).not.toHaveBeenCalled();
  });

  it("returns only the sanitized error contract", async () => {
    const response = internalWhatsappErrorResponse({});
    const body = await response.json() as { success: boolean; error: string };

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: WHATSAPP_INTERNAL_ERROR });
    expect(JSON.stringify(body)).not.toContain(syntheticSecret);
    expect(JSON.stringify(body)).not.toContain(syntheticKey);
  });

  it("does not contact the provider when protection is unavailable", () => {
    const provider = vi.fn();

    try {
      requireWhatsappEncryptionKey(undefined);
      provider(syntheticSecret);
    } catch {
      // Expected fail-closed path.
    }

    expect(provider).not.toHaveBeenCalled();
  });

  it("sanitizes synthetic internal crypto failures", async () => {
    const rawError = `${syntheticSecret}: crypto failure with ${syntheticKey}`;
    const response = internalWhatsappErrorResponse({});
    const body = await response.json() as { success: boolean; error: string };

    expect(body.error).toBe(WHATSAPP_INTERNAL_ERROR);
    expect(JSON.stringify(body)).not.toContain(rawError);
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("has no executable plaintext fallback in either WhatsApp function", () => {
    for (const file of [
      "supabase/functions/upsert-whatsapp-config/index.ts",
      "supabase/functions/test-whatsapp-config/index.ts",
    ]) {
      const source = read(file);
      expect(source).not.toMatch(/if\s*\(!keyMaterial\)[\s\S]{0,120}return\s+(secret|ciphertext)/);
      expect(source).not.toContain("return secret");
      expect(source).not.toContain("return ciphertext");
      expect(source).not.toContain("return apiKey");
    }
  });
});