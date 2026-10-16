-- Self-service referee WhatsApp contact management.
-- Restricts contact updates to the authenticated referee's own row and enforces canonical format.

ALTER TABLE public.referee_contacts
  DROP CONSTRAINT IF EXISTS referee_contacts_whatsapp_number_format;

ALTER TABLE public.referee_contacts
  ADD CONSTRAINT referee_contacts_whatsapp_number_format
  CHECK (whatsapp_number ~ '^62[0-9]{9,13}$');

CREATE POLICY "Referees can view their own whatsapp contact"
  ON public.referee_contacts
  FOR SELECT
  USING ((auth.uid() = referee_id) AND public.has_role(auth.uid(), 'wasit'::public.app_role));

CREATE POLICY "Referees can insert their own whatsapp contact"
  ON public.referee_contacts
  FOR INSERT
  WITH CHECK ((auth.uid() = referee_id) AND public.has_role(auth.uid(), 'wasit'::public.app_role));

CREATE POLICY "Referees can update their own whatsapp contact"
  ON public.referee_contacts
  FOR UPDATE
  USING ((auth.uid() = referee_id) AND public.has_role(auth.uid(), 'wasit'::public.app_role))
  WITH CHECK ((auth.uid() = referee_id) AND public.has_role(auth.uid(), 'wasit'::public.app_role));

CREATE POLICY "Referees can delete their own whatsapp contact"
  ON public.referee_contacts
  FOR DELETE
  USING ((auth.uid() = referee_id) AND public.has_role(auth.uid(), 'wasit'::public.app_role));
