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

interface GameEventsBulkImportProps {
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

export function GameEventsBulkImport({ onSuccess }: GameEventsBulkImportProps) {
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

            // Insert into game_events table
            const { error } = await supabase
                .from('game_events')
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
            toast.success(`Imported ${successCount} events successfully`)
            setCsvData('')
            if (onSuccess) onSuccess()
        } else {
            toast.error('No events imported')
        }
        setIsSubmitting(false)
    }

    const exampleCSV = `minutes_played,goals,assists,shots_total,passes_total,passes_accurate
90,1,0,3,45,40`

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>1. Select Player</Label>
                    <Select onValueChange={(val) => {
                        setSelectedPlayer(val)
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
                <Label>3. Paste CSV Data</Label>
                <p className="text-xs text-muted-foreground">
                    Headers must match database columns exactly.
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
                        Import Events
                    </>
                )}
            </Button>

            {logs.length > 0 && (
                <div className="rounded-md bg-muted p-4">
                    <h3 className="mb-2 font-semibold">Import Log</h3>
                    <div className="max-h-[200px] overflow-y-auto space-y-1 text-sm font-mono">
                        {logs.map((log, i) => (
                            <div key={i} className={log.startsWith('Row') && log.includes('Error') ? 'text-red-500' : 'text-green-600'}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
