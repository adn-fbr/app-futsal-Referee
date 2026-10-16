import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { normalizeRefereeContactNumber } from "@/lib/refereeContact";

const root = process.cwd();

function read(file: string) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

describe("Phase 1 notification domain contract", () => {
  it("creates the canonical referral contact and assignment notification tables with strict constraints", () => {
    const migration = read("supabase/migrations/20260920110000_phase_notification_domain_contract_v1.sql");

    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.referee_contacts");
    expect(migration).toContain("referee_id UUID NOT NULL UNIQUE");
    expect(migration).toContain("FOREIGN KEY (referee_id) REFERENCES public.profiles(id)");
    expect(migration).toContain("whatsapp_number TEXT NOT NULL");
    expect(migration).toContain("created_at TIMESTAMPTZ NOT NULL DEFAULT now()");
    expect(migration).toContain("updated_at TIMESTAMPTZ NOT NULL DEFAULT now()");

    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.assignment_notifications");
    expect(migration).toContain("assignment_id UUID NOT NULL UNIQUE");
    expect(migration).toContain("FOREIGN KEY (assignment_id) REFERENCES public.event_assignments(id)");
    expect(migration).toContain("CHECK (email_status IN ('pending', 'sent', 'failed', 'skipped'))");
    expect(migration).toContain("CHECK (whatsapp_status IN ('pending', 'sent', 'failed', 'skipped'))");
    expect(migration).toContain("whatsapp_provider TEXT");
    expect(migration).toContain("CHECK (whatsapp_provider IS NULL OR whatsapp_provider IN ('meta', 'kirisan'))");
    expect(migration).toContain("whatsapp_request_id BIGINT");
  });

  it("keeps the schema secure and avoids unrestricted public access", () => {
    const migration = read("supabase/migrations/20260920110000_phase_notification_domain_contract_v1.sql");

    expect(migration).toContain("ALTER TABLE public.referee_contacts ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("ALTER TABLE public.assignment_notifications ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE ALL ON TABLE public.referee_contacts FROM anon, authenticated");
    expect(migration).toContain("REVOKE ALL ON TABLE public.assignment_notifications FROM anon, authenticated");
    expect(migration).not.toContain("USING (true)");
    expect(migration).not.toContain("auth.role() = 'authenticated'");
    expect(migration).not.toContain("TO authenticated\n\s*USING \(true\)");
  });

  it("keeps the Kirisan notification contract literal and avoids database kickoff_time columns", () => {
    const migration = read("supabase/migrations/20260920110000_phase_notification_domain_contract_v1.sql");

    expect(migration).toContain("Hubungi Koordinator Wasit");
    expect(migration).not.toContain("kickoff_time");
    expect(migration).not.toContain("event_matches");
    expect(migration).not.toContain("event_fixture");
  });

  it("adds the required indexes for lookups and correlation", () => {
    const migration = read("supabase/migrations/20260920110000_phase_notification_domain_contract_v1.sql");

    expect(migration).toContain("CREATE INDEX IF NOT EXISTS idx_referee_contacts_referee_id");
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS idx_assignment_notifications_assignment_id");
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS idx_assignment_notifications_whatsapp_request_id");
  });

  it("normalizes the saved referee WhatsApp number to the canonical international format", () => {
    expect(normalizeRefereeContactNumber("085812345678")).toBe("6285812345678");
    expect(normalizeRefereeContactNumber("+6285812345678")).toBe("6285812345678");
    expect(normalizeRefereeContactNumber("6285812345678")).toBe("6285812345678");
    expect(normalizeRefereeContactNumber("invalid")).toBeNull();
    expect(normalizeRefereeContactNumber(" ")).toBeNull();
  });

  it("creates a secure self-service RLS contract for referee contacts", () => {
    const migration = read("supabase/migrations/20260920130000_referee_whatsapp_contact_self_service.sql");

    expect(migration).toContain("CREATE POLICY \"Referees can view their own whatsapp contact\"");
    expect(migration).toContain("auth.uid() = referee_id");
    expect(migration).toContain("public.has_role(auth.uid(), 'wasit'::public.app_role)");
    expect(migration).toContain("CREATE POLICY \"Referees can insert their own whatsapp contact\"");
    expect(migration).toContain("FOR INSERT");
    expect(migration).toContain("CREATE POLICY \"Referees can update their own whatsapp contact\"");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).not.toContain("USING (true)");
    expect(migration).not.toContain("TO authenticated");
  });
});
