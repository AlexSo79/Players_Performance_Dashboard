-- Migration to update performance_stats table with new metrics
-- DROP old columns
alter table performance_stats
drop column if exists distance_km,
drop column if exists top_speed_kmh,
drop column if exists sprints,
drop column if exists minutes_played,
drop column if exists goals,
drop column if exists assists,
drop column if exists shots,
drop column if exists passes_completed,
drop column if exists passes_attempted,
drop column if exists xg;

-- ADD new columns
alter table performance_stats
add column if not exists mins numeric,
add column if not exists dur numeric,

-- Kinematic (Distance & Speed)
add column if not exists dist_tot numeric,
add column if not exists dist_rel numeric,
add column if not exists dist_15_18_kmh_speed numeric,
add column if not exists dist_16_20_kmh_speed numeric,
add column if not exists dist_18_21_kmh_speed numeric,
add column if not exists dist_20_24_kmh_speed numeric,
add column if not exists dist_21_25_kmh_speed numeric,
add column if not exists dist_great_14_4_kmh_speed numeric,
add column if not exists dist_great_16_kmh_speed numeric,
add column if not exists dist_great_18_kmh_speed numeric,
add column if not exists dist_great_20_kmh_speed numeric,
add column if not exists dist_great_21_kmh_speed numeric,
add column if not exists dist_great_24_kmh_speed numeric,
add column if not exists dist_great_25_kmh_speed numeric,
add column if not exists dist_hi_int_mins numeric,
add column if not exists dist_great_16_kmh_speed_mins numeric,
add column if not exists dist_great_24_kmh_speed_mins numeric,

-- Sprints & High Speed
add column if not exists dist_sprint numeric,
add column if not exists dist_high_speed_run numeric,
add column if not exists speed_max numeric,
add column if not exists acc_num_great_25_kmh_speed integer, 
add column if not exists dist_tot_percent_15_18_kmh_speed numeric,
add column if not exists dist_tot_percent_18_21_kmh_speed numeric,
add column if not exists dist_tot_percent_21_25_kmh_speed numeric,
add column if not exists dist_tot_percent_great_16_kmh_speed numeric,
add column if not exists dist_tot_percent_hi_int_sprint numeric,

-- Accelerations
add column if not exists acc_max_2_5_ms_square numeric,
add column if not exists acc_num_great_2_5_ms_square integer,
add column if not exists acc_num_great_3_ms_square integer,
add column if not exists acc_num_great_3_5_ms_square integer,
add column if not exists acc_hi_num integer,
add column if not exists dist_acc_great_2_5_ms_square numeric,
add column if not exists dist_acc_great_3_5_ms_square numeric,
add column if not exists dist_acc_hi_int_mins numeric,
add column if not exists dist_tot_percent_hi_int_acc numeric,

-- Time in Acc/Dec Zones
add column if not exists time_acc_zones_0_1_ms_square integer,
add column if not exists time_acc_zones_1_2_ms_square integer,
add column if not exists time_acc_zones_2_3_ms_square integer,
add column if not exists time_acc_zones_3_4_ms_square integer,
add column if not exists time_acc_zones_great_4_ms_square integer,

-- Decelerations
add column if not exists dec_max_2_5_ms_square numeric,
add column if not exists dec_num_great_2_5_ms_square integer,
add column if not exists dec_num_great_3_ms_square integer,
add column if not exists dec_num_great_3_5_ms_square integer,
add column if not exists dec_num_small_3_ms_square integer,
add column if not exists dec_hi_num integer,
add column if not exists dist_dec_great_2_5_ms_square numeric,
add column if not exists dist_dec_great_3_5_ms_square numeric,
add column if not exists dist_dec_hi_int_mins numeric,
add column if not exists dist_tot_percent_hi_int_dec numeric,
add column if not exists time_dec_zones_0_1_ms_square integer,
add column if not exists time_dec_zones_1_2_ms_square integer,
add column if not exists time_dec_zones_2_3_ms_square integer,

-- Physiological / Power / Load
add column if not exists training_load numeric,
add column if not exists work_ratio numeric,
add column if not exists player_load numeric,
add column if not exists workload_score numeric,
add column if not exists workload_perceived numeric,
add column if not exists workload_kinematic numeric,
add column if not exists workload_cardio numeric,
add column if not exists eq_ext_energy numeric,
add column if not exists mp_avg numeric,
add column if not exists ai_percent numeric,
add column if not exists imbalance numeric,
add column if not exists time_recovery_per_mins numeric,

-- Metabolic Power Distances
add column if not exists dist_eq numeric,
add column if not exists dist_rel_eq numeric,
add column if not exists dist_power numeric,
add column if not exists dist_high_power numeric,
add column if not exists dist_expl numeric,
add column if not exists dist_hi_int_mp numeric,
add column if not exists dist_hi_int_mp_mins numeric,
add column if not exists dist_great_25_w_kg integer,
add column if not exists dist_tot_percent_hi_int_mp numeric,
add column if not exists dist_eq_percent numeric,

-- Power Plays
add column if not exists power_plays integer,
add column if not exists power_plays_num integer,
add column if not exists power_score numeric,
add column if not exists power_play_dur_zones_2_5_5_s integer,
add column if not exists power_play_dur_zones_5_7_5_s integer,
add column if not exists power_play_dur_zones_7_5_10_s integer,
add column if not exists power_play_dur_zones_great_10_s integer,

-- Time in Power Zones
add column if not exists time_power_zone_0_5_w_kg integer,
add column if not exists time_power_zone_5_10_w_kg integer,
add column if not exists time_power_zone_10_15_w_kg integer,
add column if not exists time_power_zone_15_20_w_kg integer,
add column if not exists time_power_zone_20_25_w_kg integer,
add column if not exists time_power_zone_25_30_w_kg integer,
add column if not exists time_power_zone_30_35_w_kg integer,
add column if not exists time_power_zone_35_40_w_kg integer,
add column if not exists time_power_zone_40_45_w_kg integer,
add column if not exists time_power_zone_45_50_w_kg integer,
add column if not exists time_power_zone_great_50_w_kg integer,
add column if not exists hi_num_great_20_w_kg integer,

-- Heart Rate
add column if not exists hr_85_90 numeric,
add column if not exists hr_great_90 numeric,
add column if not exists time_hr_load_zone_0_60_percent_max integer,
add column if not exists time_hr_load_zone_60_75_percent_max integer,
add column if not exists time_hr_load_zone_75_85_percent_max integer,
add column if not exists time_hr_load_zone_85_96_percent_max integer,
add column if not exists time_hr_load_zone_96_100_percent_max integer,

-- Speed Zones (Time)
add column if not exists time_speed_zone_1 integer,
add column if not exists time_speed_zone_2 integer,
add column if not exists time_speed_zone_3 integer,
add column if not exists time_speed_zone_4 integer,
add column if not exists time_speed_zone_5 integer,

-- Vmax %
add column if not exists dist_80_percent_max_speed numeric,
add column if not exists dist_90_percent_max_speed numeric;
