import { useState } from 'react'
import { MessageCircle, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PageHeader } from '../components/PageHeader'
import { Pildora } from '../components/EstadoBadge'
import { useMetricas, useSeguimiento } from '../queries/prospectos.queries'
import { aFechaIso, fechaCorta, haceCuanto } from '../utils/formato'
import { enlaceDeWhatsApp } from '../utils/prospectos'

type Periodo = '7' | '30' | 'mes' | 'otro'

const hoy = () => new Date()

/** El periodo como días `yyyy-MM-dd` (el servidor cuenta `hasta` completo). */
const rango = (periodo: Periodo, otroDesde: string, otroHasta: string): [string | undefined, string | undefined] => {
    const fin = hoy()
    switch (periodo) {
        case '7':
            return [aFechaIso(new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() - 6)), aFechaIso(fin)]
        case '30':
            return [aFechaIso(new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() - 29)), aFechaIso(fin)]
        case 'mes':
            return [aFechaIso(new Date(fin.getFullYear(), fin.getMonth(), 1)), aFechaIso(fin)]
        case 'otro':
            return [otroDesde || undefined, otroHasta || undefined]
    }
}

const PERIODOS: { valor: Periodo; etiqueta: string }[] = [
    { valor: '7', etiqueta: '7 días' },
    { valor: '30', etiqueta: '30 días' },
    { valor: 'mes', etiqueta: 'Este mes' },
    { valor: 'otro', etiqueta: 'Otro' },
]

export const SeguimientoPage = () => {
    const [diasSinUso, setDiasSinUso] = useState(7)
    const [diasEspera, setDiasEspera] = useState(2)
    const [periodo, setPeriodo] = useState<Periodo>('30')
    const [otroDesde, setOtroDesde] = useState('')
    const [otroHasta, setOtroHasta] = useState('')

    const seguimiento = useSeguimiento(diasSinUso, diasEspera)
    const [desde, hasta] = rango(periodo, otroDesde, otroHasta)
    const metricas = useMetricas(desde, hasta)

    const chip = (activo: boolean) =>
        cn(
            'rounded-full border px-3 py-1 text-sm transition-colors',
            activo ? 'border-transparent bg-primary text-primary-foreground font-medium' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
        )

    return (
        <div className="space-y-8">
            <PageHeader titulo="Seguimiento" descripcion="A quién llamar y cómo le va a cada agente." />

            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold">Clientes que no están usando el sistema</h2>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        Sin actividad desde hace
                        <select className="field" value={diasSinUso} onChange={(e) => setDiasSinUso(Number(e.target.value))}>
                            {[3, 7, 14, 30].map((d) => (
                                <option key={d} value={d}>{d} días</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Negocio</th>
                                <th>Agente</th>
                                <th>Dado de alta</th>
                                <th>Última actividad</th>
                                <th className="text-right">Días sin usarlo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seguimiento.isLoading && (
                                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Cargando…</td></tr>
                            )}
                            {seguimiento.data?.altas.length === 0 && (
                                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Todos tus clientes nuevos están usando el sistema. 🎉</td></tr>
                            )}
                            {seguimiento.data?.altas.map((a) => (
                                <tr key={a.prospectoId}>
                                    <td className="font-medium">{a.nombreNegocio}</td>
                                    <td>{a.agente}</td>
                                    <td>{fechaCorta(a.convertidoEn)}</td>
                                    <td className="text-muted-foreground">{a.ultimaActividad ? haceCuanto(a.ultimaActividad) : 'Nunca'}</td>
                                    <td className="text-right font-semibold text-destructive tabular-nums">{a.diasSinActividad}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold">Invitaciones sin aceptar</h2>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        Enviadas hace más de
                        <select className="field" value={diasEspera} onChange={(e) => setDiasEspera(Number(e.target.value))}>
                            {[1, 2, 3, 5, 7].map((d) => (
                                <option key={d} value={d}>{d} {d === 1 ? 'día' : 'días'}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Negocio</th>
                                <th>Agente</th>
                                <th>Enviada</th>
                                <th>Estado</th>
                                <th>Contacto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seguimiento.data?.invitaciones.length === 0 && (
                                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No hay invitaciones esperando.</td></tr>
                            )}
                            {seguimiento.data?.invitaciones.map((i) => {
                                const whatsapp = enlaceDeWhatsApp(i.contactoTelefono)
                                return (
                                    <tr key={i.prospectoId}>
                                        <td className="font-medium">{i.nombreNegocio}</td>
                                        <td>{i.agente}</td>
                                        <td>hace {i.diasDesdeEnvio} {i.diasDesdeEnvio === 1 ? 'día' : 'días'}</td>
                                        <td>
                                            {i.situacion === 'VENCIDA' ? (
                                                <Pildora className="bg-destructive/15 text-destructive">Venció</Pildora>
                                            ) : (
                                                <Pildora className="bg-warning/15 text-warning">Vence {fechaCorta(i.expiraEn)}</Pildora>
                                            )}
                                        </td>
                                        <td>
                                            {i.contactoTelefono ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="tabular-nums">{i.contactoNombre ? `${i.contactoNombre} · ` : ''}{i.contactoTelefono}</span>
                                                    <Button asChild variant="ghost" size="icon-sm">
                                                        <a href={`tel:${i.contactoTelefono}`} aria-label={`Llamar a ${i.nombreNegocio}`}><Phone /></a>
                                                    </Button>
                                                    {whatsapp && (
                                                        <Button asChild variant="ghost" size="icon-sm">
                                                            <a href={whatsapp} target="_blank" rel="noreferrer" aria-label={`WhatsApp a ${i.nombreNegocio}`}><MessageCircle /></a>
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">No autorizó guardar su teléfono</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold">Rendimiento por agente</h2>
                    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Periodo">
                        {PERIODOS.map((p) => (
                            <button key={p.valor} type="button" className={chip(periodo === p.valor)} aria-pressed={periodo === p.valor} onClick={() => setPeriodo(p.valor)}>
                                {p.etiqueta}
                            </button>
                        ))}
                        {periodo === 'otro' && (
                            <>
                                <input type="date" className="field" aria-label="Desde" value={otroDesde} max={otroHasta || undefined} onChange={(e) => setOtroDesde(e.target.value)} />
                                <input type="date" className="field" aria-label="Hasta" value={otroHasta} min={otroDesde || undefined} onChange={(e) => setOtroHasta(e.target.value)} />
                            </>
                        )}
                    </div>
                </div>
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Agente</th>
                                <th className="text-right">Negocios</th>
                                <th className="text-right">Visitas</th>
                                <th className="text-right">Interesados</th>
                                <th className="text-right">No le interesó</th>
                                <th className="text-right">Invitaciones</th>
                                <th className="text-right">Clientes</th>
                                <th className="text-right" title="Con borrador de alta sin aceptar, hoy">En alta</th>
                                <th className="text-right" title="Interesados o en seguimiento cuya próxima visita ya pasó, hoy">Por volver</th>
                                <th>Última visita</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metricas.isLoading && (
                                <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">Cargando…</td></tr>
                            )}
                            {metricas.data?.length === 0 && (
                                <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">Todavía no hay agentes.</td></tr>
                            )}
                            {metricas.data?.map((m) => (
                                <tr key={m.agenteId} className={cn(!m.activo && 'text-muted-foreground')}>
                                    <td className="font-medium">{m.nombre}{!m.activo && ' (de baja)'}</td>
                                    <td className="text-right tabular-nums">{m.negocios}</td>
                                    <td className="text-right tabular-nums">{m.visitas}</td>
                                    <td className="text-right tabular-nums">{m.interesados}</td>
                                    <td className="text-right tabular-nums">{m.rechazos}</td>
                                    <td className="text-right tabular-nums">{m.invitaciones}</td>
                                    <td className="text-right font-semibold tabular-nums">{m.clientes}</td>
                                    <td className="text-right tabular-nums">{m.enAlta}</td>
                                    <td className={cn('text-right tabular-nums', m.seguimientosVencidos > 0 && 'font-semibold text-warning')}>{m.seguimientosVencidos}</td>
                                    <td className="text-muted-foreground">{m.ultimaVisita ? haceCuanto(m.ultimaVisita) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}
