import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { EstadoProspecto } from '../interfaces/prospectos.interface'
import { useCuestionarioActivo, useResumenProspectos } from '../queries/prospectos.queries'
import { ESTADO_PROSPECTO_LABEL, ESTADOS_PROSPECTO, giroLabel, motivoNoLabel } from '../utils/prospectos'
import { StatTile } from './StatTile'

/** Una fila con barra: la anchura es la parte que le toca del máximo, no del total, para que se note la diferencia. */
const Barra = ({
    etiqueta,
    valor,
    maximo,
    onClick,
    activa,
    tono = 'bg-primary',
}: {
    etiqueta: string
    valor: number
    maximo: number
    onClick?: () => void
    activa?: boolean
    tono?: string
}) => {
    const contenido = (
        <>
            <span className="flex justify-between gap-3 text-sm">
                <span className={cn(activa && 'font-semibold')}>{etiqueta}</span>
                <span className="tabular-nums text-muted-foreground">{valor}</span>
            </span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span
                    className={cn('block h-full rounded-full transition-all', tono)}
                    style={{ width: `${maximo > 0 ? Math.max((valor / maximo) * 100, valor > 0 ? 3 : 0) : 0}%` }}
                />
            </span>
        </>
    )
    return onClick ? (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={activa}
            className="block w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted"
        >
            {contenido}
        </button>
    ) : (
        <div className="px-2 py-1.5">{contenido}</div>
    )
}

const Tarjeta = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <section className="surface p-3">
        <h2 className="px-2 pb-1 text-xs font-medium text-muted-foreground">{titulo}</h2>
        {children}
    </section>
)

const Vacio = ({ children }: { children: React.ReactNode }) => (
    <p className="px-2 py-3 text-sm text-muted-foreground">{children}</p>
)

interface Props {
    estado?: EstadoProspecto
    giro?: string
    agenteId?: string
    onFiltrarEstado: (estado: EstadoProspecto | undefined) => void
    onFiltrarGiro: (giro: string | undefined) => void
    onFiltrarAgente: (agenteId: string | undefined) => void
}

/** Cifras del embudo y de dónde salen los negocios. Tocar una barra filtra la lista de abajo. */
export const ResumenProspectosBlock = ({ estado, giro, agenteId, onFiltrarEstado, onFiltrarGiro, onFiltrarAgente }: Props) => {
    const { data, isLoading, isError, refetch } = useResumenProspectos()
    // Los motivos los edita el superadmin: se nombran con la versión vigente y, si ya no están, con los de siempre.
    const { data: activo } = useCuestionarioActivo()
    const nombreDeMotivo = (id: string) => activo?.definicion.motivosNo.find((m) => m.id === id)?.texto ?? motivoNoLabel(id)

    if (isError) {
        return (
            <div className="surface p-6 text-sm">
                <p className="text-destructive">No se pudo cargar el resumen.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
            </div>
        )
    }

    if (isLoading || !data) {
        return <div className="surface p-6 text-sm text-muted-foreground">Cargando resumen…</div>
    }

    const cuenta = (estado: EstadoProspecto) => data.porEstado[estado] ?? 0
    // Interesados: los que dijeron que sí en algún punto del camino (aún sin ser clientes, y los que ya lo son).
    const interesados = cuenta('INTERESADO') + cuenta('ALTA_BORRADOR') + cuenta('CONVERTIDO')
    const conRespuesta = data.total - cuenta('NUEVO') - cuenta('VISITADO')
    const tasa = conRespuesta > 0 ? Math.round((interesados / conRespuesta) * 100) : null

    const maxEstado = Math.max(0, ...ESTADOS_PROSPECTO.map(cuenta))
    const giros = Object.entries(data.porGiro).sort((a, b) => b[1] - a[1])
    const maxGiro = giros[0]?.[1] ?? 0
    const agentes = [...data.porAgente].sort((a, b) => b.prospectos - a.prospectos)
    const maxAgente = agentes[0]?.prospectos ?? 0
    const motivos = Object.entries(data.motivosNo).sort((a, b) => b[1] - a[1])
    const maxMotivo = motivos[0]?.[1] ?? 0

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile etiqueta="Negocios registrados" valor={data.total} destacado />
                <StatTile etiqueta="Interesados" valor={interesados} detalle="Incluye los que ya son clientes" />
                <StatTile
                    etiqueta="Interés entre quienes contestaron"
                    valor={tasa === null ? '—' : `${tasa}%`}
                    detalle={conRespuesta > 0 ? `${interesados} de ${conRespuesta}` : 'Aún no hay respuestas'}
                />
                <StatTile etiqueta="Por visitar de nuevo" valor={cuenta('SEGUIMIENTO')} detalle="Dijeron «quizás»" />
            </div>

            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                <Tarjeta titulo="Embudo">
                    {ESTADOS_PROSPECTO.map((e) => (
                        <Barra
                            key={e}
                            etiqueta={ESTADO_PROSPECTO_LABEL[e]}
                            valor={cuenta(e)}
                            maximo={maxEstado}
                            activa={estado === e}
                            tono={e === 'NO_INTERESADO' ? 'bg-destructive/70' : e === 'CONVERTIDO' ? 'bg-success' : 'bg-primary'}
                            onClick={() => onFiltrarEstado(estado === e ? undefined : e)}
                        />
                    ))}
                </Tarjeta>

                <Tarjeta titulo="Por qué dijeron que no">
                    {motivos.length === 0 ? (
                        <Vacio>Todavía nadie ha dicho que no.</Vacio>
                    ) : (
                        motivos.map(([motivo, n]) => (
                            <Barra key={motivo} etiqueta={nombreDeMotivo(motivo)} valor={n} maximo={maxMotivo} tono="bg-destructive/70" />
                        ))
                    )}
                </Tarjeta>

                <Tarjeta titulo="Por giro">
                    {giros.length === 0 ? (
                        <Vacio>Sin negocios todavía.</Vacio>
                    ) : (
                        giros.map(([g, n]) => (
                            <Barra
                                key={g}
                                etiqueta={giroLabel(g)}
                                valor={n}
                                maximo={maxGiro}
                                activa={giro === g}
                                onClick={() => onFiltrarGiro(giro === g ? undefined : g)}
                            />
                        ))
                    )}
                </Tarjeta>

                <Tarjeta titulo="Por agente">
                    {agentes.length === 0 ? (
                        <Vacio>Sin negocios todavía.</Vacio>
                    ) : (
                        agentes.map((a) => (
                            <Barra
                                key={a.agenteId}
                                etiqueta={a.nombre}
                                valor={a.prospectos}
                                maximo={maxAgente}
                                activa={agenteId === a.agenteId}
                                onClick={() => onFiltrarAgente(agenteId === a.agenteId ? undefined : a.agenteId)}
                            />
                        ))
                    )}
                </Tarjeta>
            </div>
        </div>
    )
}
