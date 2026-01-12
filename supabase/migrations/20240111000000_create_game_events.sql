-- Create Game Events Table
create table game_events (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references profiles(id) not null,
  match_id uuid references matches(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Metadata
  position text,

  -- Numeric Stats
  minutes_played numeric,
  total_actions numeric,
  successful_actions numeric,
  goals numeric,
  assists numeric,
  shots_total numeric,
  shots_on_target numeric,
  expected_goals numeric,
  passes_total numeric,
  passes_accurate numeric,
  long_balls_total numeric,
  long_balls_accurate numeric,
  crosses_total numeric,
  crosses_accurate numeric,
  dribbles_total numeric,
  dribbles_successful numeric,
  duels_total numeric,
  duels_won numeric,
  interceptions numeric,
  possession_lost_total numeric,
  possession_lost_own_half numeric,
  recoveries_total numeric,
  recoveries_opp_half numeric,
  yellow_card_minute numeric,
  red_card_minute numeric,
  defensive_duels_total numeric,
  defensive_duels_won numeric,
  loose_ball_duels_total numeric,
  loose_ball_duels_won numeric,
  sliding_tackles_total numeric,
  sliding_tackles_successful numeric,
  clearances numeric,
  fouls_committed numeric,
  yellow_cards numeric,
  red_cards numeric,
  shot_assists numeric,
  offensive_duels_total numeric,
  offensive_duels_won numeric,
  touches_in_box numeric,
  offsides numeric,
  progressive_runs numeric,
  fouls_suffered numeric,
  through_passes_total numeric,
  through_passes_accurate numeric,
  expected_assists numeric,
  second_assists numeric,
  passes_final_third_total numeric,
  passes_final_third_accurate numeric,
  passes_penalty_area_total numeric,
  passes_penalty_area_accurate numeric,
  passes_received numeric,
  forward_passes_total numeric,
  forward_passes_accurate numeric,
  back_passes_total numeric,
  back_passes_accurate numeric
);

-- Enable RLS
alter table game_events enable row level security;

-- Policies
create policy "Admins can view all game events"
  on game_events for select
  to authenticated
  using ( is_admin() );

create policy "Admins can insert/update/delete game events"
  on game_events for all
  using ( is_admin() );

create policy "Players can view their own game events"
  on game_events for select
  to authenticated
  using ( auth.uid() = player_id );
