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
import { PlusCircle, Upload, Trash2, Edit } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { GameEventsBulkImport } from '@/components/admin/game-events-bulk-import'
import { GameEventsMappingImport } from '@/components/admin/game-events-mapping-import'
import { GameEventsForm } from '@/components/admin/game-events-form'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export default function GameEventsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [events, setEvents] = useState<Record<string, any>[]>([])
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [importOpen, setImportOpen] = useState(false)
    const [mappingOpen, setMappingOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const supabase = React.useMemo(() => createClient(), [])

    const fetchEvents = React.useCallback(async () => {
        const { data, error } = await supabase
            .from('game_events')
            .select('*')
            .select(`
                *,
                profiles (full_name, email),
                matches (date, opponent)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching game events:', error)
            toast.error('Failed to fetch game events')
        } else {
            setEvents(data || [])
            setSelectedIds(new Set())
        }
    }, [supabase])

    useEffect(() => {
        const load = async () => {
            await fetchEvents()
        }
        load()
    }, [fetchEvents])

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(events.map(s => s.id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds)
        if (checked) {
            newSet.add(id)
        } else {
            newSet.delete(id)
        }
        setSelectedIds(newSet)
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) return

        const { error } = await supabase
            .from('game_events')
            .delete()
            .in('id', Array.from(selectedIds))

        if (error) {
            toast.error('Failed to delete records')
            console.error(error)
        } else {
            toast.success('Records deleted successfully')
            fetchEvents()
        }
    }

    const selectedEventForEdit = events.find(s => selectedIds.has(s.id))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Game Events</h2>
                    <p className="text-muted-foreground">
                        Detailed match events tracking.
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedIds.size})
                        </Button>
                    )}

                    {selectedIds.size === 1 && (
                        <Dialog open={editOpen} onOpenChange={setEditOpen}>
                            <DialogTrigger asChild>
                                <Button variant="secondary">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Edit Game Event</DialogTitle>
                                    <DialogDescription>
                                        Update event details.
                                    </DialogDescription>
                                </DialogHeader>
                                {selectedEventForEdit && (
                                    <GameEventsForm
                                        initialData={selectedEventForEdit}
                                        onSuccess={() => {
                                            setEditOpen(false)
                                            fetchEvents()
                                        }}
                                    />
                                )}
                            </DialogContent>
                        </Dialog>
                    )}

                    <Dialog open={importOpen} onOpenChange={setImportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Bulk Import
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Bulk Import</DialogTitle>
                                <DialogDescription>
                                    Paste CSV data to import multiple records at once.
                                </DialogDescription>
                            </DialogHeader>
                            <GameEventsBulkImport onSuccess={() => {
                                setImportOpen(false)
                                fetchEvents()
                            }} />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Import via Mapping
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Import via Mapping</DialogTitle>
                                <DialogDescription>
                                    Upload a CSV and map columns to database fields.
                                </DialogDescription>
                            </DialogHeader>
                            <GameEventsMappingImport onSuccess={() => {
                                setMappingOpen(false)
                                fetchEvents()
                            }} />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add Game Event</DialogTitle>
                                <DialogDescription>
                                    Enter detailed match stats.
                                </DialogDescription>
                            </DialogHeader>
                            <GameEventsForm
                                onSuccess={() => {
                                    setOpen(false)
                                    fetchEvents()
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
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedIds.size === events.length && events.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead>Match</TableHead>
                            <TableHead>Pos</TableHead>
                            <TableHead>Mins</TableHead>
                            <TableHead>Goals</TableHead>
                            <TableHead>Assists</TableHead>
                            <TableHead>Rating/Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No events found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((evt) => (
                                <TableRow key={evt.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(evt.id)}
                                            onCheckedChange={(checked) => handleSelectOne(evt.id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {evt.profiles?.full_name || evt.profiles?.email}
                                    </TableCell>
                                    <TableCell>
                                        {evt.matches ? `${format(new Date(evt.matches.date), 'MM/dd')} vs ${evt.matches.opponent}` : '-'}
                                    </TableCell>
                                    <TableCell>{evt.position || '-'}</TableCell>
                                    <TableCell>{evt.minutes_played}</TableCell>
                                    <TableCell>{evt.goals}</TableCell>
                                    <TableCell>{evt.assists}</TableCell>
                                    <TableCell>{evt.total_actions}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
