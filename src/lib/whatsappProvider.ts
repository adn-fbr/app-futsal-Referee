export const WHATSAPP_PROVIDERS = ["meta", "kirisan"] as const;

export type WhatsAppProvider = (typeof WHATSAPP_PROVIDERS)[number];

export function isWhatsAppProvider(value: unknown): value is WhatsAppProvider {
  return typeof value === "string" && WHATSAPP_PROVIDERS.includes(value as WhatsAppProvider);
}

export function resolveWhatsAppProvider(value: unknown): WhatsAppProvider {
  return isWhatsAppProvider(value) ? value : "meta";
}
