import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { FinanzasMes } from '../interfaces/finanzas.interface'
import { useFinanzas } from '../queries/finanzas.queries'
import { aFechaIso, dinero, mesLabel } from '../utils/formato'
import { Pildora } from './EstadoBadge'
import { GraficaFinanzas } from './GraficaFinanzas'
import { StatTile } from './StatTile'

const RANGOS = [3, 6, 12] as const

const NOTA_INCOMPLETA =
    'Falta configurar la comisión de un proveedor de pago para este cálculo, o hay pagos en otra moneda: la cifra está por debajo de la realidad.'

const dineroMxn = (monto: number) => dinero(monto, 'MXN', 0)

/** Selector de rango: pocas opciones y siempre a la vista, así que botones en vez de un `select`. */
const SelectorRango = ({ valor, onChange }: { valor: number; onChange: (n: (typeof RANGOS)[number]) => void }) => (
    <div role="group" aria-label="Rango" className="inline-flex rounded-lg bg-muted p-0.5">
        {RANGOS.map((n) => (
            <button
                key={n}
                type="button"
                aria-pressed={n === valor}
                onClick={() => onChange(n)}
                className={cn(
                    'rounded-md px-3 py-1 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    n === valor ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
            >
                {n} meses
            </button>
        ))}
    </div>
)

const Esqueleto = () => (
    <div className="space-y-4" aria-busy="true">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-[94px] animate-pulse rounded-xl border bg-muted/60" />)}
        </div>
        <div className="h-80 animate-pulse rounded-xl border bg-muted/60" />
    </div>
)

const Tabla = ({
    meses,
    totales,
    seleccionado,
    onSeleccionar,
}: {
    meses: FinanzasMes[]
    totales: { ingresoBruto: number; comisionEstimada: number; gastosOperativos: number; utilidadNeta: number }
    seleccionado: string
    onSeleccionar: (mes: string) => void
}) => (
    <div className="overflow-x-auto">
        <table className="data-table">
            <thead>
                <tr>
                    <th>Mes</th>
                    <th className="text-right">Ingreso</th>
                    <th className="text-right max-sm:hidden">Comisión*</th>
                    <th className="text-right max-sm:hidden">Gastos</th>
                    <th className="text-right">Utilidad</th>
                </tr>
            </thead>
            <tbody>
                {[...meses].reverse().map((m) => (
                    <tr key={m.mes} className={cn(m.mes === seleccionado ? 'bg-accent' : 'hover:bg-muted/40')}>
                        <td className="whitespace-nowrap">
                            <button
                                type="button"
                                aria-pressed={m.mes === seleccionado}
                                onClick={() => onSeleccionar(m.mes)}
                                className="rounded font-medium capitalize outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                {mesLabel(m.mes)}
                            </button>
                            {m.estimacionIncompleta && (
                                <span title={NOTA_INCOMPLETA} className="ml-1.5 text-warning" aria-label={NOTA_INCOMPLETA}>*</span>
                            )}
                        </td>
                        <td className="text-right tabular-nums">{dineroMxn(m.ingresoBruto)}</td>
                        <td className="text-right text-muted-foreground tabular-nums max-sm:hidden">{dineroMxn(m.comisionEstimada)}</td>
                        <td className="text-right text-muted-foreground tabular-nums max-sm:hidden">{dineroMxn(m.gastosOperativos)}</td>
                        <td className={cn('text-right font-medium tabular-nums', m.utilidadNeta < 0 && 'text-destructive')}>
                            {dineroMxn(m.utilidadNeta)}
                        </td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr className="border-t bg-muted/40 font-semibold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right tabular-nums">{dineroMxn(totales.ingresoBruto)}</td>
                    <td className="px-4 py-3 text-right tabular-nums max-sm:hidden">{dineroMxn(totales.comisionEstimada)}</td>
                    <td className="px-4 py-3 text-right tabular-nums max-sm:hidden">{dineroMxn(totales.gastosOperativos)}</td>
                    <td className={cn('px-4 py-3 text-right tabular-nums', totales.utilidadNeta < 0 && 'text-destructive')}>
                        {dineroMxn(totales.utilidadNeta)}
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>
)

export const ResumenFinanciero = () => {
    const [nMeses, setNMeses] = useState<(typeof RANGOS)[number]>(6)
    const [seleccionado, setSeleccionado] = useState<string | null>(null)

    // El rango corre del primer día del mes más antiguo a hoy; el servidor lo redondea a mes completo.
    const hoy = new Date()
    const hasta = aFechaIso(hoy)
    const desde = aFechaIso(new Date(hoy.getFullYear(), hoy.getMonth() - (nMeses - 1), 1))
    const mesEnCurso = hasta.slice(0, 7)

    const { data, isLoading, isError, isFetching, refetch } = useFinanzas(desde, hasta)

    const meses = data?.meses ?? []
    const mes = meses.find((m) => m.mes === seleccionado) ?? meses.at(-1)

    if (isError && !data) {
        return (
            <section className="surface p-5 text-sm">
                <p className="text-destructive">No se pudieron cargar las finanzas.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
            </section>
        )
    }

    if (isLoading) return <Esqueleto />

    if (!data || !mes) {
        return <p className="surface p-5 text-sm text-muted-foreground">Sin datos en este rango.</p>
    }

    const margen = mes.ingresoBruto > 0 ? Math.round((mes.utilidadNeta / mes.ingresoBruto) * 100) : null

    return (
        <section className={cn('space-y-4', isFetching && 'opacity-70')}>
            {/* Los filtros, en una sola fila arriba de lo que acotan. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">Resumen de</h2>
                    <select
                        aria-label="Mes"
                        className="field font-medium capitalize"
                        value={mes.mes}
                        onChange={(e) => setSeleccionado(e.target.value)}
                    >
                        {[...meses].reverse().map((m) => <option key={m.mes} value={m.mes}>{mesLabel(m.mes)}</option>)}
                    </select>
                    {mes.mes === mesEnCurso && <Pildora className="bg-secondary text-secondary-foreground">En curso</Pildora>}
                </div>
                <SelectorRango
                    valor={nMeses}
                    onChange={(n) => {
                        setNMeses(n)
                        setSeleccionado(null)
                    }}
                />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                    etiqueta="Ingreso bruto"
                    valor={dineroMxn(mes.ingresoBruto)}
                    detalle={`${mes.pagos} ${mes.pagos === 1 ? 'pago' : 'pagos'}`}
                />
                {/* "Estimada" va a la vista siempre, no en un tooltip: es lo que hace honesto el número. */}
                <StatTile
                    etiqueta="Comisión de pasarela"
                    valor={`${mes.comisionEstimada > 0 ? '−' : ''}${dineroMxn(mes.comisionEstimada)}`}
                    detalle="Estimada, no es el cobro exacto"
                />
                <StatTile
                    etiqueta="Gastos operativos"
                    valor={`${mes.gastosOperativos > 0 ? '−' : ''}${dineroMxn(mes.gastosOperativos)}`}
                    detalle="Recurrentes y puntuales"
                    className="col-span-2 lg:col-span-1"
                />
                <StatTile
                    destacado
                    negativo={mes.utilidadNeta < 0}
                    etiqueta="Utilidad neta"
                    valor={dineroMxn(mes.utilidadNeta)}
                    detalle={margen === null ? 'Sin ingresos este mes' : `Margen de ${margen}%`}
                    // En el móvil encabeza la cuadrícula; en pantalla ancha cierra la fila, como el resultado de la resta.
                    className="order-first col-span-2 lg:order-none lg:col-span-1"
                />
            </div>

            {mes.estimacionIncompleta && (
                <p role="note" className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground/80">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" /> {NOTA_INCOMPLETA}
                </p>
            )}

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <section className="surface p-5 xl:sticky xl:top-4">
                    <h3 className="text-base font-semibold">Ingreso y utilidad por mes</h3>
                    <p className="mb-4 text-xs text-muted-foreground">Elige un mes para ver su resumen arriba.</p>
                    <GraficaFinanzas meses={meses} seleccionado={mes.mes} onSeleccionar={setSeleccionado} mesEnCurso={mesEnCurso} />
                </section>

                <section className="surface overflow-hidden">
                    <div className="px-5 pt-5 pb-3">
                        <h3 className="text-base font-semibold">Detalle por mes</h3>
                        <p className="text-xs text-muted-foreground">* La comisión es una estimación.</p>
                    </div>
                    <Tabla meses={meses} totales={data.totales} seleccionado={mes.mes} onSeleccionar={setSeleccionado} />
                </section>
            </div>

            <p className="text-xs text-muted-foreground">{data.advertencia}</p>
        </section>
    )
}
