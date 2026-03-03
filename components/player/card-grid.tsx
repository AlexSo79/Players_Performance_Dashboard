import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

// Define interface for better type safety
interface Metric {
    label: string
    key: string
    subKey?: string
    subLabel?: string
    icon?: LucideIcon
    color?: string
}

interface CardGridProps {
    metrics: Metric[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentStats: Record<string, any>
}

export const CardGrid = ({ metrics, currentStats }: CardGridProps) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => {
            const value = currentStats[metric.key] || 0
            const subValue = metric.subKey ? currentStats[metric.subKey] || 0 : null

            let successRate = null
            if (subValue !== null && value > 0) {
                successRate = Math.round((subValue / value) * 100)
            }

            const formatValue = (val: any) => {
                if (typeof val === 'number') {
                    // Check if it's an integer to avoid .00, otherwise 2 decimal places
                    return Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
                }
                return val;
            };

            return (
                <Card key={metric.label}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {metric.label}
                        </CardTitle>
                        {metric.icon && <metric.icon className={`h-4 w-4 ${metric.color || 'text-muted-foreground'}`} />}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatValue(value)}</div>
                        {subValue !== null && (
                            <p className="text-xs text-muted-foreground">
                                {formatValue(subValue)} {metric.subLabel}
                                {successRate !== null && ` (${successRate}%)`}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )
        })}
    </div>
)
