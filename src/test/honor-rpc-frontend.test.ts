import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const hookSource = read("src/hooks/useHonors.ts");
const analyticsSource = read("src/hooks/useAnalytics.ts");
const statisticsSource = hookSource.slice(
  hookSource.indexOf("export function useHonorStatistics"),
  hookSource.indexOf("// Get eligible events for honor submission"),
);

describe("honor frontend RPC contract", () => {
  it("uses canonical honor lifecycle RPCs instead of direct table mutation", () => {
    expect(hookSource).toContain('supabase.rpc("create_honor_draft"');
    expect(hookSource).toContain('supabase.rpc("update_honor_draft"');
    expect(hookSource).toContain('supabase.rpc("submit_honor"');
    expect(hookSource).toContain('supabase.rpc("delete_honor_draft"');
    expect(hookSource).toContain('supabase.rpc("verify_honor"');
    expect(hookSource).toContain('supabase.rpc("reject_honor"');
    expect(hookSource).not.toContain('.from("honors").insert');
    expect(hookSource).not.toContain('.from("honors").update');
    expect(hookSource).not.toContain('.from("honors").delete');
  });

  it("never sends client-controlled lifecycle fields", () => {
    expect(hookSource).not.toContain("referee_id: user.id");
    expect(hookSource).not.toContain('status: "submitted"');
    expect(hookSource).not.toContain("verified_by");
    expect(hookSource).not.toContain("verified_at");
    expect(hookSource).not.toContain("deleted_at:");
  });

  it("maps the canonical RPC arguments correctly", () => {
    expect(hookSource).toContain("p_event_id: event_id");
    expect(hookSource).toContain("p_amount: amount");
    expect(hookSource).toContain("p_notes: notes ?? null");
    expect(hookSource).toContain("p_honor_id: id");
    expect(hookSource).toContain("p_reason: reason");
  });

  it("keeps direct SELECT operations allowed while prohibiting mutation", () => {
    expect(hookSource).toContain('.from("honors").select');
    expect(hookSource).not.toContain('.from("honors").insert({');
    expect(hookSource).not.toContain('.from("honors").update({');
    expect(hookSource).not.toContain('.from("honors").delete()');
  });

  it("counts only active submitted records as pending honor", () => {
    expect(statisticsSource).toContain('.is("deleted_at", null)');
    expect(statisticsSource).toContain('honor.status === "submitted"');
    expect(statisticsSource).not.toContain('honor.status === "draft"');
    expect(analyticsSource).toContain('h.status === "submitted"');
    expect(analyticsSource).not.toContain('h.status === "PENDING"');
  });
});
