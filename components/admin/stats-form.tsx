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

const statsSchema = z.object({
    player_id: z.string().min(1, 'Select a player'),
    match_id: z.string().min(1, 'Select a match'),

    // General
    minutes: z.coerce.number().default(90),
    total_distance: z.coerce.number().default(0),
    distance_min: z.coerce.number().default(0),
    max_speed: z.coerce.number().default(0),

    // Load & Efficiency
    training_load: z.coerce.number().default(0),
    strength_index: z.coerce.number().default(0),
    eee: z.coerce.number().default(0),
    amp: z.coerce.number().default(0),
    equivalent_relative_distance: z.coerce.number().default(0),
    pct_equivalent_relative_distance: z.coerce.number().default(0),
    pct_ai: z.coerce.number().default(0),

    // High Intensity
    distance_over_20_kmh: z.coerce.number().default(0),
    distance_over_25_kmh: z.coerce.number().default(0),
    number_acc_over_25_kmh: z.coerce.number().default(0),
    distance_hi_min: z.coerce.number().default(0),
    pct_distance_sprint_hi: z.coerce.number().default(0),

    // Accelerations
    distance_acc_over_2_5_ms: z.coerce.number().default(0),
    distance_dec_over_2_5_ms: z.coerce.number().default(0),
    distance_acc_hi_min: z.coerce.number().default(0),
    distance_dece_hi_min: z.coerce.number().default(0),
    pct_distance_acc_hi: z.coerce.number().default(0),
    pct_distance_dec_hi: z.coerce.number().default(0),

    // Other
    distance_mphi: z.coerce.number().default(0),
    pct_distance_mphi: z.coerce.number().default(0),
    distance_over_80_pct_max_speed: z.coerce.number().default(0),
    distance_over_90_pct_max_speed: z.coerce.number().default(0),
})

type StatsFormValues = z.infer<typeof statsSchema>

interface StatsFormProps {
    onSuccess?: () => void
    initialData?: Partial<StatsFormValues> & { id?: string; player_id?: string; match_id?: string }
}

export function StatsForm({ onSuccess, initialData }: StatsFormProps) {
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

    const form = useForm<StatsFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(statsSchema) as any,
        defaultValues: {
            player_id: initialData?.player_id || '',
            match_id: initialData?.match_id || '',
            minutes: initialData?.minutes ?? 90,
            total_distance: initialData?.total_distance ?? 0,
            distance_min: initialData?.distance_min ?? 0,
            max_speed: initialData?.max_speed ?? 0,
            training_load: initialData?.training_load ?? 0,
            strength_index: initialData?.strength_index ?? 0,
            eee: initialData?.eee ?? 0,
            amp: initialData?.amp ?? 0,
            equivalent_relative_distance: initialData?.equivalent_relative_distance ?? 0,
            pct_equivalent_relative_distance: initialData?.pct_equivalent_relative_distance ?? 0,
            pct_ai: initialData?.pct_ai ?? 0,
            distance_over_20_kmh: initialData?.distance_over_20_kmh ?? 0,
            distance_over_25_kmh: initialData?.distance_over_25_kmh ?? 0,
            number_acc_over_25_kmh: initialData?.number_acc_over_25_kmh ?? 0,
            distance_hi_min: initialData?.distance_hi_min ?? 0,
            pct_distance_sprint_hi: initialData?.pct_distance_sprint_hi ?? 0,
            distance_acc_over_2_5_ms: initialData?.distance_acc_over_2_5_ms ?? 0,
            distance_dec_over_2_5_ms: initialData?.distance_dec_over_2_5_ms ?? 0,
            distance_acc_hi_min: initialData?.distance_acc_hi_min ?? 0,
            distance_dece_hi_min: initialData?.distance_dece_hi_min ?? 0,
            pct_distance_acc_hi: initialData?.pct_distance_acc_hi ?? 0,
            pct_distance_dec_hi: initialData?.pct_distance_dec_hi ?? 0,
            distance_mphi: initialData?.distance_mphi ?? 0,
            pct_distance_mphi: initialData?.pct_distance_mphi ?? 0,
            distance_over_80_pct_max_speed: initialData?.distance_over_80_pct_max_speed ?? 0,
            distance_over_90_pct_max_speed: initialData?.distance_over_90_pct_max_speed ?? 0,
        },
    })

    async function onSubmit(data: StatsFormValues) {
        setIsSubmitting(true)
        try {
            if (initialData?.id) {
                const { error } = await supabase
                    .from('performance_stats')
                    .update(data)
                    .eq('id', initialData.id)
                if (error) throw error
                toast.success('Stats updated successfully')
            } else {
                const { error } = await supabase.from('performance_stats').insert(data)
                if (error) throw error
                toast.success('Stats added successfully')
            }

            form.reset()
            router.refresh()
            if (onSuccess) onSuccess()
        } catch (error: unknown) {
            const err = error as Error
            console.error('Error saving stats:', JSON.stringify(err, null, 2))
            toast.error(err.message || 'Failed to save stats')
        } finally {
            setIsSubmitting(false)
        }
    }

    const renderField = (name: keyof StatsFormValues, label: string, step = "0.01") => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-xs">{label}</FormLabel>
                    <FormControl>
                        <Input type="number" step={step} {...field} />
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
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-1">General</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderField("minutes", "Minutes", "1")}
                        {renderField("total_distance", "Total Dist (m)", "1")}
                        {renderField("distance_min", "Dist/Min (m/min)")}
                        {renderField("max_speed", "Max Speed (km/h)", "0.1")}
                    </div>

                    <h3 className="font-semibold border-b pb-1">Load & Efficiency</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {renderField("training_load", "Training Load")}
                        {renderField("strength_index", "Strength Index")}
                        {renderField("eee", "EEE (kJ)", "1")}
                        {renderField("amp", "AMP (W/kg)")}
                        {renderField("equivalent_relative_distance", "Eq. Rel. Dist")}
                        {renderField("pct_equivalent_relative_distance", "% Eq. Rel. Dist")}
                        {renderField("pct_ai", "Anaerobic Index %")}
                    </div>

                    <h3 className="font-semibold border-b pb-1">High Intensity</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {renderField("distance_over_20_kmh", "Dist > 20km/h")}
                        {renderField("distance_over_25_kmh", "Dist > 25km/h")}
                        {renderField("number_acc_over_25_kmh", "# Acc > 2.5", "1")}
                        {renderField("distance_hi_min", "HI Dist/Min")}
                        {renderField("pct_distance_sprint_hi", "% Sprint of HI")}
                        {renderField("distance_mphi", "Dist MP HI")}
                        {renderField("pct_distance_mphi", "% Dist MP HI")}
                    </div>

                    <h3 className="font-semibold border-b pb-1">Accelerations</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {renderField("distance_acc_over_2_5_ms", "Acc Dist (>2.5)")}
                        {renderField("distance_dec_over_2_5_ms", "Dec Dist (>2.5)")}
                        {renderField("distance_acc_hi_min", "Acc HI/Min")}
                        {renderField("distance_dece_hi_min", "Dec HI/Min")}
                        {renderField("pct_distance_acc_hi", "% Acc HI")}
                        {renderField("pct_distance_dec_hi", "% Dec HI")}
                    </div>

                    <h3 className="font-semibold border-b pb-1">Thresholds</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {renderField("distance_over_80_pct_max_speed", "Dist > 80% Max")}
                        {renderField("distance_over_90_pct_max_speed", "Dist > 90% Max")}
                    </div>
                </div>

                {!initialData && (
                    <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        <p>
                            <strong>Note:</strong> You can also use <strong>Bulk Import</strong> to upload these metrics from a CSV file.
                        </p>
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Stats...
                        </>
                    ) : (
                        initialData ? 'Update Stats' : 'Save Stats'
                    )}
                </Button>
            </form>
        </Form>
    )
}
