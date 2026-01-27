'use client'

import React, { useState, useMemo } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

interface DashboardViewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats: Record<string, any>[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    health?: any
}
const METRIC_CONFIG = [
    // Volume
    { label: 'Minutes', key: 'minutes', unit: 'min', category: 'Volume' },
    { label: 'Total Distance', key: 'total_distance', unit: 'm', category: 'Volume' },
    { label: 'Distance/Min', key: 'distance_min', unit: 'm/min', category: 'Volume' },
    { label: 'Eq. Rel. Distance', key: 'equivalent_relative_distance', unit: 'm', category: 'Volume' },
    { label: '% Eq. Rel. Distance', key: 'pct_equivalent_relative_distance', unit: '%', category: 'Volume' },

    // Intensity
    { label: 'Max Speed', key: 'max_speed', unit: 'km/h', category: 'Intensity' },
    { label: 'Dist > 20km/h', key: 'distance_over_20_kmh', unit: 'm', category: 'Intensity' },
    { label: 'Dist > 25km/h', key: 'distance_over_25_kmh', unit: 'm', category: 'Intensity' },
    { label: 'HI Dist/Min', key: 'distance_hi_min', unit: 'm/min', category: 'Intensity' },
    { label: '% Sprint of HI', key: 'pct_distance_sprint_hi', unit: '%', category: 'Intensity' },
    { label: 'Dist > 80% Max', key: 'distance_over_80_pct_max_speed', unit: 'm', category: 'Intensity' },
    { label: 'Dist > 90% Max', key: 'distance_over_90_pct_max_speed', unit: 'm', category: 'Intensity' },
    { label: 'Dist > 14.4km/h', key: 'distance_over_14_4_kmh', unit: 'm', category: 'Intensity' },
    { label: 'Dist > 21km/h', key: 'distance_over_21_kmh', unit: 'm', category: 'Intensity' },
    { label: 'Dist > 25 W/kg', key: 'distance_over_25_w_kg', unit: 'm', category: 'Intensity' },

    // Accelerations
    { label: '# Acc > 2.5', key: 'number_acc_over_25_kmh', unit: '', category: 'Accelerations' },
    { label: 'Acc Dist (>2.5)', key: 'distance_acc_over_2_5_ms', unit: 'm', category: 'Accelerations' },
    { label: 'Dec Dist (>2.5)', key: 'distance_dec_over_2_5_ms', unit: 'm', category: 'Accelerations' },
    { label: 'Acc HI/Min', key: 'distance_acc_hi_min', unit: 'm/min', category: 'Accelerations' },
    { label: 'Dec HI/Min', key: 'distance_dece_hi_min', unit: 'm/min', category: 'Accelerations' },
    { label: '% Acc HI', key: 'pct_distance_acc_hi', unit: '%', category: 'Accelerations' },
    { label: '% Dec HI', key: 'pct_distance_dec_hi', unit: '%', category: 'Accelerations' },

    // Load
    { label: 'Training Load', key: 'training_load', unit: 'AU', category: 'Load' },
    { label: 'Strength Index', key: 'strength_index', unit: '%', category: 'Load' },
    { label: 'EEE', key: 'eee', unit: 'kJ', category: 'Load' },
    { label: 'AMP', key: 'amp', unit: 'W/kg', category: 'Load' },
    { label: 'Player Load', key: 'player_load', unit: 'AU', category: 'Load' },
    { label: 'Anaerobic Index %', key: 'pct_ai', unit: '%', category: 'Load' },
    { label: '# Acc > 3m/s', key: 'number_acc_over_3_ms', unit: '', category: 'Accelerations' },
    { label: '# Dec < -3m/s', key: 'number_dec_under_minus_3_ms', unit: '', category: 'Accelerations' },
    { label: 'Dist MP HI', key: 'distance_mphi', unit: 'm', category: 'Load' },
    { label: '% Dist MP HI', key: 'pct_distance_mphi', unit: '%', category: 'Load' },
]

// Metric Config stays outside component or safely memoized
// ... (assuming imports are fine as I am replacing from line 70)

export function DashboardView({ stats }: DashboardViewProps) {
    // 1. Extract Filter Options
    const seasons = useMemo(() => Array.from(new Set(stats.map(s => s.matches?.season || 'Unknown'))).sort(), [stats])

    // State
    const [selectedSeason, setSelectedSeason] = useState<string>('')
    const [selectedCompetition, setSelectedCompetition] = useState<string>('')
    const [selectedMatchId, setSelectedMatchId] = useState<string>('')

    // Default Season
    const defaultSeason = useMemo(() => {
        if (stats.length === 0) return ''
        const sorted = [...stats].sort((a, b) => new Date(b.matches?.date).getTime() - new Date(a.matches?.date).getTime())
        return sorted[0]?.matches?.season || 'Unknown'
    }, [stats])

    // Derived State (Active Selections)
    const activeSeason = selectedSeason || defaultSeason

    const competitions = useMemo(() => {
        if (!activeSeason) return []
        const filtered = stats.filter(s => (s.matches?.season || 'Unknown') === activeSeason)
        return Array.from(new Set(filtered.map(s => s.matches?.competition || 'Unknown'))).sort()
    }, [stats, activeSeason])

    const activeCompetition = selectedCompetition && competitions.includes(selectedCompetition)
        ? selectedCompetition
        : (competitions.length > 0 ? competitions[0] : '')

    const matchesList = useMemo(() => {
        if (!activeSeason || !activeCompetition) return []
        return stats
            .filter(s => (s.matches?.season || 'Unknown') === activeSeason && (s.matches?.competition || 'Unknown') === activeCompetition)
            .map(s => ({
                id: s.match_id,
                label: `${format(new Date(s.matches?.date), 'MM/dd')} vs ${s.matches?.opponent}`,
                date: s.matches?.date
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
    }, [stats, activeSeason, activeCompetition])

    const activeMatchId = selectedMatchId && matchesList.find(m => m.id === selectedMatchId)
        ? selectedMatchId
        : (matchesList.length > 0 ? matchesList[0].id : '')

    // Handlers
    const handleSeasonChange = (val: string) => {
        setSelectedSeason(val)
        setSelectedCompetition('')
        setSelectedMatchId('')
    }

    const handleCompetitionChange = (val: string) => {
        setSelectedCompetition(val)
        setSelectedMatchId('')
    }


    // Filter Data
    const currentStat = useMemo(() => {
        return stats.find(s => s.match_id === activeMatchId) || {}
    }, [stats, activeMatchId])

    // Chart Data - Filtered by Season & Competition for relevant trends
    const filteredStatsForCharts = useMemo(() => {
        return stats
            .filter(s => (s.matches?.season || 'Unknown') === activeSeason && (s.matches?.competition || 'Unknown') === activeCompetition)
            .sort((a, b) => new Date(a.matches?.date).getTime() - new Date(b.matches?.date).getTime()) // Oldest to newest for charts
    }, [stats, activeSeason, activeCompetition])


    const chartData = useMemo(() => filteredStatsForCharts.map((stat) => ({
        date: stat.matches ? format(new Date(stat.matches.date), 'MM/dd') : '',
        opponent: stat.matches?.opponent,

        // Volume
        total_distance: stat.total_distance,
        distance_min: stat.distance_min,

        // Intensity
        max_speed: stat.max_speed,
        distance_over_20_kmh: stat.distance_over_20_kmh,
        distance_over_25_kmh: stat.distance_over_25_kmh,

        // Accel
        dist_acc: stat.distance_acc_over_2_5_ms,
        dist_dec: stat.distance_dec_over_2_5_ms,
        num_acc: stat.number_acc_over_25_kmh,

        // Load
        training_load: stat.training_load,
        eee: stat.eee,
        amp: stat.amp,
        strength_index: stat.strength_index
    })), [filteredStatsForCharts])

    // Calculate Benchmarks (Max of each metric from history)
    const benchmarks = React.useMemo(() => {
        const maxes: Record<string, number> = {}
        METRIC_CONFIG.forEach(metric => {
            const values = stats.map(s => Number(s[metric.key]) || 0)
            maxes[metric.key] = Math.max(...values, 0)
        })
        return maxes
    }, [stats])

    const getTrafficLight = (value: number, benchmark: number) => {
        if (!benchmark) return 'border-border'
        const pct = (value / benchmark) * 100
        if (pct >= 95) return 'border-green-500 text-green-600'
        if (pct >= 85) return 'border-yellow-500 text-yellow-600'
        return 'border-red-500 text-red-600'
    }

    const formatDelta = (value: number, benchmark: number) => {
        const delta = value - benchmark
        if (delta === 0) return '0'
        return delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)
    }

    const renderMetrics = (category: string) => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            {METRIC_CONFIG.filter(m => m.category === category).map((metric) => {
                const value = Number(currentStat[metric.key]) || 0
                const benchmark = benchmarks[metric.key] || 0
                const colorClass = getTrafficLight(value, benchmark)
                const delta = formatDelta(value, benchmark)

                return (
                    <Card key={metric.key} className={`border-2 ${colorClass}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="text-xs font-medium uppercase tracking-wider">
                                {metric.label}
                            </CardTitle>
                            {metric.key === 'training_load' && <TrendingUp className="h-4 w-4" />}
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="text-2xl font-bold">
                                {value !== 0 ? value.toFixed(1) : '-'}
                                <span className="text-xs font-normal text-muted-foreground ml-1">{metric.unit}</span>
                            </div>
                            <div className="flex justify-between items-end mt-2 text-xs">
                                <span className="text-muted-foreground">
                                    Target: {benchmark.toFixed(1)}
                                </span>
                                <span className={`font-semibold ${delta.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                    {delta === '0' ? '-' : delta}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Session Performance</h2>

                <div className="flex flex-wrap gap-2">
                    {/* Season Select */}
                    <Select value={activeSeason} onValueChange={handleSeasonChange}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Season" />
                        </SelectTrigger>
                        <SelectContent>
                            {seasons.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Competition Select */}
                    <Select value={activeCompetition} onValueChange={handleCompetitionChange} disabled={!activeSeason}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Competition" />
                        </SelectTrigger>
                        <SelectContent>
                            {competitions.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Match Select */}
                    <Select value={activeMatchId} onValueChange={setSelectedMatchId} disabled={!activeCompetition}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Match" />
                        </SelectTrigger>
                        <SelectContent>
                            {matchesList.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="volume" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="volume">Volume</TabsTrigger>
                    <TabsTrigger value="intensity">Intensity</TabsTrigger>
                    <TabsTrigger value="accelerations">Accelerations</TabsTrigger>
                    <TabsTrigger value="load">Load & Efficiency</TabsTrigger>
                </TabsList>

                <TabsContent value="volume" className="space-y-4">
                    {renderMetrics('Volume')}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>Total Distance Analysis</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="total_distance" fill="#2563eb" name="Distance (m)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Distance Intensity (m/min)</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis domain={['auto', 'auto']} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="distance_min" stroke="#16a34a" strokeWidth={2} name="Dist/Min" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="intensity" className="space-y-4">
                    {renderMetrics('Intensity')}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>High Speed Distance (&#62;20km/h)</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="distance_over_20_kmh" stroke="#f59e0b" fill="#fcd34d" name="HSR (m)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Max Speed Trends</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis domain={['auto', 'auto']} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="max_speed" stroke="#dc2626" strokeWidth={2} name="Max Speed (km/h)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="accelerations" className="space-y-4">
                    {renderMetrics('Accelerations')}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>Acc vs Dec Distance</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="dist_acc" name="Acc Dist" fill="#16a34a" stackId="a" />
                                        <Bar dataKey="dist_dec" name="Dec Dist" fill="#ef4444" stackId="a" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Total Accelerations Count</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="step" dataKey="num_acc" stroke="#8b5cf6" strokeWidth={2} name="# Acc > 2.5" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="load" className="space-y-4">
                    {renderMetrics('Load')}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>Training Load vs Intensity (AMP)</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="training_load" fill="#3b82f6" name="Load (AU)" />
                                        <Line yAxisId="right" type="monotone" dataKey="amp" stroke="#ef4444" strokeWidth={2} name="AMP (W/kg)" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Energy Expenditure</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="eee" stroke="#10b981" fill="#d1fae5" name="EEE (kJ)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

