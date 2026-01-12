'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'

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
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const matchSchema = z.object({
    date: z.date(),
    opponent: z.string().min(2, {
        message: 'Opponent name must be at least 2 characters.',
    }),
    location: z.enum(['Home', 'Away']),
    season: z.string().optional(),
    competition: z.string().optional(),
    result: z.string().optional(),
})

type MatchFormValues = z.infer<typeof matchSchema>

interface MatchFormProps {
    onSuccess?: () => void
    initialData?: {
        id: string
        date: string
        opponent: string
        location: 'Home' | 'Away'
        season?: string | null
        competition?: string | null
        result?: string | null
    }
}

export function MatchForm({ onSuccess, initialData }: MatchFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const form = useForm<MatchFormValues>({
        resolver: zodResolver(matchSchema),
        defaultValues: {
            date: initialData?.date ? new Date(initialData.date) : undefined,
            opponent: initialData?.opponent || '',
            location: initialData?.location || undefined,
            season: initialData?.season || '2023/24',
            competition: initialData?.competition || '',
            result: initialData?.result || '',
        },
    })

    async function onSubmit(data: MatchFormValues) {
        setIsSubmitting(true)
        try {
            // Adjust date to UTC noon to avoid timezone shifts
            const dateToSave = new Date(Date.UTC(data.date.getFullYear(), data.date.getMonth(), data.date.getDate(), 12, 0, 0))

            const payload = {
                date: dateToSave.toISOString(),
                opponent: data.opponent,
                location: data.location,
                season: data.season,
                competition: data.competition,
                result: data.result || null,
            }

            if (initialData?.id) {
                const { error } = await supabase
                    .from('matches')
                    .update(payload)
                    .eq('id', initialData.id)
                if (error) throw error
                toast.success('Match updated successfully')
            } else {
                const { error } = await supabase.from('matches').insert(payload)
                if (error) throw error
                toast.success('Match created successfully')
            }

            if (!initialData) {
                form.reset()
            }
            router.refresh()
            if (onSuccess) onSuccess()
        } catch (error) {
            console.error('Error saving match:', error)
            toast.error('Failed to save match')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Match Date</FormLabel>
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
                                                format(field.value, 'PHP')
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
                                            date > new Date() || date < new Date('1900-01-01')
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
                    name="opponent"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Opponent</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. FC Barcelona" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="season"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Season</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 2023/24" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="competition"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Competition</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. League, Cup" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select location" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Home">Home</SelectItem>
                                    <SelectItem value="Away">Away</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="result"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Result (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 3-1 or W" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {initialData ? 'Updating...' : 'Creating...'}
                        </>
                    ) : (
                        initialData ? 'Update Match' : 'Add Match'
                    )}
                </Button>
            </form>
        </Form>
    )
}
