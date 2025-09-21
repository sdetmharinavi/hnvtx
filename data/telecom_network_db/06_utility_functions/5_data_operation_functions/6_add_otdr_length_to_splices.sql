-- path: migrations/add_otdr_length_to_splices.sql

ALTER TABLE public.fiber_splices
ADD COLUMN IF NOT EXISTS otdr_length_km NUMERIC(10, 3);

COMMENT ON COLUMN public.fiber_splices.otdr_length_km IS 'The measured OTDR distance in kilometers for the incoming fiber arriving at this splice.';