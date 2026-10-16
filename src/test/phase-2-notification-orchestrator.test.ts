import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  buildKirisanTemplateParameters,
  normalizeWhatsAppNumber,
  parseAssignmentNotificationRequest,
} from "@/lib/notificationOrchestrator";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("Phase 2 notification orchestrator", () => {
  it("accepts only the assignmentId request schema and rejects malformed values", () => {
    expect(parseAssignmentNotificationRequest({ assignmentId: "0f74a51c-3a6d-4f10-88e0-6f9c0e2f1fec" })).toEqual({
      ok: true,
      assignmentId: "0f74a51c-3a6d-4f10-88e0-6f9c0e2f1fec",
    });

    expect(parseAssignmentNotificationRequest({ assignmentId: "not-a-uuid" })).toEqual({
      ok: false,
      error: "MALFORMED_ASSIGNMENT_ID",
    });

    expect(parseAssignmentNotificationRequest({ assignmentId: "uuid", extra: true })).toEqual({
      ok: false,
      error: "INVALID_REQUEST",
    });

    expect(parseAssignmentNotificationRequest({})).toEqual({
      ok: false,
      error: "INVALID_REQUEST",
    });
  });

  it("validates and normalizes the WhatsApp target using the canonical phone format", () => {
    expect(normalizeWhatsAppNumber("081234567890")).toBe("6281234567890");
    expect(normalizeWhatsAppNumber("+6281234567890")).toBe("6281234567890");
    expect(normalizeWhatsAppNumber("6281234567890")).toBe("6281234567890");
    expect(normalizeWhatsAppNumber("12345")).toBeNull();
  });

  it("uses the exact Kirisan template parameter order for the assignment notification contract", () => {
    expect(buildKirisanTemplateParameters(
      "Agus Wijaya",
      "UTAMA",
      "Liga Futsal Sulsel",
      "2026-03-15",
      "GOR Sudiang",
      "confirmed",
    )).toEqual([
      "Agus Wijaya",
      "UTAMA",
      "Liga Futsal Sulsel",
      "Hubungi Koordinator Wasit",
      "2026-03-15",
      "GOR Sudiang",
      "confirmed",
    ]);
  });

  it("uses the canonical Meta template and persists the Meta wamid in the notification row", () => {
    const source = read("supabase/functions/notification-orchestrator/index.ts");

    expect(source).toContain('name: "afp_sulsel_referee_assignmen_new"');
    expect(source).toContain('"Hubungi Koordinator Wasit"');
    expect(source).toContain("whatsapp_message_id");
    expect(source).toContain("messageId");
    expect(source).toContain("providerResult.messageId");
  });

  it("keeps the orchestrator server-side and free of browser secrets", () => {
    const source = read("supabase/functions/notification-orchestrator/index.ts");
    const settingsPage = read("src/pages/Settings.tsx");

    expect(source).toContain("resolveCaller(req, supabase)");
    expect(source).toContain("hasAnyRole(caller, [\"admin_provinsi\", \"admin_kab_kota\", \"panitia\"])");
    expect(source).toContain("send-assignment-notification");
    expect(source).toContain("send-whatsapp");
    expect(source).toContain("Deno.env.get(\"SUPABASE_SERVICE_ROLE_KEY\")");
    expect(source).not.toContain("KIRISAN_API_TOKEN");
    expect(source).not.toContain("WHATSAPP_ACCESS_TOKEN");
    expect(source).not.toContain("smtp_password");
    expect(source).not.toContain("Resend");
    expect(settingsPage).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(settingsPage).not.toContain("KIRISAN_API_TOKEN");
    expect(settingsPage).not.toContain("WHATSAPP_ACCESS_TOKEN");
  });

  it("preserves the Phase 1 contract without adding match/fixture operational columns", () => {
    const source = read("supabase/functions/notification-orchestrator/index.ts");

    expect(source).toContain("assignment_notifications");
    expect(source).not.toContain("kickoff_time");
    expect(source).not.toContain("match_time");
    expect(source).not.toContain("fixture_id");
    expect(source).not.toContain("match_id");
    expect(source).not.toContain("game_id");
  });

  it("routes assignment creation through the orchestrator with only assignmentId", () => {
    const assignmentHook = read("src/hooks/useEventAssignments.ts");
    const batchHook = read("src/hooks/useSmartAssignment.ts");

    expect(assignmentHook).toMatch(/supabase\.functions\s*\.invoke\(\s*"notification-orchestrator"/s);
    expect(assignmentHook).toContain("assignmentId: data.id");
    expect(assignmentHook).not.toMatch(/supabase\.functions\s*\.invoke\(\s*"send-assignment-notification"/s);
    expect(batchHook).toMatch(/supabase\.functions\s*\.invoke\(\s*"notification-orchestrator"/s);
    expect(batchHook).toContain("assignmentId: data.id");
    expect(batchHook).not.toMatch(/supabase\.functions\s*\.invoke\(\s*"send-assignment-notification"/s);
  });

  it("requires authenticated, verified JWT delivery for the new function", () => {
    const config = read("supabase/config.toml");
    expect(config).toContain("[functions.notification-orchestrator]");
    expect(config).toContain("verify_jwt = true");
  });

  it("integrates claim and finalize RPC gates before provider delivery", () => {
    const source = read("supabase/functions/notification-orchestrator/index.ts");
    expect(source).toContain("claim_notification_channel");
    expect(source).toContain("finalize_notification_channel");
    expect(source).toContain("p_assignment_id");
    expect(source).toContain("p_claim_id");
    expect(source).toContain("p_status");
  });

  it("prevents WhatsApp delivery when the contact is missing before any claim is created", () => {
    const source = read("supabase/functions/notification-orchestrator/index.ts");
    expect(source).toContain("WHATSAPP_CONTACT_MISSING");
    expect(source).toContain("const normalized = normalizeWhatsAppNumber(rawContact);");
    expect(source).toContain("if (!normalized)");
    expect(source).toContain("createChannelOutcome(\"skipped\", \"WHATSAPP_CONTACT_MISSING\")");
    expect(source).toContain("\"whatsapp\"");
    expect(source).toContain("\"skipped\"");
  });
});
