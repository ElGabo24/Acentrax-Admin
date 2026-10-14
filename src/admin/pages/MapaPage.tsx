import { useMemo, useState } from 'react'
import { MapPinOff } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MapaNegocios, type PuntoPintado } from '../components/MapaNegocios'
import { PageHeader } from '../components/PageHeader'
import { ProspectoDetalleDialog } from '../components/ProspectoDetalleDialog'
import { StatTile } from '../components/StatTile'
import { useAgentes } from '../queries/agentes.queries'
import { useMapa, useResumenProspectos } from '../queries/prospectos.queries'
import { fechaCorta } from '../utils/formato'
import { CATEGORIAS_MAPA, categoriaDePunto, colorDeCategoria, contarMapa, razonPorVisitar, type CategoriaMapa } from '../utils/mapa'
import { ESTADO_PROSPECTO_LABEL, giroLabel } from '../utils/prospectos'

export const MapaPage = () => {
    // Filtros y negocio abierto en la URL: se puede compartir la vista o volver a ella.
    const [params, setParams] = useSearchParams()
    const agenteId = params.get('agente') ?? undefined
    const giro = params.get('giro') ?? undefined
    const abierto = params.get('negocio')

    const actualizar = (cambios: Record<string, string | undefined>) =>
        setParams(
            (previos) => {
                const nuevos = new URLSearchParams(previos)
                for (const [clave, valor] of Object.entries(cambios)) {
                    if (valor) nuevos.set(clave, valor)
                    else nuevos.delete(clave)
                }
                return nuevos
            },
            { replace: true }
        )

    /** Las categorías apagadas. Vacío = se ve todo. */
    const [ocultas, setOcultas] = useState<ReadonlySet<CategoriaMapa>>(new Set())
    const alternar = (c: CategoriaMapa) =>
        setOcultas((previas) => {
            const nuevas = new Set(previas)
            if (!nuevas.delete(c)) nuevas.add(c)
            return nuevas
        })

    const { data: agentes } = useAgentes()
    const { data: resumen } = useResumenProspectos()
    const mapa = useMapa({ agenteId, giro }, true)

    // «Hoy» es el momento en que llegaron los datos: estable entre renders y se renueva cuando se vuelven a pedir.
    const hoy = new Date(mapa.dataUpdatedAt)
    const puntos = mapa.data
    const conteo = useMemo(() => contarMapa(puntos ?? [], new Date(mapa.dataUpdatedAt)), [puntos, mapa.dataUpdatedAt])

    const conCategoria = useMemo(() => {
        const ahora = new Date(mapa.dataUpdatedAt)
        return (puntos ?? []).map((p) => ({ p, categoria: categoriaDePunto(p, ahora) }))
    }, [puntos, mapa.dataUpdatedAt])

    const pintados: PuntoPintado[] = useMemo(
        () =>
            conCategoria
                .filter(({ categoria }) => !ocultas.has(categoria))
                .map(({ p, categoria }) => ({
                    id: p.id,
                    latitud: p.latitud,
                    longitud: p.longitud,
                    color: colorDeCategoria(categoria),
                    etiqueta: `${p.nombreNegocio} · ${giroLabel(p.giro)} · ${CATEGORIAS_MAPA.find((c) => c.id === categoria)?.etiqueta} · ${p.agente}`,
                })),
        [conCategoria, ocultas]
    )

    const porVisitar = useMemo(
        () =>
            conCategoria
                .filter(({ categoria }) => categoria === 'POR_VISITAR')
                .map(({ p }) => p)
                // Primero lo que ya se pasó (el más viejo arriba), luego lo que nunca se ha visitado.
                .sort((a, b) => (a.proximaVisita ?? '9999').localeCompare(b.proximaVisita ?? '9999') || a.nombreNegocio.localeCompare(b.nombreNegocio)),
        [conCategoria]
    )

    const giros = Object.keys(resumen?.porGiro ?? {}).sort()
    const sinUbicacion = !agenteId && !giro && resumen && puntos ? Math.max(0, resumen.total - puntos.length) : 0
    const hayFiltros = !!(agenteId || giro)

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Mapa"
                descripcion="Dónde están los negocios y cuáles te toca visitar. Prende o apaga cada grupo en la lista de abajo; toca un punto para ver su detalle."
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile etiqueta="Con ubicación" valor={conteo.total} detalle={sinUbicacion > 0 ? `${sinUbicacion} más sin ubicación` : undefined} />
                <StatTile etiqueta="Visitados" valor={conteo.visitados} detalle={`${conteo.total - conteo.visitados} sin visitar`} />
                <StatTile etiqueta="Por visitar" valor={conteo.porCategoria.POR_VISITAR} detalle="Los que toca ir ya" destacado />
                <StatTile etiqueta="Contratados" valor={conteo.porCategoria.CONTRATADO} detalle={`${conteo.porCategoria.EN_ALTA} más en alta`} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <select aria-label="Giro" className="field" value={giro ?? ''} onChange={(e) => actualizar({ giro: e.target.value || undefined })}>
                    <option value="">Todos los giros</option>
                    {giros.map((g) => (
                        <option key={g} value={g}>{giroLabel(g)}</option>
                    ))}
                </select>
                <select aria-label="Agente" className="field" value={agenteId ?? ''} onChange={(e) => actualizar({ agente: e.target.value || undefined })}>
                    <option value="">Todos los agentes</option>
                    {agentes?.map((a) => (
                        <option key={a.userId} value={a.userId}>{a.nombre}</option>
                    ))}
                </select>
                {hayFiltros && (
                    <Button variant="ghost" size="sm" onClick={() => actualizar({ agente: undefined, giro: undefined })}>Limpiar filtros</Button>
                )}
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Qué mostrar en el mapa">
                {CATEGORIAS_MAPA.map((c) => {
                    const activa = !ocultas.has(c.id)
                    return (
                        <button
                            key={c.id}
                            type="button"
                            aria-pressed={activa}
                            title={c.ayuda}
                            onClick={() => alternar(c.id)}
                            className={cn(
                                'flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors',
                                activa ? 'bg-card font-medium' : 'text-muted-foreground line-through opacity-60 hover:opacity-100'
                            )}
                        >
                            <span className="size-3 rounded-full" style={{ backgroundColor: activa ? c.color : 'transparent', border: `2px solid ${c.color}` }} aria-hidden />
                            {c.etiqueta}
                            <span className="tabular-nums text-muted-foreground">{conteo.porCategoria[c.id]}</span>
                        </button>
                    )
                })}
            </div>

            {mapa.isError ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudo cargar el mapa.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void mapa.refetch()}>Reintentar</Button>
                </div>
            ) : (
                <>
                    {mapa.isLoading && <p className="text-sm text-muted-foreground">Cargando mapa…</p>}
                    {puntos?.length === 0 && (
                        <div className="surface flex items-center gap-3 p-6 text-sm text-muted-foreground">
                            <MapPinOff className="size-5" />
                            {hayFiltros ? 'Ningún negocio con ubicación coincide con los filtros.' : 'Todavía no hay negocios con ubicación. Los agentes la capturan con el GPS al registrarlos.'}
                        </div>
                    )}
                    <MapaNegocios puntos={pintados} onSeleccionar={(id) => actualizar({ negocio: id })} encuadre={`${agenteId ?? ''}|${giro ?? ''}|${puntos?.length ?? -1}`} />
                </>
            )}

            <section className="space-y-2">
                <h2 className="text-sm font-semibold">
                    Por visitar <span className="font-normal text-muted-foreground">({porVisitar.length})</span>
                </h2>
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Negocio</th>
                                <th>Agente</th>
                                <th>Por qué toca ir</th>
                                <th>Última visita</th>
                            </tr>
                        </thead>
                        <tbody>
                            {porVisitar.length === 0 && (
                                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No hay nada pendiente de visitar con estos filtros.</td></tr>
                            )}
                            {porVisitar.map((p) => (
                                <tr key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => actualizar({ negocio: p.id })}>
                                    <td>
                                        <button type="button" className="text-left font-medium hover:underline" onClick={(e) => { e.stopPropagation(); actualizar({ negocio: p.id }) }}>
                                            {p.nombreNegocio}
                                        </button>
                                        <div className="text-xs text-muted-foreground">{giroLabel(p.giro)} · {ESTADO_PROSPECTO_LABEL[p.estado]}</div>
                                    </td>
                                    <td>{p.agente}</td>
                                    <td>{razonPorVisitar(p, hoy)}</td>
                                    <td className="text-muted-foreground">{p.ultimaVisita ? fechaCorta(p.ultimaVisita) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <ProspectoDetalleDialog id={abierto} onClose={() => actualizar({ negocio: undefined })} />
        </div>
    )
}
