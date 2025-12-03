-- drizzle/migrations/0002_transparency_score.sql

ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS transparency_score numeric(12,4) NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.recalculate_transparency_score(p_license_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_private_batches bigint;
  v_created_at timestamptz;
  v_days_active numeric;
  v_score numeric;
BEGIN
  SELECT COUNT(*) INTO v_total_private_batches
  FROM public.batches b
  JOIN public.licenses l ON l.id = b.license_id
  WHERE b.license_id = p_license_id
    AND l.visibility = 'private';

  SELECT created_at INTO v_created_at
  FROM public.licenses
  WHERE id = p_license_id;

  IF v_created_at IS NULL THEN
    v_days_active := 1;
  ELSE
    v_days_active := GREATEST(EXTRACT(EPOCH FROM (now() - v_created_at)) / 86400.0, 1);
  END IF;

  v_score := LN(1 + COALESCE(v_total_private_batches, 0)) * (v_days_active / 365.0);

  UPDATE public.licenses
  SET transparency_score = COALESCE(v_score, 0)
  WHERE id = p_license_id;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_transparency_score_on_batches ON public.batches;

CREATE TRIGGER trg_recalc_transparency_score_on_batches
AFTER INSERT ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_transparency_score(NEW.license_id);
