-- Add document_path column to events table for storing document path
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS document_path TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.events.document_path IS 'Path ke file surat permohonan di storage bucket documents';

-- Add storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND (
  public.is_admin_provinsi(auth.uid()) 
  OR public.has_role(auth.uid(), 'admin_kab_kota'::public.app_role)
));