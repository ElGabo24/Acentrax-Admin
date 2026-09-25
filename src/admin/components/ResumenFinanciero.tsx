import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getFinanzas } from '../actions/finanzas/finanzas.actions'
import { aFechaIso, dinero, mesLabel } from '../utils/formato'
import { GraficaFinanzas } from './GraficaFinanzas'

const RANGOS = [3, 6, 12] as const

const NOTA_INCOMPLETA =
    'Falta configurar la comisión de un proveedor de pago para este cálculo, o hay pagos en otra moneda: la cifra está por debajo de la realidad.'

const Renglon = ({
    etiqueta,
    valor,
    negativo,
    fuerte,
}: {
    etiqueta: React.ReactNode
    valor: number
    negativo?: boolean
    fuerte?: boolean
}) => (
    <div className={cn('flex items-baseline justify-between gap-4', fuerte && 'border-t pt-2 text-lg font-semibold')}>
        <span className={fuerte ? undefined : 'text-sm text-muted-foreground'}>{etiqueta}</span>
        <span className={cn('tabular-nums', fuerte ? undefined : 'text-sm', fuerte && valor < 0 && 'text-destructive')}>
            {negativo && valor > 0 ? '−' : ''}{dinero(valor, 'MXN', 0)}
        </span>
    </div>
)

export const ResumenFinanciero = () => {
    const [nMeses, setNMeses] = useState<(typeof RANGOS)[number]>(6)
    const [seleccionado, setSeleccionado] = useState<string | null>(null)

    // El rango corre del primer día del mes más antiguo a hoy; el servidor lo redondea a mes completo.
    const hoy = new Date()
    const hasta = aFechaIso(hoy)
    const desde = aFechaIso(new Date(hoy.getFullYear(), hoy.getMonth() - (nMeses - 1), 1))

    const { data, isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ['admin', 'finanzas', desde, hasta],
        queryFn: () => getFinanzas(desde, hasta),
        placeholderData: (anterior) => anterior,
    })

    const meses = data?.meses ?? []
    const mes = meses.find((m) => m.mes === seleccionado) ?? meses.at(-1)

    return (
        <section className="space-y-4 surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">Finanzas</h2>
                <select
                    aria-label="Rango"
                    className="h-9 rounded-lg border border-input bg-card px-2.5 text-sm"
                    value={nMeses}
                    onChange={(e) => {
                        setNMeses(Number(e.target.value) as (typeof RANGOS)[number])
                        setSeleccionado(null)
                    }}
                >
                    {RANGOS.map((n) => <option key={n} value={n}>Últimos {n} meses</option>)}
                </select>
            </div>

            {isError && !data ? (
                <div className="text-sm">
                    <p className="text-destructive">No se pudieron cargar las finanzas.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            ) : isLoading || !mes ? (
                <p className="text-sm text-muted-foreground">{isLoading ? 'Cargando…' : 'Sin datos en este rango.'}</p>
            ) : (
                <div className={cn('space-y-6', isFetching && 'opacity-70')}>
                    <div className="max-w-md space-y-2">
                        <select
                            aria-label="Mes"
                            className="h-8 rounded-lg border border-input bg-card px-2 text-sm font-medium capitalize"
                            value={mes.mes}
                            onChange={(e) => setSeleccionado(e.target.value)}
                        >
                            {[...meses].reverse().map((m) => <option key={m.mes} value={m.mes}>{mesLabel(m.mes)}</option>)}
                        </select>
                        <Renglon etiqueta="Ingreso bruto" valor={mes.ingresoBruto} />
                        {/* "estimada" va a la vista siempre, no en un tooltip: es lo que hace honesto el número. */}
                        <Renglon etiqueta="Comisión de pasarela (estimada)" valor={mes.comisionEstimada} negativo />
                        <Renglon etiqueta="Gastos operativos" valor={mes.gastosOperativos} negativo />
                        <Renglon etiqueta="Utilidad neta" valor={mes.utilidadNeta} fuerte />
                        {mes.estimacionIncompleta && (
                            <p className="flex gap-1.5 text-xs text-warning">
                                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {NOTA_INCOMPLETA}
                            </p>
                        )}
                    </div>

                    <GraficaFinanzas meses={meses} />

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b text-left text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="py-2 pr-3 font-medium">Mes</th>
                                    <th className="py-2 pr-3 text-right font-medium">Ingreso</th>
                                    <th className="py-2 pr-3 text-right font-medium">Comisión (estimada)</th>
                                    <th className="py-2 pr-3 text-right font-medium">Gastos</th>
                                    <th className="py-2 text-right font-medium">Utilidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...meses].reverse().map((m) => (
                                    <tr key={m.mes} className="border-b last:border-b-0">
                                        <td className="py-2 pr-3 capitalize">
                                            {mesLabel(m.mes)}
                                            {m.estimacionIncompleta && (
                                                <span title={NOTA_INCOMPLETA} className="ml-1.5 text-warning" aria-label={NOTA_INCOMPLETA}>*</span>
                                            )}
                                        </td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{dinero(m.ingresoBruto, 'MXN', 0)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{dinero(m.comisionEstimada, 'MXN', 0)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{dinero(m.gastosOperativos, 'MXN', 0)}</td>
                                        <td className={cn('py-2 text-right font-medium tabular-nums', m.utilidadNeta < 0 && 'text-destructive')}>
                                            {dinero(m.utilidadNeta, 'MXN', 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t font-medium">
                                <tr>
                                    <td className="py-2 pr-3">Total</td>
                                    <td className="py-2 pr-3 text-right tabular-nums">{dinero(data!.totales.ingresoBruto, 'MXN', 0)}</td>
                                    <td className="py-2 pr-3 text-right tabular-nums">{dinero(data!.totales.comisionEstimada, 'MXN', 0)}</td>
                                    <td className="py-2 pr-3 text-right tabular-nums">{dinero(data!.totales.gastosOperativos, 'MXN', 0)}</td>
                                    <td className="py-2 text-right tabular-nums">{dinero(data!.totales.utilidadNeta, 'MXN', 0)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <p className="text-xs text-muted-foreground">{data!.advertencia}</p>
                </div>
            )}
        </section>
    )
}
