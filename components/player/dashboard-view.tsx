'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    PieChart,
    Pie,
    Cell,
    ScatterChart,
    Scatter,
    ZAxis
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { TrendingUp, Activity, Zap, Shield, Target } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DashboardViewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    { label: 'High Speed Running', key: 'high_speed_running', unit: 'm', category: 'Intensity' },
    { label: 'Sprint Running', key: 'sprint_running', unit: 'm', category: 'Intensity' },
    { label: 'HI Dist/Min', key: 'distance_hi_min', unit: 'm/min', category: 'Intensity' },
    { label: '% Sprint of HI', key: 'pct_distance_sprint_hi', unit: '%', category: 'Intensity' },
    { label: 'Dist > 80% Max', key: 'distance_over_80_pct_max_speed', unit: 'm', category: 'Intensity' },
    { label: 'Dist > 90% Max', key: 'distance_over_90_pct_max_speed', unit: 'm', category: 'Intensity' },
    { label: 'Dist > 14.4km/h', key: 'distance_over_14_4_kmh', unit: 'm', category: 'Intensity' },
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

export function DashboardView({ stats, health }: DashboardViewProps) {
    const enrichedStats = useMemo(() => stats.map(stat => {
        let hsr = 0;
        if (typeof stat.distance_over_21_kmh === 'number' && stat.distance_over_21_kmh > 0) hsr = stat.distance_over_21_kmh;
        else if (typeof stat.distance_over_20_kmh === 'number' && stat.distance_over_20_kmh > 0) hsr = stat.distance_over_20_kmh;
        else if (typeof stat.distance_over_16_kmh === 'number' && stat.distance_over_16_kmh > 0) hsr = stat.distance_over_16_kmh;

        let sprint = 0;
        if (typeof stat.distance_over_25_kmh === 'number' && stat.distance_over_25_kmh > 0) sprint = stat.distance_over_25_kmh;
        else if (typeof stat.distance_over_24_kmh === 'number' && stat.distance_over_24_kmh > 0) sprint = stat.distance_over_24_kmh;

        return { ...stat, high_speed_running: hsr, sprint_running: sprint } as Record<string, any>;
    }), [stats]);

    // 1. Extract Filter Options
    const seasons = useMemo(() => Array.from(new Set(enrichedStats.map(s => s.matches?.season || 'Unknown'))).sort(), [enrichedStats])
    const sortedStats = enrichedStats;

    // State
    const [selectedSeason, setSelectedSeason] = useState<string>('')
    const [selectedCompetition, setSelectedCompetition] = useState<string>('')
    const [selectedMatchId, setSelectedMatchId] = useState<string>('')
    const [isPer90, setIsPer90] = useState<boolean>(true)
    const [isFullSeasonMode, setIsFullSeasonMode] = useState<boolean>(true)

    // Default Season
    const defaultSeason = useMemo(() => {
        if (enrichedStats.length === 0) return ''
        const sorted = [...enrichedStats].sort((a, b) => new Date(b.matches?.date).getTime() - new Date(a.matches?.date).getTime())
        return sorted[0]?.matches?.season || 'Unknown'
    }, [enrichedStats])

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Derived Selection State
    const activeSeason = selectedSeason || (seasons.length > 0 ? seasons[0] : '')  // Filter Stats based on selection
    const activeMatch = useMemo(() => {
        if (!selectedMatchId) return sortedStats[0]
        return sortedStats.find(s => s.match_id === selectedMatchId) || sortedStats[0]
    }, [selectedMatchId, sortedStats])

    const competitions = useMemo(() => {
        if (!activeSeason) return []
        const filtered = enrichedStats.filter(s => (s.matches?.season || 'Unknown') === activeSeason)
        return Array.from(new Set(filtered.map(s => s.matches?.competition || 'Unknown'))).sort()
    }, [enrichedStats, activeSeason])

    const activeCompetition = selectedCompetition && competitions.includes(selectedCompetition)
        ? selectedCompetition
        : (competitions.length > 0 ? competitions[0] : '')

    const matchesList = useMemo(() => {
        if (!activeSeason || !activeCompetition) return []
        return enrichedStats
            .filter(s => (s.matches?.season || 'Unknown') === activeSeason && (s.matches?.competition || 'Unknown') === activeCompetition)
            .map(s => ({
                id: s.match_id,
                label: `${format(new Date(s.matches?.date), 'MM/dd')} vs ${s.matches?.opponent}`,
                date: s.matches?.date
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
    }, [enrichedStats, activeSeason, activeCompetition])

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
    // In Full Season mode, we need to aggregate the stats. However, if the current component design expects a single match, 
    // we must average or sum them. For now, since it shows charts, the 'currentStat' for the KPIs might represent the *average*
    // or *sum* of the season. The user's prompt implies 'cumulative stats of multiple games'.
    const currentStat = useMemo(() => {
        if (!isFullSeasonMode) {
            return enrichedStats.find(s => s.match_id === activeMatchId) || {}
        }

        // Full Season Mode - Aggregate the active season/competition stats
        const relevantStats = enrichedStats.filter(s =>
            (s.matches?.season || 'Unknown') === activeSeason
        )

        if (relevantStats.length === 0) return {}

        // Create an aggregated stat object
        const aggregated: Record<string, any> = { minutes: 0 }
        const count = relevantStats.length;

        METRIC_CONFIG.forEach(metric => {
            let sum = 0;
            relevantStats.forEach(stat => {
                sum += (Number(stat[metric.key]) || 0)
            })
            aggregated[metric.key] = sum / count;
        })

        // Average minutes explicitly
        aggregated.minutes = relevantStats.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0) / count;

        return aggregated
    }, [enrichedStats, activeMatchId, isFullSeasonMode, activeSeason, activeCompetition])

    // Chart Data - Filtered by Season & Competition for relevant trends
    const filteredStatsForCharts = useMemo(() => {
        return enrichedStats
            .filter(s => {
                const seasonMatch = (s.matches?.season || 'Unknown') === activeSeason;
                if (isFullSeasonMode) return seasonMatch;
                return seasonMatch && (s.matches?.competition || 'Unknown') === activeCompetition;
            })
            .sort((a, b) => new Date(a.matches?.date).getTime() - new Date(b.matches?.date).getTime()) // Oldest to newest for charts
    }, [enrichedStats, activeSeason, activeCompetition, isFullSeasonMode])


    const chartData = useMemo(() => filteredStatsForCharts.map((stat) => {
        const factor = isPer90 && stat.minutes > 0 ? (90 / stat.minutes) : 1;

        return {
            date: stat.matches ? format(new Date(stat.matches.date), 'MM/dd') : '',
            opponent: stat.matches?.opponent,

            // Volume
            total_distance: stat.total_distance * factor,
            distance_min: stat.distance_min, // Already a rate

            // Intensity
            max_speed: stat.max_speed, // Never scale max speed
            high_speed_running: stat.high_speed_running * factor,
            sprint_running: stat.sprint_running * factor,

            // Accel
            dist_acc: stat.distance_acc_over_2_5_ms * factor,
            dist_dec: stat.distance_dec_over_2_5_ms * factor,
            num_acc: stat.number_acc_over_25_kmh * factor,

            // Load
            training_load: stat.training_load * factor,
            eee: stat.eee * factor,
            amp: stat.amp, // Likely a rate (W/kg)
            strength_index: stat.strength_index
        }
    }), [filteredStatsForCharts, isPer90])
    // ... previous properties were here, they are replaced by the function block above

    // Calculate Benchmarks (Max of each metric from history)
    const benchmarks = React.useMemo(() => {
        const maxes: Record<string, number> = {}
        const doNotScale = ['minutes', 'distance_min', 'max_speed', 'distance_hi_min', 'pct_distance_sprint_hi', 'pct_equivalent_relative_distance', 'distance_acc_hi_min', 'distance_dece_hi_min', 'pct_distance_acc_hi', 'pct_distance_dec_hi', 'strength_index', 'amp', 'player_load', 'pct_ai', 'pct_distance_mphi'];

        METRIC_CONFIG.forEach(metric => {
            const values = enrichedStats
                .filter(s => s[metric.key] != null && s[metric.key] !== '') // Ignore missing/empty
                .map(s => {
                    const rawValue = Number(s[metric.key]);
                    if (isNaN(rawValue)) return 0;

                    // Target values must not change based on the Per-90 toggle
                    return rawValue;
                })

            // Strategy: Rolling Average + 5%
            const sum = values.reduce((a, b) => a + b, 0);
            const average = values.length > 0 ? sum / values.length : 0;
            maxes[metric.key] = average * 1.05;
        })
        return maxes
    }, [enrichedStats])

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
                const rawValue = Number(currentStat[metric.key]) || 0
                const benchmark = benchmarks[metric.key] || 0

                // Do not scale qualitative or already-normalized metrics
                const doNotScale = ['minutes', 'distance_min', 'max_speed', 'distance_hi_min', 'pct_distance_sprint_hi', 'pct_equivalent_relative_distance', 'distance_acc_hi_min', 'distance_dece_hi_min', 'pct_distance_acc_hi', 'pct_distance_dec_hi', 'strength_index', 'amp', 'player_load', 'pct_ai', 'pct_distance_mphi'];
                const factor = isPer90 && currentStat.minutes > 0 && !doNotScale.includes(metric.key) ? (90 / currentStat.minutes) : 1;

                const value = rawValue * factor;

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

    if (!isMounted) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">Session Performance</h2>

                    {/* View Mode Switch */}
                    <div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
                        <Label htmlFor="view-mode" className="text-sm font-medium">Single Game</Label>
                        <Switch
                            id="view-mode"
                            checked={isFullSeasonMode}
                            onCheckedChange={(checked) => {
                                setIsFullSeasonMode(checked)
                                if (!checked) setIsPer90(false) // Single game forces cumulative
                            }}
                        />
                        <Label htmlFor="view-mode" className="text-sm font-medium">Full Season</Label>
                    </div>

                    {/* Per 90 Switch */}
                    <div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
                        <Label htmlFor="per-90" className={`text-sm font-medium ${!isFullSeasonMode ? 'opacity-50' : ''}`}>Average</Label>
                        <Switch
                            id="per-90"
                            checked={isPer90}
                            onCheckedChange={setIsPer90}
                            disabled={!isFullSeasonMode}
                        />
                        <Label htmlFor="per-90" className={`text-sm font-medium ${!isFullSeasonMode ? 'opacity-50' : ''}`}>Per 90</Label>
                    </div>
                </div>

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
                    <Select value={activeCompetition} onValueChange={handleCompetitionChange} disabled={!activeSeason || isFullSeasonMode}>
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
                    <Select value={activeMatchId} onValueChange={setSelectedMatchId} disabled={!activeCompetition || isFullSeasonMode}>
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
                            <CardHeader><CardTitle>High Speed Running</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="high_speed_running" stroke="#f59e0b" fill="#fcd34d" name="HSR (m)" />
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

