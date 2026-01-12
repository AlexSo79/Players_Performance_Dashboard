'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

// Database Columns available for mapping for game_events
const DB_COLUMNS = [
    { label: 'Minutes', value: 'minutes_played' },
    { label: 'Goals', value: 'goals' },
    { label: 'Assists', value: 'assists' },
    { label: 'Total Actions', value: 'total_actions' },
    { label: 'Successful Actions', value: 'successful_actions' },
    { label: 'Shots Total', value: 'shots_total' },
    { label: 'Shots on Target', value: 'shots_on_target' },
    { label: 'xG', value: 'expected_goals' },
    { label: 'Passes Total', value: 'passes_total' },
    { label: 'Passes Accurate', value: 'passes_accurate' },
    { label: 'Long Balls Total', value: 'long_balls_total' },
    { label: 'Long Balls Accurate', value: 'long_balls_accurate' },
    { label: 'Crosses Total', value: 'crosses_total' },
    { label: 'Crosses Accurate', value: 'crosses_accurate' },
    { label: 'Dribbles Total', value: 'dribbles_total' },
    { label: 'Dribbles Successful', value: 'dribbles_successful' },
    { label: 'Duels Total', value: 'duels_total' },
    { label: 'Duels Won', value: 'duels_won' },
    { label: 'Interceptions', value: 'interceptions' },
    { label: 'Possession Lost Total', value: 'possession_lost_total' },
    { label: 'Possession Lost Own Half', value: 'possession_lost_own_half' },
    { label: 'Recoveries Total', value: 'recoveries_total' },
    { label: 'Recoveries Opp Half', value: 'recoveries_opp_half' },
    { label: 'Yellow Card Minute', value: 'yellow_card_minute' },
    { label: 'Red Card Minute', value: 'red_card_minute' },
    { label: 'Defensive Duels Total', value: 'defensive_duels_total' },
    { label: 'Defensive Duels Won', value: 'defensive_duels_won' },
    { label: 'Loose Ball Duels Total', value: 'loose_ball_duels_total' },
    { label: 'Loose Ball Duels Won', value: 'loose_ball_duels_won' },
    { label: 'Sliding Tackles Total', value: 'sliding_tackles_total' },
    { label: 'Sliding Tackles Successful', value: 'sliding_tackles_successful' },
    { label: 'Clearances', value: 'clearances' },
    { label: 'Fouls Committed', value: 'fouls_committed' },
    { label: 'Yellow Cards', value: 'yellow_cards' },
    { label: 'Red Cards', value: 'red_cards' },
    { label: 'Shot Assists', value: 'shot_assists' },
    { label: 'Offensive Duels Total', value: 'offensive_duels_total' },
    { label: 'Offensive Duels Won', value: 'offensive_duels_won' },
    { label: 'Touches in Box', value: 'touches_in_box' },
    { label: 'Offsides', value: 'offsides' },
    { label: 'Progressive Runs', value: 'progressive_runs' },
    { label: 'Fouls Suffered', value: 'fouls_suffered' },
    { label: 'Through Passes Total', value: 'through_passes_total' },
    { label: 'Through Passes Accurate', value: 'through_passes_accurate' },
    { label: 'xA', value: 'expected_assists' },
    { label: 'Second Assists', value: 'second_assists' },
    { label: 'Passes Final 3rd Total', value: 'passes_final_third_total' },
    { label: 'Passes Final 3rd Acc', value: 'passes_final_third_accurate' },
    { label: 'Passes Penalty Area Total', value: 'passes_penalty_area_total' },
    { label: 'Passes Penalty Area Acc', value: 'passes_penalty_area_accurate' },
    { label: 'Passes Received', value: 'passes_received' },
    { label: 'Forward Passes Total', value: 'forward_passes_total' },
    { label: 'Forward Passes Acc', value: 'forward_passes_accurate' },
    { label: 'Back Passes Total', value: 'back_passes_total' },
    { label: 'Back Passes Acc', value: 'back_passes_accurate' },
]

interface GameEventsMappingImportProps {
    onSuccess?: () => void
}

interface Match {
    id: string
    date: string
    opponent: string | null
}

interface Player {
    id: string
    full_name: string | null
    email: string | null
}

export function GameEventsMappingImport({ onSuccess }: GameEventsMappingImportProps) {
    const [step, setStep] = useState(1)
    const [matches, setMatches] = useState<Match[]>([])
    const [players, setPlayers] = useState<Player[]>([])
    const [selectedMatch, setSelectedMatch] = useState<string>('')
    const [selectedPlayer, setSelectedPlayer] = useState<string>('')
    const [csvHeaders, setCsvHeaders] = useState<string[]>([])
    const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
    const [mapping, setMapping] = useState<Record<string, string>>({}) // CSV Header -> DB Column
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [savedMappings, setSavedMappings] = useState<string[]>([])
    const [mappingName, setMappingName] = useState('')

    const supabase = React.useMemo(() => createClient(), [])

    // Reset state on mount
    useEffect(() => {
        setStep(1)
        setCsvHeaders([])
        setCsvRows([])
        setMapping({})
        setMappingName('')
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            const { data: matchesData } = await supabase
                .from('matches')
                .select('id, date, opponent')
                .order('date', { ascending: false })

            const { data: playersData } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name', { ascending: true })

            if (matchesData) setMatches(matchesData)
            if (playersData) setPlayers(playersData)
        }
        fetchData()
        loadSavedMappings()
    }, [supabase])

    const loadSavedMappings = () => {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('event_mapping_'))
        setSavedMappings(keys.map(k => k.replace('event_mapping_', '')))
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            const lines = text.trim().split('\n')
            if (lines.length < 1) return

            // Parse headers (trim quotes and spaces)
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
            setCsvHeaders(headers)

            const rows = []
            for (let i = 1; i < lines.length; i++) {
                const currentline = lines[i].split(',')
                if (currentline.length <= 1 && currentline[0].trim() === '') continue

                const obj: Record<string, string> = {}
                for (let j = 0; j < headers.length; j++) {
                    const val = currentline[j]?.trim().replace(/^"|"$/g, '')
                    if (val !== undefined) {
                        obj[headers[j]] = val
                    }
                }
                rows.push(obj)
            }
            setCsvRows(rows)
            setStep(2)
        }
        reader.readAsText(file)
    }

    const handleLoadMapping = (name: string) => {
        const saved = localStorage.getItem(`event_mapping_${name}`)
        if (saved) {
            setMapping(JSON.parse(saved))
            setMappingName(name)
            toast.success(`Loaded mapping: ${name}`)
        }
    }

    const handleSaveMapping = () => {
        if (!mappingName) {
            toast.error('Enter a name for this mapping')
            return
        }
        localStorage.setItem(`event_mapping_${mappingName}`, JSON.stringify(mapping))
        toast.success('Mapping saved')
        loadSavedMappings()
    }

    const processImport = async () => {
        setIsSubmitting(true)
        try {
            // Validate mapping
            const mappedValues = Object.values(mapping).filter(v => v !== 'ignore')
            if (mappedValues.length === 0) {
                toast.error('Map at least one field')
                return
            }

            let successCount = 0

            for (const row of csvRows) {
                const payload: Record<string, string | number | null | undefined> = {
                    player_id: selectedPlayer,
                    match_id: selectedMatch
                }

                // Apply mapped fields
                csvHeaders.forEach(csvHeader => {
                    const dbCol = mapping[csvHeader]
                    const val = row[csvHeader]

                    if (val && dbCol && dbCol !== 'ignore') {
                        // Handle numeric parsing carefully
                        const num = parseFloat(val)
                        if (!isNaN(num)) {
                            payload[dbCol] = num
                        }
                    }
                })

                if (Object.keys(payload).length <= 2) {
                    console.warn("Row skipped, no matching stats found using mapping", row)
                    continue;
                }

                const { error } = await supabase.from('game_events').insert(payload)
                if (error) throw error
                successCount++
            }

            toast.success(`Imported ${successCount} event rows successfully`)
            if (onSuccess) onSuccess()

        } catch (error: unknown) {
            console.error(error)
            const msg = error instanceof Error ? error.message : 'Unknown error'
            toast.error('Import failed: ' + msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleBack = () => {
        setStep(1)
        setCsvRows([])
        setCsvHeaders([])
    }

    const autoMap = () => {
        const newMapping = { ...mapping }
        csvHeaders.forEach(header => {
            const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '')
            const match = DB_COLUMNS.find(col => {
                const normalizedDb = col.value.replace(/_/g, '')
                const normalizedLabel = col.label.toLowerCase().replace(/[^a-z0-9]/g, '')
                return normalizedDb === normalizedHeader || normalizedLabel === normalizedHeader || normalizedDb.includes(normalizedHeader)
            })
            if (match) {
                newMapping[header] = match.value
            }
        })
        setMapping(newMapping)
        toast.info('Auto-mapped fields based on similar names')
    }

    return (
        <div className="space-y-6">

            {/* Steps Indicator */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                <span className={step === 1 ? 'font-bold text-primary' : ''}>1. Upload</span>
                <ArrowRight className="h-4 w-4" />
                <span className={step === 2 ? 'font-bold text-primary' : ''}>2. Map & Import</span>
            </div>

            {step === 1 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Select Player</Label>
                            <Select onValueChange={setSelectedPlayer} value={selectedPlayer}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select player" />
                                </SelectTrigger>
                                <SelectContent>
                                    {players.map((player) => (
                                        <SelectItem key={player.id} value={player.id}>
                                            {player.full_name || player.email || 'Unknown'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Select Match</Label>
                            <Select onValueChange={setSelectedMatch} value={selectedMatch}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select match" />
                                </SelectTrigger>
                                <SelectContent>
                                    {matches.map((match) => (
                                        <SelectItem key={match.id} value={match.id}>
                                            {format(new Date(match.date), 'MM/dd')} vs {match.opponent}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Upload CSV File</Label>
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            disabled={!selectedPlayer || !selectedMatch}
                        />
                        <p className="text-xs text-muted-foreground">Select a player and match to enable upload.</p>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Map Columns</h3>
                        <Button variant="outline" size="sm" onClick={autoMap}>Auto-Map</Button>
                    </div>

                    <div className="flex gap-2 items-end mb-4">
                        <div className="space-y-1 flex-1">
                            <Label>Load Saved Mapping</Label>
                            <Select onValueChange={handleLoadMapping}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select saved mapping..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {savedMappings.map(name => (
                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1 flex-1">
                            <Label>Save Mapping As</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. Wyscout Event Import"
                                    value={mappingName}
                                    onChange={e => setMappingName(e.target.value)}
                                />
                                <Button size="icon" variant="secondary" onClick={handleSaveMapping}>
                                    <Save className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                                <tr>
                                    <th className="p-2 text-left">CSV Header</th>
                                    <th className="p-2 text-left">Database Column</th>
                                </tr>
                            </thead>
                            <tbody>
                                {csvHeaders.map((header) => (
                                    <tr key={header} className="border-t">
                                        <td className="p-2 font-mono">{header}</td>
                                        <td className="p-2">
                                            <Select
                                                value={mapping[header] || ''}
                                                onValueChange={(val) => setMapping(prev => ({ ...prev, [header]: val }))}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Ignore" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ignore">-- Ignore --</SelectItem>
                                                    {DB_COLUMNS.map(col => (
                                                        <SelectItem key={col.value} value={col.value}>
                                                            {col.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={handleBack}>Back</Button>
                        <Button onClick={processImport} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            Import Events
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
