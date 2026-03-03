'use client'

import React, { useMemo } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    AreaChart,
    Area,
    ComposedChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Activity, Zap, Target } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface OverviewViewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats: Record<string, any>[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    health?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gameEvents: Record<string, any>[]
}

export function OverviewView({ stats, health, gameEvents }: OverviewViewProps) {
    // Enrich Stats for Sprint Aggregation
    const enrichedStats = useMemo(() => stats.map(stat => {
        let sprint = 0;
        if (typeof stat.distance_over_25_kmh === 'number' && stat.distance_over_25_kmh > 0) sprint = stat.distance_over_25_kmh;
        else if (typeof stat.distance_over_24_kmh === 'number' && stat.distance_over_24_kmh > 0) sprint = stat.distance_over_24_kmh;

        return { ...stat, sprint_running: sprint } as Record<string, any>;
    }), [stats]);

    const sortedStats = enrichedStats;

    // Overview Tab Calculations
    const overviewData = useMemo(() => {
        // 1. Availability (Always percentage, do not scale)
        const totalMinutes = stats.reduce((acc, curr) => acc + (curr.minutes || 0), 0)
        // Assuming 90min * matches count as total possible (simplified)
        const possibleMinutes = stats.length * 90
        const availability = possibleMinutes > 0 ? Math.round((totalMinutes / possibleMinutes) * 100) : 0

        // 2. Impact Factor (Season Average vs Per 90)
        // If isPer90 is true, we want (Goals + Assists) / TotalMinutes * 90
        // If false, we want the current average per match
        const totalGoals = gameEvents.reduce((acc, curr) => acc + (curr.goals || 0), 0);
        const totalAssists = gameEvents.reduce((acc, curr) => acc + (curr.assists || 0), 0);
        const totalGameMinutes = gameEvents.reduce((acc, curr) => acc + (curr.minutes_played || 0), 0);

        let impactAvg = 0;
        if (gameEvents.length > 0) {
            impactAvg = (totalGoals + totalAssists) / gameEvents.length;
        }

        // 3. Technical (Season Average Pass Completion)
        const totalPasses = gameEvents.reduce((acc, curr) => acc + (curr.passes_total || 0), 0);
        const totalAccuratePasses = gameEvents.reduce((acc, curr) => acc + (curr.passes_accurate || 0), 0);
        const passCompletion = totalPasses > 0 ? Math.round((totalAccuratePasses / totalPasses) * 100) : 0;

        // 4. Technical Efficiency Bar Chart Data (Aggregated)
        const factor = 1;

        const techBarData = [
            {
                zone: 'Defensive',
                total: gameEvents.reduce((acc, curr) => acc + (curr.back_passes_total || 0), 0) * factor,
                acc: gameEvents.reduce((acc, curr) => acc + (curr.back_passes_accurate || 0), 0) * factor
            },
            {
                zone: 'Middle',
                total: (gameEvents.reduce((acc, curr) => acc + (curr.passes_total || 0), 0) - gameEvents.reduce((acc, curr) => acc + (curr.back_passes_total || 0), 0) - gameEvents.reduce((acc, curr) => acc + (curr.passes_final_third_total || 0), 0)) * factor,
                acc: (gameEvents.reduce((acc, curr) => acc + (curr.passes_accurate || 0), 0) - gameEvents.reduce((acc, curr) => acc + (curr.back_passes_accurate || 0), 0) - gameEvents.reduce((acc, curr) => acc + (curr.passes_final_third_accurate || 0), 0)) * factor
            },
            {
                zone: 'Final 3rd',
                total: gameEvents.reduce((acc, curr) => acc + (curr.passes_final_third_total || 0), 0) * factor,
                acc: gameEvents.reduce((acc, curr) => acc + (curr.passes_final_third_accurate || 0), 0) * factor
            },
        ];

        // Ensure no negative values for Middle calculation proxy
        if (techBarData[1].total < 0) techBarData[1].total = 0;
        if (techBarData[1].acc < 0) techBarData[1].acc = 0;


        return { availability, impactAvg, passCompletion, techBarData }
    }, [stats, gameEvents])

    // Scale chart data (Strain vs Recovery, Risk Zone) based on isPer90 
    // Strain/Load is usually cumulative, but we'll apply the toggle if requested. 
    // Usually Training Load is a daily metric, not per-minute, but let's map it anyway.
    const chartStats = useMemo(() => {
        return sortedStats.slice(0, 15).reverse().map(stat => {
            const factor = 1;
            return {
                ...stat, // Keep original data accessible
                training_load_scaled: stat.training_load * factor,
                distance_mphi_scaled: stat.distance_mphi * factor,
                sprint_running_scaled: stat.sprint_running * factor,
            }
        });
    }, [sortedStats]);


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">Performance Overview</h2>
                </div>
            </div>

            <div className="space-y-6">
                {/* 1. Header Section: Health & Impact Snapshot */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Availability</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overviewData?.availability}%</div>
                            <p className="text-xs text-muted-foreground">
                                Season Average
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Wellness Status</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold",
                                !health ? "text-muted-foreground" : (health.fatigue_level && health.fatigue_level > 7) ? "text-red-600" : "text-green-600"
                            )}>
                                {!health ? "N/A" : ((health.fatigue_level && health.fatigue_level > 7) ? "Fatigued" : "Optimal")}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Strain: {health?.strain || 'N/A'} | Sleep: {health?.sleep_hours || 'N/A'}h
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Scoring Impact</CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {overviewData.impactAvg.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Avg G+A per Match (Season)
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Technical</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {overviewData.passCompletion}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Season Pass Completion
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                    {/* 3. Technical Efficiency - Spans full width since Radar is gone? Or shared row? User removed Physical Profile chart. */}
                    {/* Let's make Technical Efficiency larger or put charts in a nice grid */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Technical Efficiency</CardTitle>
                            <CardDescription>Season Aggregate Pass Quality</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={overviewData.techBarData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="zone" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="total" fill="#94a3b8" name="Total" />
                                        <Bar dataKey="acc" fill="#16a34a" name="Accurate" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Load Management - Moved up to fill gap? */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Strain vs Recovery</CardTitle>
                            <CardDescription>Internal Response to External Load</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartStats.slice(-10)}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="matches.date" tickFormatter={(v) => format(new Date(v), 'MM/dd')} />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="training_load_scaled" fill="#3b82f6" name="Load (AU)" />
                                        <Line yAxisId="right" type="monotone" dataKey="distance_mphi_scaled" stroke="#ef4444" name="HI MP Dist" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-1">
                    {/* Risk "Bullet" - Full width now? */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Injury Risk Zone</CardTitle>
                            <CardDescription>High Speed Running Accumulation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartStats}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="matches.date" tickFormatter={(v) => format(new Date(v), 'MM/dd')} />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="sprint_running_scaled" stroke="#f59e0b" fill="#fef3c7" name="Sprint Dist" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
