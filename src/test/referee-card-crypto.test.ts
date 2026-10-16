import { afterEach, describe, expect, it, vi } from "vitest";
import { generateVerificationCode } from "@/hooks/useRefereeCard";

describe("generateVerificationCode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses randomUUID when available", () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "550e8400-e29b-41d4-a716-446655440000"),
    });

    const code = generateVerificationCode();

    expect(code).toBe("550e8400e29b41d4a716446655440000");
    expect(code).toHaveLength(32);
    expect(code).toMatch(/^[0-9a-f]{32}$/);
  });

  it("uses getRandomValues when randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: vi.fn((bytes: Uint8Array) => {
        bytes.fill(0xab);
        return bytes;
      }),
    });

    const code = generateVerificationCode();

    expect(code).toBe("ab".repeat(16));
    expect(code).toHaveLength(32);
    expect(code).toMatch(/^[0-9a-f]{32}$/);
  });

  it("normally produces different values", () => {
    const first = generateVerificationCode();
    const second = generateVerificationCode();

    expect(first).toHaveLength(32);
    expect(second).toHaveLength(32);
    expect(first).toMatch(/^[0-9a-f]{32}$/);
    expect(second).toMatch(/^[0-9a-f]{32}$/);
    expect(first).not.toBe(second);
  });

  it("fails closed when secure randomness is unavailable", () => {
    vi.stubGlobal("crypto", undefined);

    expect(() => generateVerificationCode()).toThrow(
      "Secure random number generation is unavailable in this runtime.",
    );
  });
});