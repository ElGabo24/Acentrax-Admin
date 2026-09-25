import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Search, X } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getEmpresas } from '../actions/empresas/empresas.actions'
import { getPlanes } from '../actions/planes/getPlanes.action'
import { EstadoBadge } from '../components/EstadoBadge'
import { PageHeader } from '../components/PageHeader'
import { MetricasBlock } from '../components/MetricasBlock'
import type { EstadoSuscripcion, OrdenEmpresas } from '../interfaces/empresa.interface'
import { ESTADO_LABEL, ESTADOS, haceCuanto } from '../utils/formato'

const TAMANIO = 100

const ORDEN_LABEL: Record<OrdenEmpresas, string> = {
    vencimiento: 'Por vencer primero',
    actividad: 'Actividad reciente',
    nombre: 'Nombre',
}


export const EmpresasPage = () => {
    // Filtros en la URL: al volver del detalle la lista queda como estaba.
    const [params, setParams] = useSearchParams()
    const estado = (params.get('estado') as EstadoSuscripcion | null) ?? undefined
    const plan = params.get('plan') ?? undefined
    const busqueda = params.get('q') ?? ''
    const orden = (params.get('orden') as OrdenEmpresas | null) ?? 'vencimiento'
    const pagina = Number(params.get('pagina') ?? 0)

    const navigate = useNavigate()
    const [texto, setTexto] = useState(busqueda)
    const hayFiltros = !!(estado || plan || busqueda)

    const actualizar = (cambios: Record<string, string | undefined>) =>
        setParams(
            (previos) => {
                const nuevos = new URLSearchParams(previos)
                for (const [clave, valor] of Object.entries(cambios)) {
                    if (valor) nuevos.set(clave, valor)
                    else nuevos.delete(clave)
                }
                // Cualquier filtro distinto de la página vuelve a la primera.
                if (!('pagina' in cambios)) nuevos.delete('pagina')
                return nuevos
            },
            { replace: true }
        )

    // Debounce del buscador: no se pide en cada tecla.
    useEffect(() => {
        if (texto === busqueda) return
        const t = setTimeout(() => actualizar({ q: texto.trim() || undefined }), 300)
        return () => clearTimeout(t)
    })

    const { data: planes } = useQuery({ queryKey: ['admin', 'planes'], queryFn: getPlanes })

    const { data, isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ['admin', 'empresas', { estado, plan, busqueda, orden, pagina }],
        queryFn: () =>
            getEmpresas({ estado, plan, busqueda: busqueda || undefined, orden, pagina, tamanio: TAMANIO }),
        placeholderData: (anterior) => anterior,
    })

    const limpiar = () => {
        setTexto('')
        setParams({}, { replace: true })
    }

    const chip = (activo: boolean) =>
        cn(
            'rounded-full border px-3 py-1 text-sm transition-colors',
            activo
                ? 'border-transparent bg-primary text-primary-foreground font-medium'
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
        )

    return (
        <div className="space-y-6">
            <PageHeader titulo="Empresas" descripcion="Suscripciones de tus clientes. Toca una empresa para ver su detalle y gestionarla." />

            <MetricasBlock onFiltrarEstado={(e) => actualizar({ estado: e, orden: 'vencimiento' })} />

            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-56 flex-1 sm:max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Buscar empresa por nombre"
                            aria-label="Buscar por nombre"
                            className="field w-full pl-8"
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                        />
                    </div>
                    <select
                        aria-label="Plan"
                        className="field"
                        value={plan ?? ''}
                        onChange={(e) => actualizar({ plan: e.target.value || undefined })}
                    >
                        <option value="">Todos los planes</option>
                        {planes?.map((p) => (
                            <option key={p.id} value={p.codigo}>{p.nombre}</option>
                        ))}
                    </select>
                    <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                        Ordenar por
                        <select
                            aria-label="Orden"
                            className="field"
                            value={orden}
                            onChange={(e) => actualizar({ orden: e.target.value })}
                        >
                            {(Object.keys(ORDEN_LABEL) as OrdenEmpresas[]).map((o) => (
                                <option key={o} value={o}>{ORDEN_LABEL[o]}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por estado">
                    <button type="button" className={chip(!estado)} onClick={() => actualizar({ estado: undefined })}>
                        Todas
                    </button>
                    {ESTADOS.map((e) => (
                        <button
                            key={e}
                            type="button"
                            aria-pressed={estado === e}
                            className={chip(estado === e)}
                            onClick={() => actualizar({ estado: estado === e ? undefined : e })}
                        >
                            {ESTADO_LABEL[e]}
                        </button>
                    ))}
                    {hayFiltros && (
                        <Button variant="ghost" size="sm" onClick={limpiar}>
                            <X /> Limpiar filtros
                        </Button>
                    )}
                </div>
            </div>

            {isError && !data ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudieron cargar las empresas.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
                        Reintentar
                    </Button>
                </div>
            ) : (
                <div className={cn('surface overflow-x-auto transition-opacity', isFetching && 'opacity-70')}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Plan</th>
                                <th>Estado</th>
                                <th className="text-right">Días restantes</th>
                                <th className="text-right">Usuarios</th>
                                <th>Última actividad</th>
                                <th className="w-8"><span className="sr-only">Ver</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Cargando empresas…</td></tr>
                            )}
                            {data?.contenido.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-muted-foreground">
                                        Ninguna empresa coincide con los filtros.
                                        {hayFiltros && (
                                            <>
                                                {' '}
                                                <button type="button" className="text-foreground underline" onClick={limpiar}>
                                                    Quitar filtros
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )}
                            {data?.contenido.map((e) => (
                                <tr
                                    key={e.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => void navigate(`/empresas/${e.id}`)}
                                >
                                    <td className="font-medium">
                                        <Link to={`/empresas/${e.id}`} onClick={(ev) => ev.stopPropagation()} className="hover:underline">
                                            {e.nombre}
                                        </Link>
                                    </td>
                                    <td>{e.planNombre ?? '—'}</td>
                                    <td><EstadoBadge estado={e.estado} /></td>
                                    <td
                                        className={cn(
                                            'text-right tabular-nums',
                                            e.diasRestantes !== null && e.diasRestantes <= 3 && 'font-medium text-destructive',
                                            e.diasRestantes !== null && e.diasRestantes > 3 && e.diasRestantes <= 7 && 'font-medium text-warning'
                                        )}
                                    >
                                        {e.diasRestantes ?? '—'}
                                    </td>
                                    <td className="text-right tabular-nums">{e.usuarios}</td>
                                    <td className="text-muted-foreground">{haceCuanto(e.ultimaActividad)}</td>
                                    <td className="text-muted-foreground"><ChevronRight className="size-4" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {data && data.totalPaginas > 1 && (
                <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
                    <span>
                        Página {data.pagina + 1} de {data.totalPaginas} · {data.totalElementos} empresas
                    </span>
                    <Button
                        variant="outline" size="sm" disabled={pagina === 0}
                        onClick={() => actualizar({ pagina: String(pagina - 1) })}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline" size="sm" disabled={data.esUltima}
                        onClick={() => actualizar({ pagina: String(pagina + 1) })}
                    >
                        Siguiente
                    </Button>
                </div>
            )}
        </div>
    )
}
