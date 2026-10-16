export function normalizeRefereeContactNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D+/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("0")) {
    normalized = `62${normalized.slice(1)}`;
  }

  if (normalized.startsWith("+62")) {
    normalized = `62${normalized.slice(3)}`;
  }

  if (!/^62\d{9,13}$/.test(normalized)) {
    return null;
  }

  return normalized;
}
