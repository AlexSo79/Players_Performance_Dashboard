'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { FinancialsForm } from '@/components/admin/financials-form'
import { FinancialEntryForm } from '@/components/admin/financial-entry-form'
import { format } from 'date-fns'

interface FinancialRecord {
    id: string
    salary_per_year: number
    market_value: number
    contract_expiry: string | null
    profiles: { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null
}

export default function FinancialsPage() {
    const [financials, setFinancials] = useState<FinancialRecord[]>([])
    const [open, setOpen] = useState(false)
    // Memoize supabase client to prevent recreating it on every render if createClient doesn't do it
    const supabase = React.useMemo(() => createClient(), [])

    const fetchFinancials = React.useCallback(async () => {
        const { data, error } = await supabase
            .from('financials')
            .select(`
        id,
        salary_per_year,
        market_value,
        contract_expiry,
        profiles (full_name, email)
      `)
            .order('market_value', { ascending: false })

        if (error) {
            console.error('Error fetching financials:', error)
        } else {
            setFinancials(data || [])
        }
    }, [supabase])

    useEffect(() => {
        const load = async () => {
            await fetchFinancials()
        }
        load()
    }, [fetchFinancials])

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('en-EU', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Financials</h2>
                    <p className="text-muted-foreground">
                        Manage player salaries and market values.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Edit Salaries
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Update Basic Financials</DialogTitle>
                                <DialogDescription>
                                    Manage salary, market value, and contract info.
                                </DialogDescription>
                            </DialogHeader>
                            <FinancialsForm
                                onSuccess={() => {
                                    setOpen(false)
                                    fetchFinancials()
                                }}
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Manage Budget & Services
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Budget & Services</DialogTitle>
                                <DialogDescription>
                                    Set total budget and manage player services.
                                </DialogDescription>
                            </DialogHeader>
                            <FinancialEntryForm
                                onSuccess={() => {
                                    // Optionally refresh if we showed budget in the table, but we don't yet.
                                    fetchFinancials()
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>Salary (Year)</TableHead>
                            <TableHead>Market Value</TableHead>
                            <TableHead>Contract Expiry</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {financials.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No financial records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            financials.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {(Array.isArray(item.profiles) ? item.profiles[0]?.full_name : item.profiles?.full_name) ||
                                            (Array.isArray(item.profiles) ? item.profiles[0]?.email : item.profiles?.email)}
                                    </TableCell>
                                    <TableCell>{formatCurrency(item.salary_per_year)}</TableCell>
                                    <TableCell>{formatCurrency(item.market_value)}</TableCell>
                                    <TableCell>
                                        {item.contract_expiry
                                            ? format(new Date(item.contract_expiry), 'PPP')
                                            : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
