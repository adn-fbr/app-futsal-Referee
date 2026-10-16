import { describe, it, expect } from "vitest";
import { validateSettingKey, validateSettingValue, validateBulkSettings } from "@/lib/settingsValidation";

describe("safe settings validation", () => {
  it("accepts canonical allowlisted keys and trims surrounding whitespace", () => {
    expect(validateSettingKey("app_name")).toEqual({ ok: true, key: "app_name" });
    expect(validateSettingKey(" app_name ")).toEqual({ ok: true, key: "app_name" });
    expect(validateSettingKey("whatsapp_provider")).toEqual({ ok: true, key: "whatsapp_provider" });
  });

  it("rejects non-canonical case variants and invalid key shapes", () => {
    expect(validateSettingKey("App_Name")).toEqual({ ok: false, error: 'Setting key "App_Name" is not allowed' });
    expect(validateSettingKey("APP_NAME")).toEqual({ ok: false, error: 'Setting key "APP_NAME" is not allowed' });
    expect(validateSettingKey("")).toEqual({ ok: false, error: "Setting key is required" });
    expect(validateSettingKey("   ")).toEqual({ ok: false, error: "Setting key is required" });
    expect(validateSettingKey(123 as unknown)).toEqual({ ok: false, error: "Setting key must be a string" });
    expect(validateSettingKey(null as unknown)).toEqual({ ok: false, error: "Setting key must be a string" });
    expect(validateSettingKey({} as unknown)).toEqual({ ok: false, error: "Setting key must be a string" });
  });

  it("validates string and email values before any write", () => {
    expect(validateSettingValue("organization_name", "AFP Sulsel")).toEqual({ ok: true, value: "AFP Sulsel" });
    expect(validateSettingValue("organization_email", "admin@example.com")).toEqual({ ok: true, value: "admin@example.com" });
    expect(validateSettingValue("organization_email", "invalid-email")).toEqual({ ok: false, error: "organization_email must be a valid email address" });
    expect(validateSettingValue("organization_name", "   ")).toEqual({ ok: false, error: "organization_name cannot be empty" });
  });

  it("validates email_provider, integer, and numeric values deterministically", () => {
    expect(validateSettingValue("email_provider", "resend")).toEqual({ ok: true, value: "resend" });
    expect(validateSettingValue("email_provider", "smtp")).toEqual({ ok: true, value: "smtp" });
    expect(validateSettingValue("email_provider", "sendgrid")).toEqual({ ok: false, error: "email_provider must be one of: resend, smtp" });
    expect(validateSettingValue("max_event_referees", "12")).toEqual({ ok: true, value: "12" });
    expect(validateSettingValue("max_event_referees", "12.5")).toEqual({ ok: false, error: "max_event_referees must be a valid integer" });
    expect(validateSettingValue("honor_base_amount", "250000")).toEqual({ ok: true, value: "250000" });
    expect(validateSettingValue("honor_base_amount", "not-a-number")).toEqual({ ok: false, error: "honor_base_amount must be a valid number" });
  });

  it("validates WhatsApp providers and keeps secret settings outside the allowlist", () => {
    expect(validateSettingValue("whatsapp_provider", "meta")).toEqual({ ok: true, value: "meta" });
    expect(validateSettingValue("whatsapp_provider", "kirisan")).toEqual({ ok: true, value: "kirisan" });
    expect(validateSettingValue("whatsapp_provider", "telegram").ok).toBe(false);
    expect(validateSettingValue("whatsapp_provider", "").ok).toBe(false);
    expect(validateSettingValue("whatsapp_provider", "unknown").ok).toBe(false);
    expect(validateSettingValue("whatsapp_provider", "twilio").ok).toBe(false);
    expect(validateSettingValue("whatsapp_provider", null).ok).toBe(false);
    expect(validateSettingValue("whatsapp_provider", undefined).ok).toBe(false);

    for (const secretKey of [
      "resend_api_key",
      "smtp_password",
      "smtp_user",
      "smtp_host",
      "smtp_port",
      "smtp_secure",
      "whatsapp_api_key",
      "whatsapp_base_url",
      "whatsapp_sender_number",
      "whatsapp_enabled",
    ]) {
      expect(validateSettingKey(secretKey).ok).toBe(false);
    }
  });

  it("accepts one WhatsApp provider in bulk and rejects duplicate keys", () => {
    expect(validateBulkSettings([
      { key: "whatsapp_provider", value: "kirisan" },
    ])).toEqual({
      ok: true,
      normalized: [{ key: "whatsapp_provider", value: "kirisan" }],
    });

    expect(validateBulkSettings([
      { key: "whatsapp_provider", value: "meta" },
      { key: "whatsapp_provider", value: "kirisan" },
    ])).toEqual({ ok: false, error: "Duplicate setting key: whatsapp_provider" });
  });

  it("rejects invalid bulk payloads before writing any content", () => {
    expect(validateBulkSettings([
      { key: "organization_name", value: "AFP Sulsel" },
      { key: "organization_email", value: "INVALID" },
    ])).toEqual({ ok: false, error: "organization_email must be a valid email address" });

    expect(validateBulkSettings([
      { key: "app_name", value: "A" },
      { key: "app_name", value: "B" },
    ])).toEqual({ ok: false, error: "Duplicate setting key: app_name" });

    expect(validateBulkSettings([])).toEqual({ ok: false, error: "Settings payload cannot be empty" });
  });
});
