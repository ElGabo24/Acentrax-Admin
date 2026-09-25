import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { getMetricas } from '../actions/metricas/getMetricas.action'
import type { EstadoSuscripcion } from '../interfaces/empresa.interface'
import { dinero, ESTADO_LABEL, ESTADOS, fechaCorta } from '../utils/formato'

interface Props {
    /** Filtra la lista de abajo; así el número lleva a las empresas que lo componen. */
    onFiltrarEstado: (estado: EstadoSuscripcion) => void
}

const Tarjeta = ({
    etiqueta,
    valor,
    detalle,
    onClick,
}: {
    etiqueta: string
    valor: React.ReactNode
    detalle?: React.ReactNode
    onClick?: () => void
}) => {
    const Contenedor = onClick ? 'button' : 'div'
    return (
        <Contenedor
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={cn('surface p-4 text-left', onClick && 'transition hover:border-ring/60 hover:shadow-sm')}
        >
            <p className="text-xs font-medium text-muted-foreground">{etiqueta}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{valor}</p>
            {detalle && <div className="mt-1 text-xs text-muted-foreground">{detalle}</div>}
        </Contenedor>
    )
}

export const MetricasBlock = ({ onFiltrarEstado }: Props) => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin', 'metricas'],
        queryFn: getMetricas,
        staleTime: 60_000,
    })

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
            <Tarjeta
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
            <Tarjeta
                etiqueta="Pruebas por vencer (7 días)"
                valor={data.pruebasPorVencerEstaSemana}
                detalle={data.pruebasPorVencerEstaSemana > 0 ? 'Toca para ver cuáles' : 'Nada por atender'}
                onClick={() => onFiltrarEstado('PRUEBA')}
            />
            <Tarjeta
                etiqueta="Ingreso este mes"
                valor={dinero(data.ingresoMesActual, 'MXN', 0)}
                detalle={
                    otrasMonedas.length > 0 && (
                        <span>+ {otrasMonedas.map(([m, v]) => dinero(v, m, 0)).join(' + ')} en otra moneda</span>
                    )
                }
            />
            <Tarjeta
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
