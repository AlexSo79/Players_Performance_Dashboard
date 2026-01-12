'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

const gameEventsSchema = z.object({
    player_id: z.string().min(1, 'Select a player'),
    match_id: z.string().min(1, 'Select a match'),
    position: z.string().optional(),

    // Numeric Stats (Defaults to 0)
    minutes_played: z.coerce.number().default(0),
    total_actions: z.coerce.number().default(0),
    successful_actions: z.coerce.number().default(0),
    goals: z.coerce.number().default(0),
    assists: z.coerce.number().default(0),
    shots_total: z.coerce.number().default(0),
    shots_on_target: z.coerce.number().default(0),
    expected_goals: z.coerce.number().default(0),
    passes_total: z.coerce.number().default(0),
    passes_accurate: z.coerce.number().default(0),
    long_balls_total: z.coerce.number().default(0),
    long_balls_accurate: z.coerce.number().default(0),
    crosses_total: z.coerce.number().default(0),
    crosses_accurate: z.coerce.number().default(0),
    dribbles_total: z.coerce.number().default(0),
    dribbles_successful: z.coerce.number().default(0),
    duels_total: z.coerce.number().default(0),
    duels_won: z.coerce.number().default(0),
    interceptions: z.coerce.number().default(0),
    possession_lost_total: z.coerce.number().default(0),
    possession_lost_own_half: z.coerce.number().default(0),
    recoveries_total: z.coerce.number().default(0),
    recoveries_opp_half: z.coerce.number().default(0),
    yellow_card_minute: z.coerce.number().default(0),
    red_card_minute: z.coerce.number().default(0),
    defensive_duels_total: z.coerce.number().default(0),
    defensive_duels_won: z.coerce.number().default(0),
    loose_ball_duels_total: z.coerce.number().default(0),
    loose_ball_duels_won: z.coerce.number().default(0),
    sliding_tackles_total: z.coerce.number().default(0),
    sliding_tackles_successful: z.coerce.number().default(0),
    clearances: z.coerce.number().default(0),
    fouls_committed: z.coerce.number().default(0),
    yellow_cards: z.coerce.number().default(0),
    red_cards: z.coerce.number().default(0),
    shot_assists: z.coerce.number().default(0),
    offensive_duels_total: z.coerce.number().default(0),
    offensive_duels_won: z.coerce.number().default(0),
    touches_in_box: z.coerce.number().default(0),
    offsides: z.coerce.number().default(0),
    progressive_runs: z.coerce.number().default(0),
    fouls_suffered: z.coerce.number().default(0),
    through_passes_total: z.coerce.number().default(0),
    through_passes_accurate: z.coerce.number().default(0),
    expected_assists: z.coerce.number().default(0),
    second_assists: z.coerce.number().default(0),
    passes_final_third_total: z.coerce.number().default(0),
    passes_final_third_accurate: z.coerce.number().default(0),
    passes_penalty_area_total: z.coerce.number().default(0),
    passes_penalty_area_accurate: z.coerce.number().default(0),
    passes_received: z.coerce.number().default(0),
    forward_passes_total: z.coerce.number().default(0),
    forward_passes_accurate: z.coerce.number().default(0),
    back_passes_total: z.coerce.number().default(0),
    back_passes_accurate: z.coerce.number().default(0),
})

type GameEventsFormValues = z.infer<typeof gameEventsSchema>

interface GameEventsFormProps {
    onSuccess?: () => void
    initialData?: Partial<GameEventsFormValues> & { id?: string; player_id?: string; match_id?: string; position?: string }
}

export function GameEventsForm({ onSuccess, initialData }: GameEventsFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [matches, setMatches] = useState<{ id: string; date: string; opponent: string }[]>([])
    const [players, setPlayers] = useState<{ id: string; full_name: string | null; email: string | null }[]>([])
    const supabase = React.useMemo(() => createClient(), [])
    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            const { data: matchesData } = await supabase
                .from('matches')
                .select('id, date, opponent')
                .order('date', { ascending: false })

            const { data: playersData } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name', { ascending: true })

            if (matchesData) setMatches(matchesData)
            if (playersData) setPlayers(playersData)
        }
        fetchData()
    }, [supabase])

    const form = useForm<GameEventsFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(gameEventsSchema) as any,
        defaultValues: {
            player_id: initialData?.player_id || '',
            match_id: initialData?.match_id || '',
            position: initialData?.position || '',
            ...Object.keys(gameEventsSchema.shape).reduce((acc, key) => {
                if (key !== 'player_id' && key !== 'match_id' && key !== 'position') {
                    // @ts-expect-error - dynamic key access
                    acc[key] = initialData?.[key] ?? 0
                }
                return acc
            }, {} as Record<string, number>) // Typed accumulator
        },
    })

    // DEBUG: Check permissions explicitly
    async function checkPermissions() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.error('No authenticated user found')
            return
        }
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        console.log('Current User Role:', profile?.role)
    }

    async function onSubmit(data: GameEventsFormValues) {
        setIsSubmitting(true)
        console.log('Submitting Payload:', data) // DEBUG: Check payload

        await checkPermissions() // DEBUG: Run permission check

        try {
            if (initialData?.id) {
                const { error } = await supabase
                    .from('game_events')
                    .update(data)
                    .eq('id', initialData.id)
                if (error) throw error
                toast.success('Game Event updated successfully')
            } else {
                const { error } = await supabase.from('game_events').insert(data)
                if (error) throw error
                toast.success('Game Event added successfully')
            }

            if (!initialData) form.reset()
            router.refresh()
            if (onSuccess) onSuccess()
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any // Temporary safe cast for existing logic
            console.error('Full Error Object:', JSON.stringify(err, null, 2))
            console.error('Error details:', {
                code: err?.code,
                message: err?.message,
                details: err?.details,
                hint: err?.hint
            })
            toast.error(err?.message || err?.details || 'Failed to save game event')
        } finally {
            setIsSubmitting(false)
        }
    }

    const renderField = (name: keyof GameEventsFormValues, label: string) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-xs">{label}</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="player_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Player</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select player" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {players.map((player) => (
                                            <SelectItem key={player.id} value={player.id}>
                                                {player.full_name || player.email || 'Unknown'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="match_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Match</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select match" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {matches.map((match) => (
                                            <SelectItem key={match.id} value={match.id}>
                                                {format(new Date(match.date), 'MM/dd')} vs {match.opponent}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Position</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. CF" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <h3 className="font-semibold border-b pb-1">Key Stats</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderField("minutes_played", "Minutes")}
                        {renderField("goals", "Goals")}
                        {renderField("assists", "Assists")}
                        {renderField("total_actions", "Total Actions")}
                    </div>

                    <h3 className="font-semibold border-b pb-1">Passing</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderField("passes_total", "Passes (Total)")}
                        {renderField("passes_accurate", "Passes (Acc)")}
                        {renderField("long_balls_total", "Long Balls (Total)")}
                        {renderField("long_balls_accurate", "Long Balls (Acc)")}
                        {renderField("crosses_total", "Crosses (Total)")}
                        {renderField("crosses_accurate", "Crosses (Acc)")}
                        {renderField("through_passes_total", "Through (Total)")}
                        {renderField("through_passes_accurate", "Through (Acc)")}
                        {renderField("forward_passes_total", "Forward (Total)")}
                        {renderField("forward_passes_accurate", "Forward (Acc)")}
                        {renderField("back_passes_total", "Back (Total)")}
                        {renderField("back_passes_accurate", "Back (Acc)")}
                        {renderField("passes_final_third_total", "Final 3rd (Total)")}
                        {renderField("passes_final_third_accurate", "Final 3rd (Acc)")}
                    </div>

                    <h3 className="font-semibold border-b pb-1">Shooting & Attack</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderField("shots_total", "Shots (Total)")}
                        {renderField("shots_on_target", "Shots (On Target)")}
                        {renderField("expected_goals", "xG")}
                        {renderField("expected_assists", "xA")}
                        {renderField("shot_assists", "Shot Assists")}
                        {renderField("second_assists", "2nd Assists")}
                        {renderField("dribbles_total", "Dribbles (Total)")}
                        {renderField("dribbles_successful", "Dribbles (Succ)")}
                        {renderField("touches_in_box", "Touches in Box")}
                        {renderField("progressive_runs", "Prog. Runs")}
                        {renderField("offsides", "Offsides")}
                    </div>

                    <h3 className="font-semibold border-b pb-1">Defensive</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderField("defensive_duels_total", "Def Duels (Total)")}
                        {renderField("defensive_duels_won", "Def Duels (Won)")}
                        {renderField("interceptions", "Interceptions")}
                        {renderField("clearances", "Clearances")}
                        {renderField("sliding_tackles_total", "Sliding (Total)")}
                        {renderField("sliding_tackles_successful", "Sliding (Succ)")}
                        {renderField("recoveries_total", "Recoveries")}
                        {renderField("recoveries_opp_half", "Rec (Opp Half)")}
                    </div>

                    <h3 className="font-semibold border-b pb-1">Discipline & Other</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderField("fouls_committed", "Fouls Comm.")}
                        {renderField("fouls_suffered", "Fouls Suff.")}
                        {renderField("yellow_cards", "Yellow Cards")}
                        {renderField("red_cards", "Red Cards")}
                        {renderField("yellow_card_minute", "Yellow Min")}
                        {renderField("red_card_minute", "Red Min")}
                    </div>

                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {initialData ? 'Updating...' : 'Saving...'}
                        </>
                    ) : (
                        initialData ? 'Update Game Event' : 'Save Game Event'
                    )}
                </Button>
            </form>
        </Form>
    )
}
