import { FileX2 } from 'lucide-react'

interface EmptyStateProps {
    title: string
    description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-[400px] text-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
            <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                <FileX2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
                {description}
            </p>
        </div>
    )
}
