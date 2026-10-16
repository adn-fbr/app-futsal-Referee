import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  isWhatsAppProvider,
  resolveWhatsAppProvider,
  WHATSAPP_PROVIDERS,
} from "@/lib/whatsappProvider";
import { validateSettingValue } from "@/lib/settingsValidation";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("WhatsApp provider contract", () => {
  it("accepts only the meta and kirisan provider enum", () => {
    expect(WHATSAPP_PROVIDERS).toEqual(["meta", "kirisan"]);
    expect(isWhatsAppProvider("meta")).toBe(true);
    expect(isWhatsAppProvider("kirisan")).toBe(true);
    expect(isWhatsAppProvider("unknown")).toBe(false);
    expect(isWhatsAppProvider("")).toBe(false);
  });

  it("keeps Meta as the backward-compatible default", () => {
    expect(resolveWhatsAppProvider(undefined)).toBe("meta");
    expect(resolveWhatsAppProvider("invalid")).toBe("meta");
    expect(resolveWhatsAppProvider("kirisan")).toBe("kirisan");
  });

  it("uses the verified Meta template language and named parameter contract", () => {
    const source = read("supabase/functions/send-whatsapp/index.ts");
    const metaPayloadSource = source.slice(source.indexOf("function buildMetaNamedParameters"), source.indexOf("function validateKirisanBaseUrl"));
    expect(source).toContain('const META_TEMPLATE_NAME = "afp_sulsel_referee_assignmen_new";');
    expect(source).toContain('const META_TEMPLATE_LANGUAGE = "en";');
    expect(source).toContain('parameter_name: "referee_name"');
    expect(source).toContain('parameter_name: "assignment_role"');
    expect(source).toContain('parameter_name: "competition_name"');
    expect(source).toContain('parameter_name: "match_date"');
    expect(source).toContain('parameter_name: "kickoff_time"');
    expect(source).toContain('parameter_name: "venue"');
    expect(source).toContain('parameter_name: "assignment_status"');
    expect(metaPayloadSource).not.toContain('"en_US"');
  });

  it("validates the active provider setting without accepting arbitrary strings", () => {
    expect(validateSettingValue("whatsapp_provider", "meta")).toEqual({ ok: true, value: "meta" });
    expect(validateSettingValue("whatsapp_provider", "kirisan")).toEqual({ ok: true, value: "kirisan" });
    expect(validateSettingValue("whatsapp_provider", "unknown").ok).toBe(false);
    expect(validateSettingValue("whatsapp_provider", "").ok).toBe(false);
  });

  it("stores only the non-secret provider selector in browser settings", () => {
    const settingsHook = read("src/hooks/useSettings.ts");
    const settingsPage = read("src/pages/Settings.tsx");

    expect(settingsHook).toContain('"whatsapp_provider"');
    expect(settingsHook).not.toContain('select("whatsapp_api_key");');
    expect(settingsHook).not.toContain('select("whatsapp_base_url");');
    expect(settingsPage).toContain("WhatsApp Provider");
    expect(settingsPage).not.toContain("KIRISAN_API_TOKEN");
    expect(settingsPage).not.toContain("WHATSAPP_ACCESS_TOKEN");
  });

  it("keeps the Meta adapter and replaces the stubbed Kirisan boundary with the real WABA adapter contract", () => {
    const source = read("supabase/functions/send-whatsapp/index.ts");

    expect(source).toContain("resolveCaller(req, supabase)");
    expect(source).toContain('hasAnyRole(caller, ["admin_provinsi"])');
    expect(source).toContain('activeProvider === "kirisan"');
    expect(source).toContain("KIRISAN_API_TOKEN");
    expect(source).toContain("KIRISAN_WHATSAPP_DEVICE_TOKEN");
    expect(source).toContain("afp_sulsel_referee_assignment");
    expect(source).toContain('"en_US"');
    expect(source).toContain("channels.waba.status");
    expect(source).toContain("https://api.kirisan.com/v1/send");
    expect(source).not.toContain("KIRISAN_OUTBOUND_CONTRACT_OPEN");
    expect(source).not.toContain("provider_message_id: String");
  });

  it("keeps Meta credentials and Kirisan credentials server-side", () => {
    const source = read("supabase/functions/send-whatsapp/index.ts");
    const page = read("src/pages/Settings.tsx");

    expect(source).toContain('Deno.env.get("WHATSAPP_ACCESS_TOKEN")');
    expect(source).toContain('Deno.env.get("KIRISAN_API_TOKEN")');
    expect(page).not.toContain("WHATSAPP_ACCESS_TOKEN");
    expect(page).not.toContain("KIRISAN_API_TOKEN");
  });

  it("implements the Kirisan WABA adapter and response validation contract for TEST mode", () => {
    const source = read("supabase/functions/send-whatsapp/index.ts");

    expect(source).toContain('KIRISAN_WHATSAPP_DEVICE_TOKEN');
    expect(source).toContain('afp_sulsel_referee_assignment');
    expect(source).toContain('"en_US"');
    expect(source).toContain('api.kirisan.com');
    expect(source).toContain('keys: {');
    expect(source).toContain('channels.waba.status');
    expect(source).toContain('status: "submitted"');
    expect(source).toContain('provider: "kirisan"');
    expect(source).not.toContain('KIRISAN_OUTBOUND_CONTRACT_OPEN');
    expect(source).not.toContain('providerBody.error');
  });

  it("keeps the Kirisan WABA contract aligned with the documented keys/content/target request shape", () => {
    const source = read("supabase/functions/send-whatsapp/index.ts");

    expect(source).toContain('keys: {');
    expect(source).toContain('content: {');
    expect(source).toContain('target: {');
    expect(source).toContain('waba: { token: deviceToken }');
    expect(source).toContain('waba: { template: KIRISAN_TEMPLATE_ID }');
    expect(source).toContain('waba: request.to');
    expect(source).not.toContain('"to": request.to');
    expect(source).not.toContain('"template": {');
    expect(source).not.toContain('KIRISAN_OUTBOUND_CONTRACT_OPEN');
    expect(source).toContain('Authorization: `Bearer ${kirisanToken}`');
    expect(source).toContain('KIRISAN_WHATSAPP_DEVICE_TOKEN');
  });
});
