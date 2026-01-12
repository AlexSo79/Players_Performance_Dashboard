import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminMobileSidebar } from '@/components/admin-mobile-sidebar'
import { ModeToggle } from '@/components/mode-toggle'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950">
            <div className="hidden md:block">
                <AdminSidebar />
            </div>
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    <div className="flex justify-end md:hidden mb-4 items-center gap-2">
                        <AdminMobileSidebar />
                        <ModeToggle />
                    </div>
                    <div className="hidden md:flex justify-end mb-4">
                        <ModeToggle />
                    </div>
                    {children}
                </div>
            </main>
        </div>
    )
}
