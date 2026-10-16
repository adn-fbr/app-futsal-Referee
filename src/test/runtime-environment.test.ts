import { describe, expect, it } from "vitest";
import { assertTestRuntime, TEST_PROJECT_ID } from "../../vite.config";

describe("runtime environment guard", () => {
  it("accepts the authorized TEST project in test mode", () => {
    expect(() =>
      assertTestRuntime({
        mode: "test",
        runtimeMode: "test",
        runtimeProjectId: TEST_PROJECT_ID,
        runtimeProjectRef: TEST_PROJECT_ID,
      })
    ).not.toThrow();
  });

  it("rejects the production project in test mode", () => {
    expect(() =>
      assertTestRuntime({
        mode: "test",
        runtimeMode: "test",
        runtimeProjectId: "xfscfjwapwnkiinkgbjg",
        runtimeProjectRef: "xfscfjwapwnkiinkgbjg",
      })
    ).toThrow(/authorized test Supabase project/i);
  });

  it("rejects an unknown project in test mode", () => {
    expect(() =>
      assertTestRuntime({
        mode: "test",
        runtimeMode: "test",
        runtimeProjectId: "unknown",
        runtimeProjectRef: null,
      })
    ).toThrow(/authorized test Supabase project/i);
  });

  it("preserves production development behavior", () => {
    expect(() =>
      assertTestRuntime({
        mode: "development",
        runtimeMode: "production",
        runtimeProjectId: "xfscfjwapwnkiinkgbjg",
        runtimeProjectRef: "xfscfjwapwnkiinkgbjg",
      })
    ).not.toThrow();
  });
});
