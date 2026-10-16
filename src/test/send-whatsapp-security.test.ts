import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "supabase/functions/send-whatsapp/index.ts"),
  "utf8",
);
const settingsSource = fs.readFileSync(path.join(process.cwd(), "src/pages/Settings.tsx"), "utf8");
const config = fs.readFileSync(path.join(process.cwd(), "supabase/config.toml"), "utf8").replace(/\r\n/g, "\n");

describe("send-whatsapp security contract", () => {
  it("uses shared JWT and admin_provinsi authorization", () => {
    expect(source).toContain("resolveCaller(req, supabase)");
    expect(source).toContain('hasAnyRole(caller, ["admin_provinsi"])');
    expect(config).toContain("[functions.send-whatsapp]\nverify_jwt = true");
  });

  it("validates the narrow template request contract", () => {
    expect(source).toContain('candidate.type !== "template"');
    expect(source).toContain("normalizeIndonesianPhone");
    expect(source).toContain("MAX_PARAMETERS");
    expect(source).toContain("MAX_PARAMETER_LENGTH");
    expect(source).toContain("Invalid WhatsApp template request");
  });

  it("builds a constrained Graph payload and never forwards the request body", () => {
    expect(source).toContain('messaging_product: "whatsapp"');
    expect(source).toContain('Authorization: `Bearer ${accessToken}`');
    expect(source).toContain("JSON.stringify(buildGraphPayload(parsed.request))");
    expect(source).not.toContain("body: JSON.stringify(body)");
  });

  it("keeps provider credentials server-side and uses generic provider errors", () => {
    expect(source).toContain('Deno.env.get("WHATSAPP_ACCESS_TOKEN")');
    expect(source).toContain('Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")');
    expect(source).toContain('Deno.env.get("WHATSAPP_API_VERSION")');
    expect(source).not.toContain("WHATSAPP_ACCESS_TOKEN` in");
    expect(source).not.toContain("providerBody.error");
    expect(source).toContain("Pesan WhatsApp gagal dikirim");
    expect(source).toContain("maskPhone");
  });

  it("handles CORS preflight and returns only submitted status", () => {
    expect(source).toContain('req.method === "OPTIONS"');
    expect(source).toContain('"Access-Control-Allow-Origin": "*"');
    expect(source).toContain('"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"');
    expect(source).toContain('status: "submitted"');
  });

  it("uses the verified Meta template language and named parameter contract", () => {
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

  it("uses the narrow frontend request contract without provider secrets", () => {
    expect(settingsSource).toContain('supabase.functions.invoke("send-whatsapp"');
    expect(settingsSource).toContain('type: "template"');
    expect(settingsSource).toContain('name: "hello_world"');
    expect(settingsSource).not.toContain("WHATSAPP_ACCESS_TOKEN");
    expect(settingsSource).not.toContain("WHATSAPP_PHONE_NUMBER_ID");
    expect(settingsSource).not.toContain("WHATSAPP_APP_SECRET");
  });
});
