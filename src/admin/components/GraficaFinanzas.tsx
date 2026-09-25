import type { FinanzasMes } from '../interfaces/finanzas.interface'
import { dinero, mesLabel } from '../utils/formato'

const ANCHO_GRUPO = 64
const ALTO = 160
const BARRA = 22

/**
 * Ingreso contra utilidad, mes por mes. Una gráfica simple a propósito: las
 * cifras exactas están en la tabla de abajo y en el resumen del mes.
 */
export const GraficaFinanzas = ({ meses }: { meses: FinanzasMes[] }) => {
    if (meses.length === 0) return null

    const max = Math.max(1, ...meses.flatMap((m) => [m.ingresoBruto, m.utilidadNeta]))
    const min = Math.min(0, ...meses.map((m) => m.utilidadNeta))
    const escala = ALTO / (max - min)
    const cero = max * escala // y de la línea del cero, contando desde arriba

    const barra = (valor: number) => ({
        y: valor >= 0 ? cero - valor * escala : cero,
        alto: Math.max(1, Math.abs(valor) * escala),
    })

    const ancho = meses.length * ANCHO_GRUPO

    return (
        <figure className="space-y-2">
            <svg
                viewBox={`0 0 ${ancho} ${ALTO + 22}`}
                className="h-48 w-full"
                role="img"
                aria-label="Ingreso bruto y utilidad neta por mes"
            >
                <line x1={0} x2={ancho} y1={cero} y2={cero} className="stroke-border" />
                {meses.map((m, i) => {
                    const x = i * ANCHO_GRUPO + (ANCHO_GRUPO - BARRA * 2 - 4) / 2
                    const ingreso = barra(m.ingresoBruto)
                    const utilidad = barra(m.utilidadNeta)
                    return (
                        <g key={m.mes}>
                            <rect x={x} y={ingreso.y} width={BARRA} height={ingreso.alto} rx={2} className="fill-primary">
                                <title>{`${mesLabel(m.mes)} · ingreso ${dinero(m.ingresoBruto, 'MXN', 0)}`}</title>
                            </rect>
                            <rect
                                x={x + BARRA + 4}
                                y={utilidad.y}
                                width={BARRA}
                                height={utilidad.alto}
                                rx={2}
                                className={m.utilidadNeta >= 0 ? 'fill-success' : 'fill-destructive'}
                            >
                                <title>{`${mesLabel(m.mes)} · utilidad ${dinero(m.utilidadNeta, 'MXN', 0)}`}</title>
                            </rect>
                            <text
                                x={i * ANCHO_GRUPO + ANCHO_GRUPO / 2}
                                y={ALTO + 15}
                                textAnchor="middle"
                                className="fill-muted-foreground text-[11px]"
                            >
                                {mesLabel(m.mes)}
                            </text>
                        </g>
                    )
                })}
            </svg>
            <figcaption className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" /> Ingreso bruto</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-success" /> Utilidad neta</span>
            </figcaption>
        </figure>
    )
}
