-- Add unique constraint to avoid duplicate stats for the same player in the same match
alter table performance_stats
add constraint performance_stats_player_match_unique unique (player_id, match_id);
