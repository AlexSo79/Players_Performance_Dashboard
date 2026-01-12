'use client'

import React from 'react'
import { BulkImportForm } from '@/components/admin/bulk-import-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ImportPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Bulk Import</h2>
                <p className="text-muted-foreground">
                    Quickly import stats for multiple players via CSV.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Import Player Stats</CardTitle>
                    <CardDescription>
                        Map player emails to stats for a specific match.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BulkImportForm />
                </CardContent>
            </Card>
        </div>
    )
}
