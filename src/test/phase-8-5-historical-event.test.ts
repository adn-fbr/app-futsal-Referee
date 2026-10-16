import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(`${process.cwd()}/src/pages/EventSubmission.tsx`, "utf8");

describe("Phase 8.5 historical event creation contract", () => {
  it("gates past-date creation through the canonical Admin Provinsi role", () => {
    expect(source).toContain("const { user, isAdminProvinsi } = useAuth();");
    expect(source).toContain("const canCreateHistoricalEvent = isAdminProvinsi();");
    expect(source).toContain("!canCreateHistoricalEvent && date < today");
  });

  it("keeps historical status as UI metadata without inventing a database status", () => {
    expect(source).toContain("Historical Event");
    expect(source).toContain("Tanggal event telah berlalu");
    expect(source).not.toContain('status: "HISTORICAL"');
  });
});