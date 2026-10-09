import type { EstadoSuscripcion } from '../interfaces/empresa.interface'
import { useMetricas } from '../queries/metricas.queries'
import { StatTile } from './StatTile'
import { dinero, ESTADO_LABEL, ESTADOS, fechaCorta } from '../utils/formato'

interface Props {
    /** Filtra la lista de abajo; así el número lleva a las empresas que lo componen. */
    onFiltrarEstado: (estado: EstadoSuscripcion) => void
}

export const MetricasBlock = ({ onFiltrarEstado }: Props) => {
    const { data, isLoading, isError, refetch } = useMetricas()

    if (isError && !data) {
        // Sin métricas la lista sigue sirviendo: solo se avisa.
        return (
            <p className="text-sm text-muted-foreground">
                No se pudieron cargar las métricas.{' '}
                <button type="button" className="underline" onClick={() => void refetch()}>Reintentar</button>
            </p>
        )
    }

    if (isLoading || !data) {
        return (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-[94px] animate-pulse rounded-xl border bg-muted/60" />)}
            </div>
        )
    }

    const { empresasPorEstado: porEstado, conversionPruebaAPago: conv } = data
    const monedas = Object.entries(data.ingresoMesActualPorMoneda)
    const otrasMonedas = monedas.filter(([moneda]) => moneda !== 'MXN')

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
                etiqueta="Empresas activas"
                valor={porEstado.ACTIVA}
                onClick={() => onFiltrarEstado('ACTIVA')}
                detalle={
                    <span>
                        {ESTADOS.filter((e) => e !== 'ACTIVA' && porEstado[e] > 0)
                            .map((e) => `${porEstado[e]} ${ESTADO_LABEL[e].toLowerCase()}`)
                            .join(' · ') || 'Ninguna en otro estado'}
                    </span>
                }
            />
            <StatTile
                etiqueta="Pruebas por vencer (7 días)"
                valor={data.pruebasPorVencerEstaSemana}
                detalle={data.pruebasPorVencerEstaSemana > 0 ? 'Toca para ver cuáles' : 'Nada por atender'}
                onClick={() => onFiltrarEstado('PRUEBA')}
            />
            <StatTile
                etiqueta="Ingreso este mes"
                valor={dinero(data.ingresoMesActual, 'MXN', 0)}
                detalle={
                    otrasMonedas.length > 0 && (
                        <span>+ {otrasMonedas.map(([m, v]) => dinero(v, m, 0)).join(' + ')} en otra moneda</span>
                    )
                }
            />
            <StatTile
                etiqueta="Conversión prueba→pago"
                valor={conv.pasaronPorPrueba === 0 ? '—' : `${Math.round(conv.tasa)}%`}
                detalle={
                    <span title="Aproximación: cuenta como conversión a toda empresa que empezó su prueba en el rango y tiene al menos un pago, aunque después cancelara.">
                        {conv.convirtieron} de {conv.pasaronPorPrueba} · desde el {fechaCorta(conv.desde)} (aprox.)
                    </span>
                }
            />
        </div>
    )
}
