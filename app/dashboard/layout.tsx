'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { PlayerSidebar } from '@/components/player/player-sidebar'
import { PlayerMobileSidebar } from '@/components/player/player-mobile-sidebar'

export default function PlayerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const supabase = createClient()

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/')
    }

    return (
        <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <PlayerSidebar />
            </div>

            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    {/* Header for Mobile Sidebar & Actions */}
                    <div className="flex justify-between md:justify-end mb-6 items-center">
                        <PlayerMobileSidebar />

                        <div className="flex items-center gap-2">
                            <ModeToggle />
                            <Button variant="ghost" size="sm" onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </div>

                    {children}
                </div>
            </main>
        </div>
    )
}
