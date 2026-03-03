import { createClient } from '@/utils/supabase/server'
import { OverviewView } from '@/components/player/overview-view'
import { EmptyState } from '@/components/empty-state'
import { redirect } from 'next/navigation'

export default async function OverviewDashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    const { data: stats } = await supabase
        .from('performance_stats')
        .select(`
    *,
    matches(date, opponent, season, competition)
        `)
        .eq('player_id', user.id)


    // Sort stats by date descending (Newest first)
    const sortedStats = stats?.sort((a, b) => {
        const dateA = new Date(a.matches?.date || 0).getTime();
        const dateB = new Date(b.matches?.date || 0).getTime();
        return dateB - dateA;
    }) || [];

    const { data: health } = await supabase
        .from('health_monitoring_stats')
        .select('*')
        .eq('player_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single()

    const { data: gameEvents } = await supabase
        .from('game_events')
        .select(`
        *,
        matches(date, opponent, season, competition)
        `)
        .eq('player_id', user.id)

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                <p className="text-muted-foreground">
                    Your season at a glance.
                </p>
            </div>

            {sortedStats.length === 0 ? (
                <EmptyState
                    title="No Stats Found"
                    description="You haven't played any matches yet, or the admin hasn't entered your data."
                />
            ) : (
                <OverviewView stats={sortedStats} health={health} gameEvents={gameEvents || []} />
            )}
        </div>
    )
}
