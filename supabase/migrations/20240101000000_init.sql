-- 1. Enum for Roles
create type user_role as enum ('admin', 'player');

-- 2. Profiles Table (Private Profile Data + Role)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  role user_role default 'player',
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Matches Table
create table matches (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  opponent text not null,
  result text,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Performance Stats Table
create table performance_stats (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references profiles(id) not null,
  match_id uuid references matches(id) not null,
  
  -- Physical
  distance_km numeric,
  top_speed_kmh numeric,
  sprints integer,
  
  -- Game Events
  minutes_played integer,
  goals integer,
  assists integer,
  shots integer,
  passes_completed integer,
  passes_attempted integer,
  xg numeric,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Financials Table (Strictest RLS)
create table financials (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references profiles(id) not null,
  
  salary_per_year numeric,
  contract_expiry date,
  market_value numeric,
  transfer_fee numeric,
  
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Health Monitoring Stats
create table health_monitoring_stats (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references profiles(id) not null,
  date date default CURRENT_DATE,
  
  injury_status text, -- e.g., 'Fit', 'Injured', 'Recovery'
  fatigue_level integer, -- 1-10 scale
  sleep_hours numeric,
  notes text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;
alter table matches enable row level security;
alter table performance_stats enable row level security;
alter table financials enable row level security;
alter table health_monitoring_stats enable row level security;

-- Helper function
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- PROFILES Policies
-- STRICT: No "public" view.
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Admins can view all profiles"
  on profiles for select
  using ( is_admin() );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );
  
create policy "Admins can update all profiles"
  on profiles for update
  using ( is_admin() );

-- MATCHES Policies
create policy "Matches are viewable by authenticated users"
  on matches for select
  to authenticated
  using ( true );

create policy "Admins can insert/update/delete matches"
  on matches for all
  using ( is_admin() );

-- PERFORMANCE STATS Policies
create policy "Players can view their own stats"
  on performance_stats for select
  to authenticated
  using ( auth.uid() = player_id );

create policy "Admins can view all stats"
  on performance_stats for select
  to authenticated
  using ( is_admin() );

create policy "Admins can insert/update/delete stats"
  on performance_stats for all
  using ( is_admin() );

-- FINANCIALS Policies
-- STRICT: Only Admin can view.
create policy "Admins can view all financials"
  on financials for select
  to authenticated
  using ( is_admin() );

create policy "Admins can insert/update/delete financials"
  on financials for all
  using ( is_admin() );

-- HEALTH STATS Policies
create policy "Players can view their own health stats"
  on health_monitoring_stats for select
  to authenticated
  using ( auth.uid() = player_id );

create policy "Admins can view all health stats"
  on health_monitoring_stats for select
  to authenticated
  using ( is_admin() );

create policy "Admins can insert/update/delete health stats"
  on health_monitoring_stats for all
  using ( is_admin() );
