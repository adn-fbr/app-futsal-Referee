export const WHATSAPP_INTERNAL_ERROR = "Unable to process WhatsApp configuration";

export function internalWhatsappErrorResponse(
  corsHeaders: HeadersInit,
): Response {
  return new Response(
    JSON.stringify({ success: false, error: WHATSAPP_INTERNAL_ERROR }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}