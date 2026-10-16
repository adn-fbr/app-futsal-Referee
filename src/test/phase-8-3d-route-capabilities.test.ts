import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const appSource = readFileSync(`${root}/src/App.tsx`, "utf8");
const eventDetailSource = readFileSync(`${root}/src/pages/EventDetail.tsx`, "utf8");

describe("F-001 assignment capability contract", () => {
  it("keeps the assignment route behind the existing admin guard", () => {
    const routeStart = appSource.indexOf('path="/events/:id/assign-referees"');
    const routeBlock = appSource.slice(routeStart, routeStart + 260);

    expect(routeStart).toBeGreaterThanOrEqual(0);
    expect(routeBlock).toContain("requireAdmin");
  });

  it("does not expose the assignment CTA to non-admin event roles", () => {
    expect(eventDetailSource).toContain('const canAssignReferees = isAdmin() && event.status === "DISETUJUI";');
  });
});
