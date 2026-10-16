const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const WHATSAPP_SECRET_PROTECTION_ERROR = "WhatsApp secret protection is unavailable";

export function requireWhatsappEncryptionKey(keyMaterial: string | undefined): string {
  if (!keyMaterial?.trim()) {
    throw new Error(WHATSAPP_SECRET_PROTECTION_ERROR);
  }

  return keyMaterial;
}

function toBase64(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value));
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function importKey(keyMaterial: string, usage: KeyUsage): Promise<CryptoKey> {
  const keyBytes = encoder.encode(keyMaterial.padEnd(32, "0").slice(0, 32));
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, [usage]);
}

export async function encryptWhatsappSecret(secret: string, keyMaterial: string | undefined): Promise<string> {
  const key = await importKey(requireWhatsappEncryptionKey(keyMaterial), "encrypt");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(secret));
  const payload = new Uint8Array(iv.byteLength + new Uint8Array(ciphertext).byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(ciphertext), iv.byteLength);
  return toBase64(payload);
}

export async function decryptWhatsappSecret(ciphertext: string, keyMaterial: string | undefined): Promise<string> {
  const key = await importKey(requireWhatsappEncryptionKey(keyMaterial), "decrypt");
  const payload = fromBase64(ciphertext);
  const iv = payload.slice(0, 12);
  const encrypted = payload.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
  return decoder.decode(plaintext);
}