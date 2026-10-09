import { cn } from '@/lib/utils'

interface Props {
    etiqueta: string
    valor: React.ReactNode
    detalle?: React.ReactNode
    /** La cifra que encabeza la vista: fondo teñido y número más grande. Una por pantalla. */
    destacado?: boolean
    /** Pinta el valor de rojo (una pérdida). */
    negativo?: boolean
    onClick?: () => void
    className?: string
}

/** Un indicador: etiqueta, cifra y una línea de contexto. Si lleva `onClick` es un botón. */
export const StatTile = ({ etiqueta, valor, detalle, destacado, negativo, onClick, className }: Props) => {
    const Contenedor = onClick ? 'button' : 'div'
    return (
        <Contenedor
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={cn(
                'surface p-4 text-left',
                destacado && 'border-primary/30 bg-accent',
                onClick && 'transition hover:border-ring/60 hover:shadow-sm',
                className
            )}
        >
            <p className="text-xs font-medium text-muted-foreground">{etiqueta}</p>
            {/* Proporcional: `tabular-nums` es para columnas, y en una cifra grande afloja los dígitos. */}
            <p
                className={cn(
                    'mt-1 font-semibold tracking-tight',
                    destacado ? 'text-3xl' : 'text-2xl',
                    negativo && 'text-destructive'
                )}
            >
                {valor}
            </p>
            {detalle && <div className="mt-1 text-xs text-muted-foreground">{detalle}</div>}
        </Contenedor>
    )
}
