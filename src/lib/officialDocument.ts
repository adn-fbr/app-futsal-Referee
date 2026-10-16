const cryptoLib = globalThis.crypto;

export type OfficialDocumentStatus = "issued" | "revoked";

export type OfficialDocumentVerificationStatus =
  | "issued"
  | "revoked"
  | "not_found"
  | "integrity_failed";

export function canonicalizeDocumentPayload(payload: Record<string, unknown>): string {
  return JSON.stringify(payload, Object.keys(payload).sort(), 2);
}

export async function computeDocumentHash(payload: Record<string, unknown>): Promise<string> {
  if (!cryptoLib || !("subtle" in cryptoLib)) {
    throw new Error("Web Crypto API is unavailable in this runtime.");
  }

  const canonical = canonicalizeDocumentPayload(payload);
  const encoded = new TextEncoder().encode(canonical);
  const digest = await cryptoLib.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function summarizePublicVerificationStatus(status: string | null): {
  valid: boolean;
  status: OfficialDocumentVerificationStatus;
  message: string;
} {
  switch (status) {
    case "issued":
      return { valid: true, status: "issued", message: "Dokumen valid dan diterbitkan secara resmi." };
    case "revoked":
      return { valid: false, status: "revoked", message: "Dokumen telah dicabut." };
    case "integrity_failed":
      return { valid: false, status: "integrity_failed", message: "Integritas dokumen gagal diverifikasi." };
    case "not_found":
    default:
      return { valid: false, status: "not_found", message: "Dokumen tidak ditemukan." };
  }
}

export function buildOfficialDocumentNumber(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(6, "0")}`;
}

export function generateVerificationToken(): string {
  if (!cryptoLib || !("getRandomValues" in cryptoLib)) {
    return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  const bytes = new Uint8Array(24);
  cryptoLib.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
