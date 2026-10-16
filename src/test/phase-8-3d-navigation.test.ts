import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(`${process.cwd()}/src/components/layout/MobileNav.tsx`, "utf8");

describe("F-002 and F-003 mobile navigation contracts", () => {
  it("targets the registered export route", () => {
    expect(source).toContain('label: "Export Database", path: "/export"');
    expect(source).not.toContain("/database-export");
  });

  it("keeps approval navigation only in the Admin Provinsi branch", () => {
    const adminProvinsiBranch = source.slice(source.indexOf("isAdminProvinsi() ? ["), source.indexOf(" : ["));
    const nonProvinsiBranch = source.slice(source.indexOf(" : ["), source.indexOf("    ...(isAdmin()"));

    expect(adminProvinsiBranch).toContain('path: "/approvals"');
    expect(nonProvinsiBranch).not.toContain('path: "/approvals"');
  });
});
