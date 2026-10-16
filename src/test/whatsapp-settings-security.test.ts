import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file: string) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

describe("safe settings boundary contract", () => {
  it("removes browser-exposed WhatsApp secret configuration from the UI", () => {
    const settingsSource = read("src/pages/Settings.tsx");

    expect(settingsSource).not.toContain('TabsTrigger value="whatsapp"');
    expect(settingsSource).not.toContain("whatsapp_api_key");
    expect(settingsSource).not.toContain("WHATSAPP_ENCRYPTION_KEY");
    expect(settingsSource).not.toContain("secretValue");
  });

  it("keeps the safe settings boundary and excludes sensitive fields from public read paths", () => {
    const settingsHook = read("src/hooks/useSettings.ts");
    const migration = read("supabase/migrations/20260918000000_safe_public_application_settings_boundary.sql");

    expect(settingsHook).toContain("public_application_settings");
    expect(settingsHook).not.toContain('select("*")');
    expect(settingsHook).not.toContain("system_settings");
    expect(migration).toContain("public_application_settings");
    expect(migration).toContain("resend_api_key");
    expect(migration).toContain("whatsapp_api_key");
    expect(migration).not.toContain("GRANT SELECT ON public.system_settings TO authenticated");
  });
});
