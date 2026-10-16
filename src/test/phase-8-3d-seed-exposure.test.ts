import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const appSource = readFileSync(`${root}/src/App.tsx`, "utf8");
const pageSource = readFileSync(`${root}/src/pages/DatabaseExport.tsx`, "utf8");
const seedHookSource = readFileSync(`${root}/src/hooks/useSeedDatabase.ts`, "utf8");

describe("F-007 production seed-data exposure contract", () => {
  it("F007-001 protects the export route for Admin Provinsi only", () => {
    expect(appSource).toContain('path="/export"');
    expect(appSource).toContain('requireRole="admin_provinsi"');
  });

  it("F007-002 keeps direct export-page access free of seed invocation", () => {
    expect(pageSource).not.toMatch(/useSeedDatabase|seedDatabase|seed-database|Generate Seed Data/);
  });

  it("F007-003 excludes the seed hook from the production page dependency path", () => {
    expect(pageSource).not.toContain("useSeedDatabase");
    expect(pageSource).not.toContain("@/hooks/useSeedDatabase");
  });

  it("F007-004 preserves legitimate export and import functionality", () => {
    expect(pageSource).toContain("useExportDatabase");
    expect(pageSource).toContain("useImportDatabase");
    expect(pageSource).toContain('value="export"');
    expect(pageSource).toContain('value="import"');
  });

  it("F007-005 leaves seed generation isolated from normal production page flow", () => {
    expect(pageSource).not.toContain("SEED_DATA_SUMMARY");
    expect(pageSource).not.toContain("Generate Data Testing");
    expect(seedHookSource).toContain("seed-database");
  });
});
