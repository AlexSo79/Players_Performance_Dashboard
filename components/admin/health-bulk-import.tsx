'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, FileQuestion } from 'lucide-react'
import { toast } from 'sonner'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

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

interface HealthBulkImportFormProps {
    onSuccess?: () => void
}

export function HealthBulkImportForm({ onSuccess }: HealthBulkImportFormProps) {
    const [csvData, setCsvData] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [players, setPlayers] = useState<{ id: string; full_name: string | null; email: string | null }[]>([])
    const [selectedPlayer, setSelectedPlayer] = useState<string>('')
    const [logs, setLogs] = useState<string[]>([])
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const fetchPlayers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('role', 'player')
                .order('full_name', { ascending: true })
            if (data) setPlayers(data)
        }
        fetchPlayers()
    }, [supabase])

    const exampleCSV = `date,injury_status,fatigue_level,sleep_hours,hrv,rhr,strain,notes
2024-01-20,Fit,3,8.5,120,45,14.5,Feeling good
2024-01-21,Recovery,5,7.2,110,48,12.0,Light session`

    async function processImport() {
        if (!csvData) return
        if (!selectedPlayer) {
            toast.error('Please select a player first (unless player_id is in CSV, but easier to select here for single player import)')
            // Note: For now, we enforce selecting a player to keep it simple and consistent with other imports
            return
        }

        setIsSubmitting(true)
        setLogs([])
        const rows = parseCSV(csvData)
        let successCount = 0
        const tempLogs: string[] = []

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            try {
                // Map CSV fields to DB columns
                const payload = {
                    player_id: selectedPlayer,
                    date: row.date || new Date().toISOString().split('T')[0],
                    injury_status: row.injury_status || 'Fit',
                    fatigue_level: row.fatigue_level ? Number(row.fatigue_level) : null,
                    sleep_hours: row.sleep_hours ? Number(row.sleep_hours) : null,
                    hrv: row.hrv ? Number(row.hrv) : null,
                    rhr: row.rhr ? Number(row.rhr) : null,
                    strain: row.strain ? Number(row.strain) : null,
                    notes: row.notes || null
                }

                const { error } = await supabase
                    .from('health_monitoring_stats')
                    .insert(payload)

                if (error) throw error
                successCount++
                tempLogs.push(`✅ Imported date ${payload.date}`)
            } catch (err) {
                console.error(err)
                tempLogs.push(`❌ Error row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
            }
        }

        setLogs(tempLogs)
        setIsSubmitting(false)
        if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} records`)
            setCsvData('')
            onSuccess?.()
        } else {
            toast.error('No records imported')
        }
    }

    return (
        <div className="space-y-4">
            <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                <div className="flex flex-col space-y-2">
                    <Label>Step 1: Select Player</Label>
                    <Select onValueChange={setSelectedPlayer} value={selectedPlayer}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select player to import for..." />
                        </SelectTrigger>
                        <SelectContent>
                            {players.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>Step 2: Paste CSV Data</Label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCsvData(exampleCSV)}
                            type="button"
                        >
                            Load Example
                        </Button>
                    </div>
                    <Textarea
                        placeholder="Paste your CSV here..."
                        value={csvData}
                        onChange={(e) => setCsvData(e.target.value)}
                        className="h-[200px] font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                        Required Header: {exampleCSV.split('\n')[0]}
                    </p>
                </div>
            </div>

            {logs.length > 0 && (
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md max-h-40 overflow-y-auto text-xs font-mono">
                    {logs.map((log, i) => (
                        <div key={i} className={log.startsWith('❌') ? 'text-red-500' : 'text-green-600'}>
                            {log}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={processImport} disabled={isSubmitting || !csvData || !selectedPlayer}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                </Button>
            </div>
        </div>
    )
}
