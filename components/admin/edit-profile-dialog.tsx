'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'
import { ProfileForm } from './profile-form'

interface EditProfileDialogProps {
    profile: {
        id: string
        full_name: string | null
        role: string
        team?: string | null
    }
}

export function EditProfileDialog({ profile }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Make changes to the user profile here. Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <ProfileForm
                    profile={profile}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
