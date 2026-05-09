
ALTER TABLE public.sediver_submissions
  ADD COLUMN IF NOT EXISTS num_servicio text,
  ADD COLUMN IF NOT EXISTS comentarios text,
  ADD COLUMN IF NOT EXISTS oficio_cfe text,
  ADD COLUMN IF NOT EXISTS dias text,
  ADD COLUMN IF NOT EXISTS primera_visita date,
  ADD COLUMN IF NOT EXISTS segunda_visita date,
  ADD COLUMN IF NOT EXISTS tercera_visita date;
