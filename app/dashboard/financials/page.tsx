import { createClient } from '@/utils/supabase/server'
import { FinancialOverview } from '@/components/player/financial-overview'
import { redirect } from 'next/navigation'

export default async function FinancialsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Financials
    const { data: financials } = await supabase
        .from('financials')
        .select('total_budget')
        .eq('player_id', user.id)
        .single()

    // Fetch Services
    const { data: services } = await supabase
        .from('player_services')
        .select('*')
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Financials & Services</h2>
                <p className="text-muted-foreground">
                    Track your budget allocation and active services.
                </p>
            </div>

            <FinancialOverview
                financials={financials}
                services={services || []}
            />
        </div>
    )
}
