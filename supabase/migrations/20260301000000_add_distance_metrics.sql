-- Add new distance metrics to performance_stats

ALTER TABLE performance_stats
ADD COLUMN IF NOT EXISTS distance_over_16_kmh numeric,
ADD COLUMN IF NOT EXISTS pct_distance_over_16_kmh numeric,
ADD COLUMN IF NOT EXISTS distance_over_24_kmh numeric,
ADD COLUMN IF NOT EXISTS distance_over_16_kmh_min numeric,
ADD COLUMN IF NOT EXISTS distance_over_24_kmh_min numeric;
