'use client'

import React, { useState, useMemo } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    AreaChart,
    Area,
    RadialBarChart,
    RadialBar,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Target, Footprints, Shield, Activity, Share2, TrendingUp, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { CardGrid } from './card-grid'

interface GameEventsViewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    events: Record<string, any>[]
}

export function GameEventsView({ events }: GameEventsViewProps) {
    // 1. Extract Filter Options
    const seasons = useMemo(() => Array.from(new Set(events.map(s => s.matches?.season || 'Unknown'))).sort(), [events])

    // State
    const [selectedSeason, setSelectedSeason] = useState<string>('')
    const [selectedCompetition, setSelectedCompetition] = useState<string>('')
    const [selectedMatchId, setSelectedMatchId] = useState<string>('')

    // Helpers for defaults
    const defaultSeason = useMemo(() => {
        if (events.length === 0) return ''
        const sortedEvents = [...events].sort((a, b) => new Date(b.matches?.date).getTime() - new Date(a.matches?.date).getTime())
        return sortedEvents[0]?.matches?.season || 'Unknown'
    }, [events])

    // Derived State (Active Selections)
    const activeSeason = selectedSeason || defaultSeason

    const competitions = useMemo(() => {
        if (!activeSeason) return []
        const filtered = events.filter(s => (s.matches?.season || 'Unknown') === activeSeason)
        return Array.from(new Set(filtered.map(s => s.matches?.competition || 'Unknown'))).sort()
    }, [events, activeSeason])

    const activeCompetition = selectedCompetition && competitions.includes(selectedCompetition)
        ? selectedCompetition
        : (competitions.length > 0 ? competitions[0] : '')

    const matchesList = useMemo(() => {
        if (!activeSeason || !activeCompetition) return []
        return events
            .filter(s => (s.matches?.season || 'Unknown') === activeSeason && (s.matches?.competition || 'Unknown') === activeCompetition)
            .map(s => ({
                id: s.match_id,
                label: `${format(new Date(s.matches?.date), 'MM/dd')} vs ${s.matches?.opponent}`,
                date: s.matches?.date
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
    }, [events, activeSeason, activeCompetition])

    const activeMatchId = selectedMatchId && matchesList.find(m => m.id === selectedMatchId)
        ? selectedMatchId
        : (matchesList.length > 0 ? matchesList[0].id : '')


    // Handlers
    const handleSeasonChange = (val: string) => {
        setSelectedSeason(val)
        setSelectedCompetition('') // Reset child selections
        setSelectedMatchId('')
    }

    const handleCompetitionChange = (val: string) => {
        setSelectedCompetition(val)
        setSelectedMatchId('') // Reset child selection
    }


    // Filter Data for Cards (Single Match)
    const currentEvent = useMemo(() => {
        return events.find(s => s.match_id === activeMatchId) || {}
    }, [events, activeMatchId])

    const currentStats = currentEvent

    // Filter Data for Charts (Season + Competition trend)
    const trendData = useMemo(() => {
        return events
            .filter(s => (s.matches?.season || 'Unknown') === activeSeason && (s.matches?.competition || 'Unknown') === activeCompetition)
            .sort((a, b) => new Date(a.matches?.date).getTime() - new Date(b.matches?.date).getTime()) // Oldest to Newest for charts
            .map(e => ({
                ...e,
                date: e.matches ? format(new Date(e.matches.date), 'MM/dd') : '',
                opponent: e.matches?.opponent,
            }))
    }, [events, activeSeason, activeCompetition])


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Match Summary</h2>

                <div className="flex flex-wrap gap-2">
                    <Select value={activeSeason} onValueChange={handleSeasonChange}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Season" /></SelectTrigger>
                        <SelectContent>{seasons.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>

                    <Select value={activeCompetition} onValueChange={handleCompetitionChange} disabled={!activeSeason}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Competition" /></SelectTrigger>
                        <SelectContent>{competitions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>

                    <Select value={activeMatchId} onValueChange={setSelectedMatchId} disabled={!activeCompetition}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Match" /></SelectTrigger>
                        <SelectContent>{matchesList.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attacking">Attacking</TabsTrigger>
                    <TabsTrigger value="passing">Passing</TabsTrigger>
                    <TabsTrigger value="defensive">Defensive</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <CardGrid currentStats={currentStats} metrics={[
                        { label: 'Goals', key: 'goals', icon: Trophy, color: 'text-yellow-600' },
                        { label: 'Assists', key: 'assists', icon: Share2, color: 'text-blue-600' },
                        { label: 'xG', key: 'expected_goals', icon: Target, color: 'text-purple-600' },
                        { label: 'Total Actions', key: 'total_actions', icon: Activity },
                        { label: 'Minutes', key: 'minutes_played', icon: Activity },
                    ]} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Goal Contribution Trend</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="goals" stackId="a" fill="#eab308" name="Goals" />
                                        <Bar dataKey="assists" stackId="a" fill="#3b82f6" name="Assists" />
                                        <Line type="monotone" dataKey="expected_goals" stroke="#9333ea" strokeWidth={2} name="xG" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Action Success Rate</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="total_actions" stroke="#cbd5e1" name="Total" />
                                        <Line type="monotone" dataKey="successful_actions" stroke="#22c55e" strokeWidth={2} name="Successful" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="attacking" className="space-y-4">
                    <CardGrid currentStats={currentStats} metrics={[
                        { label: 'Shots', key: 'shots_total', subKey: 'shots_on_target', subLabel: 'On Target', icon: Target, color: 'text-red-500' },
                        { label: 'Dribbles', key: 'dribbles_total', subKey: 'dribbles_successful', subLabel: 'Succ.', icon: Footprints },
                        { label: 'Touches in Box', key: 'touches_in_box', icon: Target },
                        { label: 'Prog. Runs', key: 'progressive_runs', icon: TrendingUp },
                        { label: 'Offsides', key: 'offsides', icon: AlertCircle },
                        { label: 'Shot Assists', key: 'shot_assists', icon: Share2 },
                        { label: 'Off. Duels', key: 'offensive_duels_total', subKey: 'offensive_duels_won', subLabel: 'Won' },
                        { label: 'xA', key: 'expected_assists', icon: Share2 },
                    ]} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Shooting Efficiency</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="shots_total" fill="#cbd5e1" name="Shots" />
                                        <Bar dataKey="shots_on_target" fill="#f87171" name="On Target" />
                                        <Bar dataKey="goals" fill="#ef4444" name="Goals" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Dribbling Success</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="dribbles_total" stackId="1" stroke="#94a3b8" fill="#e2e8f0" name="Total Dribbles" />
                                        <Area type="monotone" dataKey="dribbles_successful" stackId="2" stroke="#22c55e" fill="#bbf7d0" name="Successful" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="passing" className="space-y-4">
                    <CardGrid currentStats={currentStats} metrics={[
                        { label: 'Passes', key: 'passes_total', subKey: 'passes_accurate', subLabel: 'Acc', icon: Share2 },
                        { label: 'Long Balls', key: 'long_balls_total', subKey: 'long_balls_accurate', subLabel: 'Acc' },
                        { label: 'Crosses', key: 'crosses_total', subKey: 'crosses_accurate', subLabel: 'Acc' },
                        { label: 'Final 3rd', key: 'passes_final_third_total', subKey: 'passes_final_third_accurate', subLabel: 'Acc' },
                        { label: 'Penalty Area', key: 'passes_penalty_area_total', subKey: 'passes_penalty_area_accurate', subLabel: 'Acc' },
                        { label: 'Forward', key: 'forward_passes_total', subKey: 'forward_passes_accurate', subLabel: 'Acc' },
                        { label: 'Back', key: 'back_passes_total', subKey: 'back_passes_accurate', subLabel: 'Acc' },
                        { label: 'Through Balls', key: 'through_passes_total', subKey: 'through_passes_accurate', subLabel: 'Acc' },
                    ]} />

                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Passing Accuracy Analysis (Average)</CardTitle></CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            { name: 'Total', total: currentEvent.passes_total, acc: currentEvent.passes_accurate },
                                            { name: 'Forward', total: currentEvent.forward_passes_total, acc: currentEvent.forward_passes_accurate },
                                            { name: 'Long', total: currentEvent.long_balls_total, acc: currentEvent.long_balls_accurate },
                                            { name: 'Final 3rd', total: currentEvent.passes_final_third_total, acc: currentEvent.passes_final_third_accurate },
                                            { name: 'Crosses', total: currentEvent.crosses_total, acc: currentEvent.crosses_accurate },
                                        ]}
                                        layout="vertical"
                                        margin={{ left: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="total" fill="#e2e8f0" name="Attempts" />
                                        <Bar dataKey="acc" fill="#3b82f6" name="Successful" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="defensive" className="space-y-4">
                    <CardGrid currentStats={currentStats} metrics={[
                        { label: 'Def. Duels', key: 'defensive_duels_total', subKey: 'defensive_duels_won', subLabel: 'Won', icon: Shield },
                        { label: 'Aerial Duels', key: 'duels_total', subKey: 'duels_won', subLabel: 'Won' },
                        { label: 'Interceptions', key: 'interceptions', icon: Shield },
                        { label: 'Recoveries', key: 'recoveries_total', subKey: 'recoveries_opp_half', subLabel: 'Opp. Half' },
                        { label: 'Tackles', key: 'sliding_tackles_total', subKey: 'sliding_tackles_successful', subLabel: 'Succ' },
                        { label: 'Clearances', key: 'clearances' },
                        { label: 'Fouls Comm.', key: 'fouls_committed', icon: AlertCircle, color: 'text-orange-500' },
                        { label: 'Yellow Cards', key: 'yellow_cards', icon: AlertCircle, color: 'text-yellow-500' },
                    ]} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Defensive Actions Trend</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="interceptions" stackId="a" fill="#6366f1" name="Interceptions" />
                                        <Bar dataKey="recoveries_total" stackId="a" fill="#8b5cf6" name="Recoveries" />
                                        <Bar dataKey="defensive_duels_won" stackId="a" fill="#14b8a6" name="Duels Won" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Duel Win Rates %</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart
                                        innerRadius="10%"
                                        outerRadius="80%"
                                        data={[
                                            { name: 'Duels', uv: (currentEvent.duels_won / (currentEvent.duels_total || 1)) * 100, fill: '#8884d8' },
                                            { name: 'Def Duels', uv: (currentEvent.defensive_duels_won / (currentEvent.defensive_duels_total || 1)) * 100, fill: '#83a6ed' },
                                            { name: 'Aerial', uv: 50, fill: '#8dd1e1' }, // Placeholder if aerial not specific
                                            { name: 'Loose Ball', uv: (currentEvent.loose_ball_duels_won / (currentEvent.loose_ball_duels_total || 1)) * 100, fill: '#82ca9d' },
                                            { name: 'Off Duels', uv: (currentEvent.offensive_duels_won / (currentEvent.offensive_duels_total || 1)) * 100, fill: '#ffc658' }
                                        ]}
                                        startAngle={180}
                                        endAngle={0}
                                    >
                                        <RadialBar label={{ position: 'insideStart', fill: '#fff' }} background dataKey="uv" />
                                        <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" wrapperStyle={{ top: 0, left: 0, lineHeight: '24px' }} />
                                        <Tooltip />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}



