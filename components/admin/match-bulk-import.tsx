'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

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

interface MatchBulkImportProps {
    onSuccess?: () => void
}

export function MatchBulkImport({ onSuccess }: MatchBulkImportProps) {
    const [csvData, setCsvData] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const supabase = useMemo(() => createClient(), [])

    const handleImport = async () => {
        if (!csvData) {
            toast.error('Please provide CSV data')
            return
        }

        setIsSubmitting(true)
        setLogs([])
        const newLogs: string[] = []

        try {
            const parsed = parseCSV(csvData)
            newLogs.push(`Parsed ${parsed.length} rows. Starting import...`)
            setLogs([...newLogs])

            let successCount = 0
            let errorCount = 0

            for (const row of parsed) {
                // Validate required fields
                if (!row.date || !row.opponent) {
                    newLogs.push(`❌ Error: Missing date or opponent in row: ${JSON.stringify(row)}`)
                    errorCount++
                    setLogs([...newLogs])
                    continue
                }

                // Construct payload
                const payload: Record<string, string | number | null> = {
                    date: row.date,
                    opponent: row.opponent,
                    location: row.location || 'Home',
                    season: row.season || '2023/24', // Default season if missing?
                    competition: row.competition || null,
                    result: row.result || null
                }

                // Check if match already exists (by date and opponent) to prevent duplicates?
                // For now, let's just insert. Duplicate checks might be complex with dates. 
                // Actually, let's try to check to avoid double imports.
                const { data: existingMatch } = await supabase
                    .from('matches')
                    .select('id')
                    .eq('date', payload.date)
                    .eq('opponent', payload.opponent)
                    .single()

                let error
                if (existingMatch) {
                    newLogs.push(`⚠️ Skipped: Match vs ${payload.opponent} on ${payload.date} already exists.`)
                    // We could update, but maybe safer to skip for matches? 
                    // Let's skip for now to be safe.
                } else {
                    const { error: insertError } = await supabase
                        .from('matches')
                        .insert(payload)
                    error = insertError

                    if (error) {
                        newLogs.push(`❌ Error: ${error.details || error.message}`)
                        errorCount++
                    } else {
                        newLogs.push(`✅ Imported match vs ${payload.opponent}`)
                        successCount++
                    }
                }
                setLogs([...newLogs])
            }

            toast.success(`Import complete. Success: ${successCount}, Failed: ${errorCount}`)
            if (successCount > 0 && onSuccess) {
                onSuccess()
            }
        } catch (e: unknown) {
            console.error(e)
            toast.error('Failed to parse or import CSV')
            const msg = e instanceof Error ? e.message : 'Unknown error'
            newLogs.push(`💥 Critical Error: ${msg}`)
            setLogs([...newLogs])
        } finally {
            setIsSubmitting(false)
        }
    }

    const exampleCSV = `date,opponent,location,season,competition,result
2024-03-01,FC Barcelona,Away,2023/24,La Liga,2-1
2024-03-08,Real Madrid,Home,2023/24,La Liga,`

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Paste CSV Data</Label>
                <p className="text-xs text-muted-foreground">
                    Headers: <code>date, opponent, location, season, competition, result</code>.
                    Date format: YYYY-MM-DD.
                </p>
                <Textarea
                    placeholder={exampleCSV}
                    className="h-[200px] font-mono text-xs"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                />
            </div>

            <Button onClick={handleImport} disabled={isSubmitting || !csvData}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                    </>
                ) : (
                    <>
                        <Upload className="mr-2 h-4 w-4" />
                        Start Import
                    </>
                )}
            </Button>

            {logs.length > 0 && (
                <div className="rounded-md bg-muted p-4">
                    <h3 className="mb-2 font-semibold">Import Log</h3>
                    <div className="max-h-[200px] overflow-y-auto space-y-1 text-sm font-mono">
                        {logs.map((log, i) => (
                            <div key={i} className={log.startsWith('❌') || log.startsWith('💥') ? 'text-red-500' : log.startsWith('⚠️') ? 'text-yellow-600' : 'text-green-600'}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
