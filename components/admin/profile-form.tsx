'use client'

import React, { useState } from 'react'
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

const profileSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['admin', 'player', 'coach']),
    team: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
    profile: {
        id: string
        full_name: string | null
        role: string
        team?: string | null
    }
    onSuccess?: () => void
}

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: profile.full_name || '',
            role: (profile.role as 'admin' | 'player' | 'coach') || 'player',
            team: profile.team || '',
        },
    })

    async function onSubmit(data: ProfileFormValues) {
        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: data.full_name,
                    role: data.role,
                    team: data.team || null,
                })
                .eq('id', profile.id)

            if (error) throw error

            toast.success('Profile updated successfully')
            router.refresh()
            if (onSuccess) onSuccess()
        } catch (error) {
            console.error('Error updating profile:', JSON.stringify(error, null, 2))
            toast.error('Failed to update profile')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="player">Player</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="coach">Coach</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="team"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Team</FormLabel>
                            <FormControl>
                                <Input placeholder="Team Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        'Update Profile'
                    )}
                </Button>
            </form>
        </Form>
    )
}
