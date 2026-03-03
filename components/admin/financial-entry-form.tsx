'use client'

import React, { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { PlusCircle, Trash2, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
    id: string
    full_name: string | null
    email: string | null
}

interface ServiceItem {
    id?: string
    service_name: string
    cost: number
    status: string
}

interface FinancialEntryFormProps {
    onSuccess?: () => void
    preSelectedPlayerId?: string
}

export function FinancialEntryForm({ onSuccess, preSelectedPlayerId }: FinancialEntryFormProps) {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>(preSelectedPlayerId || '')
    const [totalBudget, setTotalBudget] = useState<number>(0)
    const [services, setServices] = useState<ServiceItem[]>([])
    const [loading, setLoading] = useState(false)
    const [fetchingData, setFetchingData] = useState(false)

    const supabase = createClient()

    // 1. Fetch all profiles for dropdown
    useEffect(() => {
        const fetchProfiles = async () => {
            const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name')
            if (data) setProfiles(data)
        }
        fetchProfiles()
    }, [supabase])

    // 2. Fetch financial data when player is selected
    useEffect(() => {
        if (!selectedPlayerId) {
            setTotalBudget(0)
            setServices([])
            return
        }

        const fetchData = async () => {
            setFetchingData(true)

            // Get Total Budget
            const { data: finData } = await supabase
                .from('financials')
                .select('total_budget')
                .eq('player_id', selectedPlayerId)
                .single()

            if (finData) {
                setTotalBudget(finData.total_budget || 0)
            } else {
                setTotalBudget(0)
            }

            // Get Services
            const { data: servData } = await supabase
                .from('player_services')
                .select('*')
                .eq('player_id', selectedPlayerId)
                .order('created_at', { ascending: true })

            if (servData) {
                setServices(servData.map(s => ({
                    id: s.id,
                    service_name: s.service_name,
                    cost: s.cost,
                    status: s.status
                })))
            } else {
                setServices([])
            }

            setFetchingData(false)
        }
        fetchData()
    }, [selectedPlayerId, supabase])

    // Handlers
    const handleAddService = () => {
        setServices([...services, { service_name: '', cost: 0, status: 'Active' }])
    }

    const handleRemoveService = (index: number) => {
        const newServices = [...services]
        newServices.splice(index, 1)
        setServices(newServices)
    }

    const handleServiceChange = (index: number, field: keyof ServiceItem, value: string | number) => {
        const newServices = [...services]
        newServices[index] = { ...newServices[index], [field]: value }
        setServices(newServices)
    }

    const handleSave = async () => {
        if (!selectedPlayerId) {
            toast.error("Error", { description: "Please select a player." })
            return
        }

        setLoading(true)
        try {
            // 1. Upsert Financials (Budget)
            const { error: finError } = await supabase
                .from('financials')
                .upsert({
                    player_id: selectedPlayerId,
                    total_budget: totalBudget,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'player_id' })

            if (finError) throw finError

            // 2. Sync Services (Delete all and re-insert? Or smart diff? 
            // Simple approach: Delete all for player and re-insert is risky if we lose history, 
            // better to Upsert by ID if exists, Insert new if no ID. 
            // But handling "Deleted" rows requires tracking IDs to remove.

            // For V1 simplicity: We will DELETE ALL for this player and RE-INSERT. 
            // This ensures the UI list matches DB exactly.
            // WARNING: This changes IDs. If IDs are referenced elsewhere, this is bad.
            // Given "player_services" is a new leaf table, this is acceptable for now.

            // Step 2a: Delete existing
            await supabase.from('player_services').delete().eq('player_id', selectedPlayerId)

            // Step 2b: Insert current
            if (services.length > 0) {
                const { error: servError } = await supabase
                    .from('player_services')
                    .insert(services.map(s => ({
                        player_id: selectedPlayerId,
                        service_name: s.service_name,
                        cost: s.cost,
                        status: s.status
                    })))

                if (servError) throw servError
            }

            toast.success("Success", { description: "Financial data updated." })
            if (onSuccess) onSuccess()

        } catch (err) {
            console.error(err)
            toast.error("Error", { description: "Failed to save data." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="player" className="text-right">
                        Player
                    </Label>
                    <div className="col-span-3">
                        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId} disabled={!!preSelectedPlayerId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select athlete..." />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.full_name || p.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {fetchingData ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                    <>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="budget" className="text-right">
                                Total Budget (€)
                            </Label>
                            <Input
                                id="budget"
                                type="number"
                                className="col-span-3 font-mono"
                                value={totalBudget}
                                onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        <div className="col-span-4 border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <Label className="font-bold">Services / Expenses</Label>
                                <Button size="sm" variant="outline" onClick={handleAddService} type="button">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                                </Button>
                            </div>

                            <div className="rounded-md border max-h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Service Name</TableHead>
                                            <TableHead className="w-[120px]">Cost (€)</TableHead>
                                            <TableHead className="w-[120px]">Status</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {services.map((service, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Input
                                                        value={service.service_name}
                                                        onChange={(e) => handleServiceChange(index, 'service_name', e.target.value)}
                                                        placeholder="e.g. Physiotherapy"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        className="font-mono"
                                                        value={service.cost}
                                                        onChange={(e) => handleServiceChange(index, 'cost', parseFloat(e.target.value) || 0)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={service.status}
                                                        onValueChange={(val) => handleServiceChange(index, 'status', val)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Active">Active</SelectItem>
                                                            <SelectItem value="Pending">Pending</SelectItem>
                                                            <SelectItem value="Completed">Completed</SelectItem>
                                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveService(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {services.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                    No services added.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading || !selectedPlayerId}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    )
}
