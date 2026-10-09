import { Loader2 } from 'lucide-react'
import { Logo } from './Logo'

export const FullScreenLoading = () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background">
        <Logo size={56} />
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
    </div>
)
