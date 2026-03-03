-- 1. Add total_budget to financials
ALTER TABLE financials 
ADD COLUMN IF NOT EXISTS total_budget numeric DEFAULT 0;

-- 2. Create player_services table
CREATE TABLE IF NOT EXISTS player_services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id uuid REFERENCES profiles(id) NOT NULL,
    service_name text NOT NULL,
    cost numeric NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'Active', -- e.g., 'Active', 'Completed', 'Pending'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE player_services ENABLE ROW LEVEL SECURITY;

-- 3. Update RLS Policies for Financials
-- Allow Players to VIEW their own financial records (Read-Only)
CREATE POLICY "Players can view own financials"
    ON financials FOR SELECT
    TO authenticated
    USING ( auth.uid() = player_id );

-- 4. RLS Policies for Player Services
-- Players can VIEW their own services
CREATE POLICY "Players can view own services"
    ON player_services FOR SELECT
    TO authenticated
    USING ( auth.uid() = player_id );

-- Admins can VIEW all services
CREATE POLICY "Admins can view all services"
    ON player_services FOR SELECT
    TO authenticated
    USING ( is_admin() );

-- Admins can MANAGE all services (Insert, Update, Delete)
CREATE POLICY "Admins can insert services"
    ON player_services FOR INSERT
    TO authenticated
    WITH CHECK ( is_admin() );

CREATE POLICY "Admins can update services"
    ON player_services FOR UPDATE
    TO authenticated
    USING ( is_admin() );

CREATE POLICY "Admins can delete services"
    ON player_services FOR DELETE
    TO authenticated
    USING ( is_admin() );
