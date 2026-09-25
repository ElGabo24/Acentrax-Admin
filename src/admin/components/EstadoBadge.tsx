import { cn } from '@/lib/utils'
import type { EstadoSuscripcion } from '../interfaces/empresa.interface'
import { ESTADO_LABEL } from '../utils/formato'

const COLOR: Record<EstadoSuscripcion, string> = {
    PRUEBA: 'bg-secondary text-secondary-foreground',
    ACTIVA: 'bg-success/15 text-success',
    GRACIA: 'bg-warning/15 text-warning',
    SOLO_LECTURA: 'bg-destructive/15 text-destructive',
    CANCELADA: 'bg-muted text-muted-foreground',
}

/** Píldora con punto de color: el estado se reconoce de un vistazo, sin depender solo del texto. */
export const Pildora = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <span
        className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
            className
        )}
    >
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
        {children}
    </span>
)

export const EstadoBadge = ({ estado }: { estado: EstadoSuscripcion | null }) => {
    if (!estado) return <span className="text-sm text-muted-foreground">Sin suscripción</span>
    return <Pildora className={COLOR[estado]}>{ESTADO_LABEL[estado]}</Pildora>
}
