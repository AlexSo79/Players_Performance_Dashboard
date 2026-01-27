-- Add new columns to performance_stats table

ALTER TABLE performance_stats 
ADD COLUMN IF NOT EXISTS player_load numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS distance_over_14_4_kmh numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS distance_over_21_kmh numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS number_acc_over_3_ms numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS number_dec_under_minus_3_ms numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS distance_over_25_w_kg numeric DEFAULT 0;
