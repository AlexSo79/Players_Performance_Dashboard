'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Trophy,
    Activity,
    DollarSign,
    LogOut,
    FileSpreadsheet
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Matches',
        href: '/admin/matches',
        icon: Trophy,
    },
    {
        title: 'Player Stats',
        href: '/admin/stats',
        icon: Activity,
    },
    {
        title: 'Game Events',
        href: '/admin/game-events',
        icon: FileSpreadsheet,
    },
    {
        title: 'Financials',
        href: '/admin/financials',
        icon: DollarSign,
    },
    {
        title: 'Profiles',
        href: '/admin/profiles',
        icon: Users,
    },
    {
        title: 'Import Data',
        href: '/admin/import',
        icon: FileSpreadsheet,
    },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/')
    }

    return (
        <div className="flex bg-gray-900 text-white h-screen w-64 flex-col border-r border-gray-800">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    PlayerPerf Admin
                </h1>
            </div>

            <div className="flex-1 overflow-auto py-4">
                <nav className="space-y-1 px-2">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t border-gray-800 p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-gray-800"
                    onClick={handleSignOut}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}
