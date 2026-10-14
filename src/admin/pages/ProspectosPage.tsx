import { ChevronRight, MapPin, X } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ProspectoDetalleDialog } from '../components/ProspectoDetalleDialog'
import { ProspectoEstadoBadge } from '../components/ProspectoEstadoBadge'
import { PageHeader } from '../components/PageHeader'
import { ResumenProspectosBlock } from '../components/ResumenProspectosBlock'
import type { EstadoProspecto } from '../interfaces/prospectos.interface'
import { useAgentes } from '../queries/agentes.queries'
import { useProspectos, useResumenProspectos } from '../queries/prospectos.queries'
import { haceCuanto } from '../utils/formato'
import {
    enlaceDeMapa,
    ESTADO_PROSPECTO_LABEL,
    ESTADOS_PROSPECTO,
    giroLabel,
    RESULTADO_VISITA_LABEL,
    ultimaVisita,
} from '../utils/prospectos'

const TAMANIO = 50

export const ProspectosPage = () => {
    // Filtros y negocio abierto en la URL: al cerrar el detalle o recargar, la lista queda como estaba.
    const [params, setParams] = useSearchParams()
    const estado = (params.get('estado') as EstadoProspecto | null) ?? undefined
    const giro = params.get('giro') ?? undefined
    const agenteId = params.get('agente') ?? undefined
    const abierto = params.get('negocio')
    const pagina = Number(params.get('pagina') ?? 0)
    const hayFiltros = !!(estado || giro || agenteId)

    const actualizar = (cambios: Record<string, string | undefined>) =>
        setParams(
            (previos) => {
                const nuevos = new URLSearchParams(previos)
                for (const [clave, valor] of Object.entries(cambios)) {
                    if (valor) nuevos.set(clave, valor)
                    else nuevos.delete(clave)
                }
                // Cambiar un filtro vuelve a la primera página; abrir o cerrar un negocio, no.
                if (!('pagina' in cambios) && !('negocio' in cambios)) nuevos.delete('pagina')
                return nuevos
            },
            { replace: true }
        )

    const { data: agentes } = useAgentes()
    const { data: resumen } = useResumenProspectos()
    const { data, isLoading, isError, isFetching, refetch } = useProspectos({
        estado,
        giro,
        agenteId,
        pagina,
        tamanio: TAMANIO,
    })

    const nombreAgente = (id: string) => agentes?.find((a) => a.userId === id)?.nombre ?? '—'
    const giros = Object.keys(resumen?.porGiro ?? {}).sort()

    const chip = (activo: boolean) =>
        cn(
            'rounded-full border px-3 py-1 text-sm transition-colors',
            activo
                ? 'border-transparent bg-primary text-primary-foreground font-medium'
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
        )

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Prospectos"
                descripcion="Los negocios que visitan tus agentes y lo que dijeron. Toca una barra para filtrar y un negocio para ver sus visitas. Para verlos en un mapa, usa la pestaña Mapa."
            />

            <ResumenProspectosBlock
                estado={estado}
                giro={giro}
                agenteId={agenteId}
                onFiltrarEstado={(e) => actualizar({ estado: e })}
                onFiltrarGiro={(g) => actualizar({ giro: g })}
                onFiltrarAgente={(a) => actualizar({ agente: a })}
            />

            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        aria-label="Giro"
                        className="field"
                        value={giro ?? ''}
                        onChange={(e) => actualizar({ giro: e.target.value || undefined })}
                    >
                        <option value="">Todos los giros</option>
                        {giros.map((g) => (
                            <option key={g} value={g}>{giroLabel(g)}</option>
                        ))}
                    </select>
                    <select
                        aria-label="Agente"
                        className="field"
                        value={agenteId ?? ''}
                        onChange={(e) => actualizar({ agente: e.target.value || undefined })}
                    >
                        <option value="">Todos los agentes</option>
                        {agentes?.map((a) => (
                            <option key={a.userId} value={a.userId}>{a.nombre}</option>
                        ))}
                    </select>
                    {hayFiltros && (
                        <Button variant="ghost" size="sm" onClick={() => actualizar({ estado: undefined, giro: undefined, agente: undefined })}>
                            <X /> Limpiar filtros
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por estado">
                    <button type="button" className={chip(!estado)} onClick={() => actualizar({ estado: undefined })}>
                        Todos
                    </button>
                    {ESTADOS_PROSPECTO.map((e) => (
                        <button
                            key={e}
                            type="button"
                            aria-pressed={estado === e}
                            className={chip(estado === e)}
                            onClick={() => actualizar({ estado: estado === e ? undefined : e })}
                        >
                            {ESTADO_PROSPECTO_LABEL[e]}
                        </button>
                    ))}
                </div>
            </div>

            {isError && !data ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudieron cargar los negocios.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            ) : (
                <div className={cn('surface overflow-x-auto transition-opacity', isFetching && 'opacity-70')}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Negocio</th>
                                <th>Giro</th>
                                <th>Agente</th>
                                <th>Estado</th>
                                <th>Última visita</th>
                                <th className="text-right">Visitas</th>
                                <th className="w-8"><span className="sr-only">Ver</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Cargando negocios…</td></tr>
                            )}
                            {data?.contenido.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-muted-foreground">
                                        {hayFiltros ? 'Ningún negocio coincide con los filtros.' : 'Todavía no hay negocios registrados.'}
                                    </td>
                                </tr>
                            )}
                            {data?.contenido.map(({ negocio, visitas }) => {
                                const ultima = ultimaVisita(visitas)
                                const mapa = enlaceDeMapa(negocio)
                                return (
                                    <tr
                                        key={negocio.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => actualizar({ negocio: negocio.id })}
                                    >
                                        <td>
                                            <button
                                                type="button"
                                                className="text-left font-medium hover:underline"
                                                onClick={(e) => { e.stopPropagation(); actualizar({ negocio: negocio.id }) }}
                                            >
                                                {negocio.nombreNegocio}
                                            </button>
                                            {negocio.direccionTexto && (
                                                <div className="max-w-64 truncate text-xs text-muted-foreground">{negocio.direccionTexto}</div>
                                            )}
                                        </td>
                                        <td>{giroLabel(negocio.giro)}</td>
                                        <td>{nombreAgente(negocio.agenteId)}</td>
                                        <td><ProspectoEstadoBadge estado={negocio.estado} /></td>
                                        <td>
                                            {ultima ? (
                                                <>
                                                    <div>{RESULTADO_VISITA_LABEL[ultima.resultado]}</div>
                                                    <div className="text-xs text-muted-foreground">{haceCuanto(ultima.fecha)}</div>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">Sin visitas</span>
                                            )}
                                        </td>
                                        <td className="text-right tabular-nums">{visitas.length}</td>
                                        <td className="text-muted-foreground">
                                            {mapa ? (
                                                <a
                                                    href={mapa}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    aria-label={`Ver ${negocio.nombreNegocio} en el mapa`}
                                                    title="Ver en el mapa"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="hover:text-foreground"
                                                >
                                                    <MapPin className="size-4" />
                                                </a>
                                            ) : (
                                                <ChevronRight className="size-4" />
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {data && data.totalPaginas > 1 && (
                <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
                    <span>
                        Página {data.pagina + 1} de {data.totalPaginas} · {data.totalElementos} negocios
                    </span>
                    <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => actualizar({ pagina: String(pagina - 1) })}>
                        Anterior
                    </Button>
                    <Button variant="outline" size="sm" disabled={data.esUltima} onClick={() => actualizar({ pagina: String(pagina + 1) })}>
                        Siguiente
                    </Button>
                </div>
            )}

            <ProspectoDetalleDialog id={abierto} onClose={() => actualizar({ negocio: undefined })} />
        </div>
    )
}
