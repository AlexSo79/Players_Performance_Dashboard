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
import { StatsForm } from '@/components/admin/stats-form'
import { BulkImportForm } from '@/components/admin/bulk-import-form'
import { MappingImportForm } from '@/components/admin/mapping-import-form'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export default function StatsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [stats, setStats] = useState<Record<string, any>[]>([])
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [bulkOpen, setBulkOpen] = useState(false)
    const [mappingOpen, setMappingOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const supabase = React.useMemo(() => createClient(), [])

    const fetchStats = React.useCallback(async () => {
        const { data, error } = await supabase
            .from('performance_stats')
            .select('*')
            .select(`
                *,
                profiles (full_name, email),
                matches (date, opponent)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching stats:', error)
        } else {
            // Sort by match date descending
            const sortedData = (data || []).sort((a, b) => {
                const dateA = new Date(a.matches?.date || 0).getTime()
                const dateB = new Date(b.matches?.date || 0).getTime()
                return dateB - dateA
            })
            setStats(sortedData)
            setSelectedIds(new Set()) // Clear selection on refresh
        }
    }, [supabase])

    useEffect(() => {
        const load = async () => {
            await fetchStats()
        }
        load()
    }, [fetchStats])

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(stats.map(s => s.id)))
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
            .from('performance_stats')
            .delete()
            .in('id', Array.from(selectedIds))

        if (error) {
            toast.error('Failed to delete records')
            console.error(error)
        } else {
            toast.success('Records deleted successfully')
            fetchStats()
        }
    }

    const selectedStatForEdit = stats.find(s => selectedIds.has(s.id))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Player Stats</h2>
                    <p className="text-muted-foreground">
                        Input and view performance metrics.
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
                            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Edit Performance Data</DialogTitle>
                                    <DialogDescription>
                                        Update stats for the selected record.
                                    </DialogDescription>
                                </DialogHeader>
                                {selectedStatForEdit && (
                                    <StatsForm
                                        initialData={selectedStatForEdit}
                                        onSuccess={() => {
                                            setEditOpen(false)
                                            fetchStats()
                                        }}
                                    />
                                )}
                            </DialogContent>
                        </Dialog>
                    )}

                    <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Bulk Import
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Bulk Import Stats</DialogTitle>
                                <DialogDescription>
                                    Paste CSV data to import multiple stats at once.
                                </DialogDescription>
                            </DialogHeader>
                            <BulkImportForm
                                onSuccess={() => {
                                    setBulkOpen(false)
                                    fetchStats()
                                }}
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Import with Mapping
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Import with Mapping</DialogTitle>
                                <DialogDescription>
                                    Upload a CSV and map columns to database fields.
                                </DialogDescription>
                            </DialogHeader>
                            <MappingImportForm
                                onSuccess={() => {
                                    setMappingOpen(false)
                                    fetchStats()
                                }}
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Stats
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add Performance Data</DialogTitle>
                                <DialogDescription>
                                    Select a player and match to input stats.
                                </DialogDescription>
                            </DialogHeader>
                            <StatsForm
                                onSuccess={() => {
                                    setOpen(false)
                                    fetchStats()
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
                                    checked={selectedIds.size === stats.length && stats.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead>Match</TableHead>
                            <TableHead>Minutes</TableHead>
                            <TableHead>Distance</TableHead>
                            <TableHead>Max Speed</TableHead>
                            <TableHead>Training Load</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No stats found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            stats.map((stat) => (
                                <TableRow key={stat.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(stat.id)}
                                            onCheckedChange={(checked) => handleSelectOne(stat.id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {stat.profiles?.full_name || stat.profiles?.email}
                                    </TableCell>
                                    <TableCell>
                                        {stat.matches ? `${format(new Date(stat.matches.date), 'yyyy/MM/dd')} vs ${stat.matches.opponent}` : '-'}
                                    </TableCell>
                                    <TableCell>{stat.minutes}</TableCell>
                                    <TableCell>{stat.total_distance ? Math.round(stat.total_distance) : '-'}</TableCell>
                                    <TableCell>{stat.max_speed}</TableCell>
                                    <TableCell>{stat.training_load}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
