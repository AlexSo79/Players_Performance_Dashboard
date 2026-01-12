'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const financialsSchema = z.object({
    player_id: z.string().min(1, 'Select a player'),
    salary_per_year: z.coerce.number().min(0),
    contract_expiry: z.date(),
    market_value: z.coerce.number().min(0),
    transfer_fee: z.coerce.number().min(0).optional(),
})

type FinancialsFormValues = z.infer<typeof financialsSchema>

interface FinancialsFormProps {
    onSuccess?: () => void
    initialData?: Partial<FinancialsFormValues>
}

export function FinancialsForm({ onSuccess }: FinancialsFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [players, setPlayers] = useState<{ id: string; full_name: string | null; email: string | null }[]>([])
    const supabase = React.useMemo(() => createClient(), [])
    const router = useRouter()

    useEffect(() => {
        const fetchPlayers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name', { ascending: true })

            if (data) setPlayers(data)
        }
        fetchPlayers()
    }, [supabase])

    const form = useForm<FinancialsFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(financialsSchema) as any,
        defaultValues: {
            salary_per_year: 0,
            market_value: 0,
            transfer_fee: 0,
        },
    })

    // When player is selected, try to fetch existing financials
    const onPlayerChange = async (playerId: string) => {
        form.setValue('player_id', playerId)
        if (!playerId) return

        const { data } = await supabase
            .from('financials')
            .select('*')
            .eq('player_id', playerId)
            .single()

        if (data) {
            form.setValue('salary_per_year', data.salary_per_year)
            form.setValue('market_value', data.market_value)
            form.setValue('transfer_fee', data.transfer_fee || 0)
            if (data.contract_expiry) {
                form.setValue('contract_expiry', new Date(data.contract_expiry))
            }
        } else {
            // Reset if no data
            form.setValue('salary_per_year', 0)
            form.setValue('market_value', 0)
            form.setValue('transfer_fee', 0)
        }
    }

    async function onSubmit(data: FinancialsFormValues) {
        setIsSubmitting(true)
        try {
            // Check if exists to update or insert
            const { data: existing } = await supabase
                .from('financials')
                .select('id')
                .eq('player_id', data.player_id)
                .single()

            const payload = {
                player_id: data.player_id,
                salary_per_year: data.salary_per_year,
                contract_expiry: data.contract_expiry.toISOString(),
                market_value: data.market_value,
                transfer_fee: data.transfer_fee,
                updated_at: new Date().toISOString(),
            }

            let error
            if (existing) {
                const { error: updateError } = await supabase
                    .from('financials')
                    .update(payload)
                    .eq('id', existing.id)
                error = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('financials')
                    .insert(payload)
                error = insertError
            }

            if (error) throw error

            toast.success('Financials updated successfully')
            if (onSuccess) onSuccess()
            router.refresh()
        } catch (error) {
            console.error('Error saving financials:', error)
            toast.error('Failed to save financials')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="player_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Player</FormLabel>
                            <Select
                                onValueChange={onPlayerChange}
                                defaultValue={field.value}
                            >
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

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="salary_per_year"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Annual Salary (€)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="market_value"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Market Value (€)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="contract_expiry"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Contract Expiry</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={'outline'}
                                                className={cn(
                                                    'w-full pl-3 text-left font-normal',
                                                    !field.value && 'text-muted-foreground'
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, 'PPP')
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date('1900-01-01')
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="transfer_fee"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transfer Fee (Paid)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Financials'
                    )}
                </Button>
            </form>
        </Form>
    )
}
