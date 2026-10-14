import { ExternalLink, MapPin } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import type { Visita } from '../interfaces/prospectos.interface'
import { useAgentes } from '../queries/agentes.queries'
import { useCuestionario, useProspecto } from '../queries/prospectos.queries'
import { dinero, fechaCorta, fechaHora } from '../utils/formato'
import { enlaceDeMapa, giroLabel, motivoNoLabel, RESULTADO_VISITA_LABEL } from '../utils/prospectos'
import { ProspectoEstadoBadge } from './ProspectoEstadoBadge'
import { RespuestasVisita } from './RespuestasVisita'

interface Props {
    /** Id del negocio a ver; `null` cierra. */
    id: string | null
    onClose: () => void
}

export const ProspectoDetalleDialog = ({ id, onClose }: Props) => (
    <Dialog open={id !== null} onOpenChange={(abierto) => !abierto && onClose()}>
        <DialogContent className="max-w-2xl">{id && <Detalle id={id} />}</DialogContent>
    </Dialog>
)

const Dato = ({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) => (
    <div>
        <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
        <dd className="text-sm">{children}</dd>
    </div>
)

const Detalle = ({ id }: { id: string }) => {
    const { data, isLoading, isError, error } = useProspecto(id)
    const { data: agentes } = useAgentes()

    if (isLoading) {
        return (
            <>
                <DialogTitle>Negocio</DialogTitle>
                <DialogDescription>Cargando…</DialogDescription>
            </>
        )
    }

    if (isError || !data) {
        return (
            <>
                <DialogTitle>Negocio</DialogTitle>
                <DialogDescription className="text-destructive">
                    {mensajeDeError(error, 'No se pudo cargar el negocio.') ?? 'No se pudo cargar el negocio.'}
                </DialogDescription>
            </>
        )
    }

    const { negocio, visitas, productos } = data
    const agente = agentes?.find((a) => a.userId === negocio.agenteId)
    const mapa = enlaceDeMapa(negocio)
    const ordenadas = [...visitas].sort((a, b) => b.fecha.localeCompare(a.fecha))

    return (
        <>
            <div>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                    {negocio.nombreNegocio}
                    <ProspectoEstadoBadge estado={negocio.estado} />
                </DialogTitle>
                <DialogDescription>
                    {giroLabel(negocio.giro)} · registrado {fechaCorta(negocio.creadoEn)}
                    {agente ? ` por ${agente.nombre}` : ''}
                </DialogDescription>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <dl className="grid gap-3 sm:grid-cols-2">
                    <Dato etiqueta="Dirección">{negocio.direccionTexto ?? '—'}</Dato>
                    <Dato etiqueta="Ubicación">
                        {mapa ? (
                            <a href={mapa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                <MapPin className="size-3.5" /> Ver en el mapa <ExternalLink className="size-3" />
                            </a>
                        ) : (
                            <span className="text-muted-foreground">Sin ubicación</span>
                        )}
                    </Dato>
                    <Dato etiqueta="Contacto">
                        {negocio.consentimientoContacto ? (
                            (negocio.contactoNombre ?? '—')
                        ) : (
                            <span className="text-muted-foreground">No autorizó guardar sus datos</span>
                        )}
                    </Dato>
                    <Dato etiqueta="Teléfono">
                        {negocio.consentimientoContacto && negocio.contactoTelefono ? (
                            <a href={`tel:${negocio.contactoTelefono}`} className="tabular-nums hover:underline">
                                {negocio.contactoTelefono}
                            </a>
                        ) : (
                            '—'
                        )}
                    </Dato>
                </dl>
                {negocio.fotoFachadaUrl && (
                    <img
                        src={negocio.fotoFachadaUrl}
                        alt={`Fachada de ${negocio.nombreNegocio}`}
                        className="h-28 w-40 rounded-lg border object-cover"
                    />
                )}
            </div>

            {(productos.length > 0 || negocio.empresaId !== null) && (
                <section className="space-y-2">
                    <h3 className="text-sm font-semibold">
                        Alta en Acentrax{' '}
                        <span className="font-normal text-muted-foreground">
                            {negocio.empresaId !== null ? `· ya es cliente (empresa ${negocio.empresaId})` : '· borrador sin aceptar'}
                        </span>
                    </h3>
                    {productos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">El agente no dejó productos cargados.</p>
                    ) : (
                        <ul className="divide-y rounded-lg border text-sm">
                            {productos.map((p) => (
                                <li key={p.id} className="flex items-baseline justify-between gap-3 px-3 py-2">
                                    <span>
                                        {p.nombre}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            {[p.codigoBarras, p.origen === 'CATALOGO' ? 'del catálogo' : null].filter(Boolean).join(' · ')}
                                        </span>
                                    </span>
                                    <span className="tabular-nums">{p.precioVenta !== null ? dinero(p.precioVenta) : 'Sin precio'}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <section className="space-y-3">
                <h3 className="text-sm font-semibold">
                    Visitas <span className="font-normal text-muted-foreground">({ordenadas.length})</span>
                </h3>
                {ordenadas.length === 0 && (
                    <p className="text-sm text-muted-foreground">Todavía no se registra ninguna visita.</p>
                )}
                {ordenadas.map((v) => (
                    <VisitaItem key={v.id} visita={v} />
                ))}
            </section>
        </>
    )
}

const VisitaItem = ({ visita }: { visita: Visita }) => {
    // La definición sirve también para el texto del motivo si es de una versión con motivos nuevos.
    const { data: cuestionario } = useCuestionario(visita.cuestionarioId)
    const motivo = visita.motivoNo
        ? (cuestionario?.definicion.motivosNo.find((m) => m.id === visita.motivoNo)?.texto ?? motivoNoLabel(visita.motivoNo))
        : null
    const hayRespuestas = visita.cuestionarioId !== null && visita.respuestas && Object.keys(visita.respuestas).length > 0

    return (
        <article className="space-y-2 rounded-lg border p-3">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{RESULTADO_VISITA_LABEL[visita.resultado]}</span>
                <span className="text-xs text-muted-foreground">{fechaHora(visita.fecha)}</span>
            </header>
            {motivo && (
                <p className="text-sm">
                    <span className="text-muted-foreground">Motivo: </span>
                    {motivo}
                </p>
            )}
            {visita.comentario && <p className="text-sm whitespace-pre-line">{visita.comentario}</p>}
            {visita.proximaVisita && (
                <p className="text-sm">
                    <span className="text-muted-foreground">Volver: </span>
                    {fechaCorta(visita.proximaVisita)}
                </p>
            )}
            {hayRespuestas && visita.cuestionarioId !== null && visita.respuestas && (
                <details className="group">
                    <summary className="cursor-pointer text-sm text-primary select-none hover:underline">
                        Ver cuestionario
                    </summary>
                    <div className="mt-2">
                        <RespuestasVisita cuestionarioId={visita.cuestionarioId} respuestas={visita.respuestas} />
                    </div>
                </details>
            )}
        </article>
    )
}
