'use client'

import React from 'react'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { AdminSidebar } from '@/components/admin-sidebar'

export function AdminMobileSidebar() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
                <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                <AdminSidebar />
            </SheetContent>
        </Sheet>
    )
}
