'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

// Simple CSV parser
const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map((h) => h.trim())
    const result: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
        const obj: Record<string, string> = {}
        const currentline = lines[i].split(',')

        // Skip empty lines
        if (currentline.length <= 1 && currentline[0].trim() === '') continue;

        for (let j = 0; j < headers.length; j++) {
            const value = currentline[j]?.trim()
            if (value !== undefined && value !== '') {
                obj[headers[j]] = value
            }
        }
        result.push(obj)
    }
    return result
}

interface BulkImportFormProps {
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

export function BulkImportForm({ onSuccess }: BulkImportFormProps) {
    const [matches, setMatches] = useState<Match[]>([])
    const [players, setPlayers] = useState<Player[]>([])
    const [selectedMatch, setSelectedMatch] = useState<string>('')
    const [selectedPlayer, setSelectedPlayer] = useState<string>('')
    const [csvData, setCsvData] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const supabase = useMemo(() => createClient(), [])

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
    }, [supabase])

    async function processImport() {
        if (!csvData) return
        if (!selectedPlayer) {
            toast.error('Select a player')
            return
        }

        setIsSubmitting(true)
        setLogs([])
        const rows = parseCSV(csvData)
        let successCount = 0
        const tempLogs: string[] = []

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]

            // Basic payload construction
            const payload: Record<string, string | number | null> = {
                player_id: selectedPlayer,
                match_id: selectedMatch || row.match_id
            }

            // Copy CSV fields to payload
            Object.keys(row).forEach(key => {
                if (key !== 'match_id') {
                    const val = row[key]
                    // Try to parse number
                    const num = parseFloat(val)
                    payload[key] = isNaN(num) ? val : num
                }
            })

            if (!payload.match_id) {
                tempLogs.push(`Row ${i + 1}: Skipped - No match ID found`)
                continue
            }

            // Insert
            const { error } = await supabase
                .from('performance_stats')
                .insert(payload)

            if (error) {
                tempLogs.push(`Row ${i + 1}: Error - ${error.message}`)
            } else {
                successCount++
                tempLogs.push(`Row ${i + 1}: Success`)
            }
        }

        setLogs(tempLogs)
        if (successCount > 0) {
            toast.success(`Imported ${successCount} stats successfully`)
            setCsvData('')
            if (onSuccess) onSuccess()
        } else {
            toast.error('No stats imported')
        }
        setIsSubmitting(false)
    }

    const exampleCSV = `minutes,total_distance,distance_min,training_load,max_speed,distance_over_20_kmh,distance_over_25_kmh,number_acc_over_25_kmh,distance_acc_over_2_5_ms,distance_dec_over_2_5_ms,distance_hi_min,distance_acc_hi_min,distance_dece_hi_min,distance_mphi,eee,strength_index,pct_distance_sprint_hi,pct_distance_acc_hi,pct_distance_dec_hi,pct_distance_mphi,amp,equivalent_relative_distance,pct_equivalent_relative_distance,distance_over_80_pct_max_speed,distance_over_90_pct_max_speed,pct_ai,player_load,distance_over_14_4_kmh,distance_over_21_kmh,distance_over_25_w_kg,number_acc_over_3_ms,number_dec_under_minus_3_ms
90,10500,116.7,450,32.5,1200,350,15,400,380,12.5,5.2,4.8,1100,2500,85,12,8,7,65,350,11000,104,800,400,92,500,1500,400,750,20,18`

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>1. Select Player</Label>
                    <Select onValueChange={(val) => {
                        setSelectedPlayer(val)
                        // Reset match if required
                    }} value={selectedPlayer}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a player" />
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
                    <Label>2. Select Match</Label>
                    <Select
                        onValueChange={setSelectedMatch}
                        value={selectedMatch}
                        disabled={!selectedPlayer}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={!selectedPlayer ? "Select player first" : "Select a match"} />
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
                <Label>3. Paste CSV Data (for selected player)</Label>
                <p className="text-xs text-muted-foreground">
                    Headers must match database columns. See the example above for the full list of supported metrics.
                </p>
                <Textarea
                    placeholder={exampleCSV}
                    className="h-[200px] font-mono text-xs"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                />
            </div>

            <Button onClick={processImport} disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                    </>
                ) : (
                    <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Stats
                    </>
                )}
            </Button>

            {logs.length > 0 && (
                <div className="rounded-md bg-muted p-4">
                    <h3 className="mb-2 font-semibold">Import Log</h3>
                    <div className="max-h-[200px] overflow-y-auto space-y-1 text-sm font-mono">
                        {logs.map((log, i) => (
                            <div key={i} className={log.startsWith('❌') || log.startsWith('💥') ? 'text-red-500' : 'text-green-600'}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
