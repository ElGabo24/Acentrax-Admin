import { Loader2 } from 'lucide-react'

export const FullScreenLoading = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-label="Cargando" />
    </div>
)
