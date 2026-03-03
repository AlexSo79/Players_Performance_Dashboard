'use client'

import React, { useMemo } from 'react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Wallet, CreditCard, TrendingUp, PiggyBank, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Service {
    id: string
    service_name: string
    cost: number
    status: string
}

interface FinancialOverviewProps {
    financials: {
        total_budget: number | null
    } | null
    services: Service[]
}

const COLORS = {
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
    gray: '#e5e7eb'
}

export function FinancialOverview({ financials, services }: FinancialOverviewProps) {
    // Calculations
    const totalBudget = financials?.total_budget || 0

    const { spent, projected } = useMemo(() => {
        const totalCost = services.reduce((acc, curr) => acc + (curr.cost || 0), 0)
        // For now, treating Spent and Projected as similar. 
        // Logic could be: Spent = 'Completed' services, Projected = 'Active' + 'Pending' services?
        // Let's assume all listed services are "Projected" to be spent, and "Spent" aligns with that for simple view unless status differentiates.
        return { spent: totalCost, projected: totalCost }
    }, [services])

    const remaining = totalBudget - spent
    const percentConsumed = totalBudget > 0 ? (spent / totalBudget) * 100 : 0

    // Traffic Light Logic
    let statusColor = COLORS.green
    if (percentConsumed > 90) statusColor = COLORS.red
    else if (percentConsumed > 75) statusColor = COLORS.yellow

    const pieData = [
        { name: 'Spent', value: spent },
        { name: 'Remaining', value: Math.max(0, remaining) }
    ]

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IE', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Financial Overview</h2>

            {/* Section A: KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
                        <p className="text-xs text-muted-foreground">Annual Allocation</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Spent / Allocated</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(spent)}</div>
                        <p className="text-xs text-muted-foreground">Total Services Cost</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Projected</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(projected)}</div>
                        <p className="text-xs text-muted-foreground">Estimated Final</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", remaining < 0 ? "text-red-500" : "text-green-600")}>
                            {formatCurrency(remaining)}
                        </div>
                        <p className="text-xs text-muted-foreground">Available Balance</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {/* Section B: Visualization */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Budget Consumption</CardTitle>
                        <CardDescription>Usage Status</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-6">
                        <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell key="cell-spent" fill={statusColor} />
                                        <Cell key="cell-remaining" fill={COLORS.gray} />
                                    </Pie>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    <Tooltip formatter={(value: any) => [formatCurrency(value), 'Value']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <span className="text-3xl font-bold" style={{ color: statusColor }}>
                                        {Math.round(percentConsumed)}%
                                    </span>
                                    <p className="text-xs text-muted-foreground">Used</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: statusColor }} />
                            <span>
                                {percentConsumed < 75 ? "Within Budget" : percentConsumed < 90 ? "Caution" : "Over Budget"}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Section C: Services List */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Active Services</CardTitle>
                        <CardDescription>List of activated player services</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {services.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No active services found.</p>
                            ) : (
                                services.map(service => (
                                    <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-2 rounded-full hidden sm:block">
                                                <TrendingUp className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{service.service_name}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    {service.status === 'Active' && <CheckCircle className="h-3 w-3 text-green-500" />}
                                                    {service.status === 'Pending' && <Clock className="h-3 w-3 text-yellow-500" />}
                                                    {service.status === 'Cancelled' && <AlertCircle className="h-3 w-3 text-red-500" />}
                                                    <span>{service.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right font-mono font-medium">
                                            {formatCurrency(service.cost)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
