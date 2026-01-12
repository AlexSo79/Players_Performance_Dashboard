import { createClient } from '@/utils/supabase/server'
import { GameEventsView } from '@/components/player/game-events-view'
import { EmptyState } from '@/components/empty-state'
import { redirect } from 'next/navigation'

export default async function PlayerGameEventsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    const { data: events } = await supabase
        .from('game_events')
        .select(`
            *,
            matches(date, opponent, season, competition)
        `)
        .eq('player_id', user.id)

    // Sort events by date descending
    const sortedEvents = events?.sort((a, b) => {
        const dateA = new Date(a.matches?.date || 0).getTime();
        const dateB = new Date(b.matches?.date || 0).getTime();
        return dateB - dateA;
    }) || [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Game Events</h2>
                <p className="text-muted-foreground">
                    Goals, assists, and technical stats.
                </p>
            </div>

            {sortedEvents.length === 0 ? (
                <EmptyState
                    title="No Events Found"
                    description="No game events have been recorded for you yet."
                />
            ) : (
                <GameEventsView events={sortedEvents} />
            )}
        </div>
    )
}
