'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Activity, Trophy } from 'lucide-react'

const sidebarItems = [
    {
        title: 'Performance Stats',
        href: '/dashboard/performance',
        icon: Activity,
    },
    {
        title: 'Game Events',
        href: '/dashboard/game-events',
        icon: Trophy,
    },
]

export function PlayerSidebar() {
    const pathname = usePathname()

    return (
        <div className="pb-12 min-h-screen w-64 border-r bg-white dark:bg-gray-950">
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="flex items-center gap-2 mb-8 px-4">
                        <div className="bg-blue-600 rounded-md p-1">
                            <LayoutDashboard className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">PlayerPerf</h2>
                    </div>
                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Button
                                key={item.href}
                                variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                                className={cn(
                                    'w-full justify-start',
                                    pathname.startsWith(item.href) ? 'bg-gray-100 dark:bg-gray-800' : ''
                                )}
                                asChild
                            >
                                <Link href={item.href}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
