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
import { format } from 'date-fns'

const healthSchema = z.object({
    player_id: z.string().min(1, 'Select a player'),
    date: z.string().min(1, 'Select a date'),
    injury_status: z.string().optional(),
    fatigue_level: z.union([z.coerce.number().min(1).max(10), z.literal('')]).optional(),
    sleep_hours: z.union([z.coerce.number().min(0).max(24), z.literal('')]).optional(),
    hrv: z.union([z.coerce.number(), z.literal('')]).optional(),
    rhr: z.union([z.coerce.number(), z.literal('')]).optional(),
    strain: z.union([z.coerce.number(), z.literal('')]).optional(),
    notes: z.string().optional(),
})

type HealthFormValues = z.infer<typeof healthSchema>

interface HealthFormProps {
    onSuccess?: () => void
    initialData?: Partial<HealthFormValues> & { id?: string }
}

export function HealthForm({ onSuccess, initialData }: HealthFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [players, setPlayers] = useState<{ id: string; full_name: string | null; email: string | null }[]>([])
    const supabase = React.useMemo(() => createClient(), [])

    useEffect(() => {
        const fetchPlayers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('role', 'player')
                .order('full_name', { ascending: true })

            if (data) setPlayers(data)
        }
        fetchPlayers()
    }, [supabase])

    const form = useForm<HealthFormValues>({
        resolver: zodResolver(healthSchema) as any,
        defaultValues: {
            player_id: initialData?.player_id || '',
            date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
            injury_status: initialData?.injury_status || 'Fit',
            fatigue_level: initialData?.fatigue_level || '',
            sleep_hours: initialData?.sleep_hours || '',
            hrv: initialData?.hrv || '',
            rhr: initialData?.rhr || '',
            strain: initialData?.strain || '',
            notes: initialData?.notes || '',
        },
    })

    async function onSubmit(values: HealthFormValues) {
        setIsSubmitting(true)
        try {
            const payload = {
                ...values,
                fatigue_level: values.fatigue_level === '' ? null : Number(values.fatigue_level),
                sleep_hours: values.sleep_hours === '' ? null : Number(values.sleep_hours),
                hrv: values.hrv === '' ? null : Number(values.hrv),
                rhr: values.rhr === '' ? null : Number(values.rhr),
                strain: values.strain === '' ? null : Number(values.strain),
            }

            if (initialData?.id) {
                const { error } = await supabase
                    .from('health_monitoring_stats')
                    .update(payload)
                    .eq('id', initialData.id)

                if (error) throw error
                toast.success('Health record updated')
            } else {
                const { error } = await supabase
                    .from('health_monitoring_stats')
                    .insert(payload)

                if (error) throw error
                toast.success('Health record created')
            }
            onSuccess?.()
        } catch (error) {
            console.error(error)
            toast.error('Failed to save health record')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                {player.full_name || player.email}
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
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="injury_status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Injury Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Fit">Fit</SelectItem>
                                        <SelectItem value="Injured">Injured</SelectItem>
                                        <SelectItem value="Recovery">Recovery</SelectItem>
                                        <SelectItem value="Knock">Knock (Minor)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fatigue_level"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fatigue (1-10)</FormLabel>
                                <FormControl>
                                    <Input type="number" min="1" max="10" placeholder="1-10" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="sleep_hours"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sleep (Hours)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" placeholder="e.g. 8.5" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="hrv"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>HRV (ms)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Heart Rate Variability" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="rhr"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>RHR (bpm)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Resting Heart Rate" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="strain"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Daily Strain (0-21)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" placeholder="Whoop Strain etc." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Input placeholder="Additional context..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Update Record' : 'Create Record'}
                </Button>
            </form>
        </Form>
    )
}
