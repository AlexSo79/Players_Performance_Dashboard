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
import { HealthForm } from '@/components/admin/health-form'
import { HealthBulkImportForm } from '@/components/admin/health-bulk-import'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { HealthStats } from '@/types/health'

export default function HealthPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<(HealthStats & { profiles: any })[]>([])
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [bulkOpen, setBulkOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [editingRecord, setEditingRecord] = useState<HealthStats | undefined>(undefined)

    const supabase = React.useMemo(() => createClient(), [])

    const fetchData = React.useCallback(async () => {
        const { data: healthData, error } = await supabase
            .from('health_monitoring_stats')
            .select(`
                *,
                profiles (full_name, email)
            `)
            .order('date', { ascending: false })

        if (error) {
            console.error('Error fetching health stats:', error)
            toast.error('Failed to load health stats')
        } else {
            setData((healthData as any) || [])
            setSelectedIds(new Set())
        }
    }, [supabase])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(data.map(d => d.id)))
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
            .from('health_monitoring_stats')
            .delete()
            .in('id', Array.from(selectedIds))

        if (error) {
            toast.error('Failed to delete records')
            console.error(error)
        } else {
            toast.success('Records deleted')
            fetchData()
        }
    }

    const handleEdit = (record: HealthStats) => {
        setEditingRecord(record)
        setEditOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Health & Wellness</h2>
                    <p className="text-muted-foreground">
                        Manage player health data, fatigue levels, and recovery metrics.
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedIds.size})
                        </Button>
                    )}

                    <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Import CSV
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Bulk Import Health Data</DialogTitle>
                                <DialogDescription>
                                    Paste CSV data to upload multiple records at once.
                                </DialogDescription>
                            </DialogHeader>
                            <HealthBulkImportForm onSuccess={() => {
                                setBulkOpen(false)
                                fetchData()
                            }} />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingRecord(undefined)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Record
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Add Health Record</DialogTitle>
                                <DialogDescription>
                                    Manually enter daily health stats for a player.
                                </DialogDescription>
                            </DialogHeader>
                            <HealthForm onSuccess={() => {
                                setOpen(false)
                                fetchData()
                            }} />
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Edit Health Record</DialogTitle>
                            </DialogHeader>
                            {editingRecord && (
                                <HealthForm
                                    initialData={editingRecord as any}
                                    onSuccess={() => {
                                        setEditOpen(false)
                                        fetchData()
                                    }}
                                />
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <Checkbox
                                    checked={data.length > 0 && selectedIds.size === data.length}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Fatigue</TableHead>
                            <TableHead>Sleep</TableHead>
                            <TableHead>HRV</TableHead>
                            <TableHead>RHR</TableHead>
                            <TableHead>Strain</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                    No health records found. Click "Add Record" to start tracking.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(record.id)}
                                            onCheckedChange={(checked) => handleSelectOne(record.id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell>{format(new Date(record.date), 'yyyy/MM/dd')}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{record.profiles?.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-muted-foreground">{record.profiles?.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                            ${record.injury_status === 'Fit' ? 'bg-green-100 text-green-800' :
                                                record.injury_status === 'Injured' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {record.injury_status || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{record.fatigue_level ?? '-'}</TableCell>
                                    <TableCell>{record.sleep_hours ?? '-'}</TableCell>
                                    <TableCell>{record.hrv ?? '-'}</TableCell>
                                    <TableCell>{record.rhr ?? '-'}</TableCell>
                                    <TableCell>{record.strain ?? '-'}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
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
