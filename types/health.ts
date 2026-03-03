export interface HealthStats {
    id: string
    player_id: string
    date: string
    injury_status: string | null
    fatigue_level: number | null
    sleep_hours: number | null
    hrv: number | null
    rhr: number | null
    strain: number | null
    notes: string | null
    created_at: string
}
