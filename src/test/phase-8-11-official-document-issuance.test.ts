import { describe, expect, it } from "vitest";
import {
  computeDocumentHash,
  canonicalizeDocumentPayload,
  summarizePublicVerificationStatus,
} from "@/lib/officialDocument";

describe("Phase 8.11 official document issuance and verification", () => {
  it("creates a deterministic canonical hash for a document payload", async () => {
    const payload = {
      document_type: "annual_report",
      source_entity_id: "550e8400-e29b-41d4-a716-446655440000",
      snapshot: {
        organization: "AFP SULSEL",
        total_events: 12,
        year: 2026,
      },
    };

    const first = await computeDocumentHash(payload);
    const second = await computeDocumentHash({
      source_entity_id: "550e8400-e29b-41d4-a716-446655440000",
      snapshot: {
        year: 2026,
        organization: "AFP SULSEL",
        total_events: 12,
      },
      document_type: "annual_report",
    });

    expect(canonicalizeDocumentPayload(payload)).toBe(canonicalizeDocumentPayload({
      document_type: "annual_report",
      source_entity_id: "550e8400-e29b-41d4-a716-446655440000",
      snapshot: {
        organization: "AFP SULSEL",
        total_events: 12,
        year: 2026,
      },
    }));
    expect(first).toBe(second);
  });

  it("maps verification status to public-friendly states", () => {
    expect(summarizePublicVerificationStatus("issued")).toMatchObject({ valid: true, status: "issued" });
    expect(summarizePublicVerificationStatus("revoked")).toMatchObject({ valid: false, status: "revoked" });
    expect(summarizePublicVerificationStatus("not_found")).toMatchObject({ valid: false, status: "not_found" });
    expect(summarizePublicVerificationStatus("integrity_failed")).toMatchObject({ valid: false, status: "integrity_failed" });
  });
});
