export const WHATSAPP_PROVIDERS = [
  "meta",
  "kirisan"
];
export function isWhatsAppProvider(value) {
  return typeof value === "string" && WHATSAPP_PROVIDERS.includes(value);
}
export function resolveWhatsAppProvider(value) {
  return isWhatsAppProvider(value) ? value : "meta";
}
