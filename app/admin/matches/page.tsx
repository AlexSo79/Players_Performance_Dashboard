'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { MatchForm } from '@/components/admin/match-form'
import { format } from 'date-fns'
import { MatchBulkImport } from '@/components/admin/match-bulk-import'
import { Upload, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface Match {
    id: string
    date: string
    opponent: string
    location: 'Home' | 'Away'
    result: string | null
    season: string | null
    competition: string | null
}

export default function MatchesPage() {
    const [matches, setMatches] = useState<Match[]>([])
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
    const supabase = React.useMemo(() => createClient(), [])

    const fetchMatches = React.useCallback(async () => {
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .order('date', { ascending: false })

        if (error) {
            console.error('Error fetching matches:', error)
            toast.error('Failed to fetch matches')
        } else {
            setMatches(data || [])
        }
    }, [supabase])

    useEffect(() => {
        const load = async () => {
            await fetchMatches()
        }
        load()
    }, [fetchMatches])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this match? This action cannot be undone.')) return

        const { error } = await supabase
            .from('matches')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting match:', error)
            toast.error('Failed to delete match')
        } else {
            toast.success('Match deleted successfully')
            fetchMatches()
        }
    }

    const handleEdit = (match: Match) => {
        setSelectedMatch(match)
        setEditOpen(true)
    }



    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Matches</h2>
                    <p className="text-muted-foreground">
                        Manage match schedule and results.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Bulk Import
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Bulk Import Matches</DialogTitle>
                                <DialogDescription>
                                    Paste your CSV data below to import multiple matches.
                                </DialogDescription>
                            </DialogHeader>
                            <MatchBulkImport onSuccess={() => {
                                fetchMatches()
                            }} />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Match</DialogTitle>
                                <DialogDescription>
                                    Update the details of the match below.
                                </DialogDescription>
                            </DialogHeader>
                            {selectedMatch && (
                                <MatchForm
                                    initialData={selectedMatch}
                                    onSuccess={() => {
                                        setEditOpen(false)
                                        fetchMatches()
                                    }}
                                />
                            )}
                        </DialogContent>
                    </Dialog>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Match
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Match</DialogTitle>
                                <DialogDescription>
                                    Enter the details of the match below.
                                </DialogDescription>
                            </DialogHeader>
                            <MatchForm
                                onSuccess={() => {
                                    setOpen(false)
                                    fetchMatches()
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Opponent</TableHead>
                            <TableHead>Competition</TableHead>
                            <TableHead>Season</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {matches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No matches found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            matches.map((match) => (
                                <TableRow key={match.id}>
                                    <TableCell>
                                        {format(new Date(match.date), 'PPP')}
                                    </TableCell>
                                    <TableCell>{match.opponent}</TableCell>
                                    <TableCell>{match.competition || '-'}</TableCell>
                                    <TableCell>{match.season || '-'}</TableCell>
                                    <TableCell>{match.location}</TableCell>
                                    <TableCell>{match.result || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(match)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(match.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
