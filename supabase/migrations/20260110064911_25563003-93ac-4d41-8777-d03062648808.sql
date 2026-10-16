-- Rename kolom date menjadi start_date
ALTER TABLE public.events RENAME COLUMN date TO start_date;

-- Tambah kolom end_date
ALTER TABLE public.events ADD COLUMN end_date date;

-- Set end_date = start_date untuk data existing (default single day event)
UPDATE public.events SET end_date = start_date WHERE end_date IS NULL;

-- Set end_date sebagai NOT NULL setelah data di-update
ALTER TABLE public.events ALTER COLUMN end_date SET NOT NULL;

-- Tambah constraint untuk memastikan end_date >= start_date
ALTER TABLE public.events ADD CONSTRAINT check_end_date_after_start CHECK (end_date >= start_date);

-- Buat function untuk auto-complete events yang sudah lewat end_date
CREATE OR REPLACE FUNCTION public.auto_complete_past_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  completed_count integer;
  event_record record;
BEGIN
  -- Loop through events yang perlu di-complete
  FOR event_record IN 
    SELECT id, status 
    FROM public.events 
    WHERE status = 'DISETUJUI' 
      AND end_date < CURRENT_DATE 
      AND deleted_at IS NULL
  LOOP
    -- Update status ke SELESAI
    UPDATE public.events 
    SET status = 'SELESAI'
    WHERE id = event_record.id;
    
    -- Insert approval record
    INSERT INTO public.event_approvals (
      event_id, 
      action, 
      from_status, 
      to_status, 
      notes, 
      approved_by
    ) VALUES (
      event_record.id,
      'AUTO_COMPLETE',
      event_record.status,
      'SELESAI',
      'Event diselesaikan otomatis karena telah melewati tanggal selesai',
      NULL
    );
  END LOOP;
  
  GET DIAGNOSTICS completed_count = ROW_COUNT;
  RAISE NOTICE 'Auto-completed % events', completed_count;
END;
$$;

-- Buat trigger untuk auto-complete saat ada operasi pada events
CREATE OR REPLACE FUNCTION public.trigger_auto_complete_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call auto-complete function
  PERFORM public.auto_complete_past_events();
  RETURN NULL;
END;
$$;

-- Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS auto_complete_events_trigger ON public.events;

-- Buat trigger yang berjalan setelah INSERT atau UPDATE pada events
CREATE TRIGGER auto_complete_events_trigger
AFTER INSERT OR UPDATE ON public.events
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_auto_complete_events();