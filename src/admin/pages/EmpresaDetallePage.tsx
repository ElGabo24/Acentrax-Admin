import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/api/apiError'
import { CambioSuscripcionDialog, type AccionSuscripcion } from '../components/CambioSuscripcionDialog'
import { EstadoBadge } from '../components/EstadoBadge'
import { SaldoMensajesSection } from '../components/SaldoMensajesSection'
import type { AdminSuscripcion, AdminUsoPlan } from '../interfaces/empresa.interface'
import { useEmpresa } from '../queries/empresas.queries'
import { usePlanes } from '../queries/planes.queries'
import { dinero, fechaCorta, haceCuanto, RECURSO_LABEL } from '../utils/formato'

const Dato = ({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) => (
    <div>
        <dt className="text-xs font-medium text-muted-foreground">{etiqueta}</dt>
        <dd className="mt-0.5 text-sm">{children || '—'}</dd>
    </div>
)

const BarraUso = ({ uso }: { uso: AdminUsoPlan }) => {
    const ilimitado = uso.limite === null
    const pct = ilimitado || uso.limite === 0 ? 0 : Math.min(100, (uso.uso / uso.limite!) * 100)
    return (
        <li className="space-y-1">
            <div className="flex justify-between text-sm">
                <span>{RECURSO_LABEL[uso.recurso] ?? uso.recurso}</span>
                <span className={cn('tabular-nums', uso.excedido && 'font-medium text-destructive')}>
                    {ilimitado ? `${uso.uso} (ilimitado)` : `${uso.uso} de ${uso.limite}`}
                </span>
            </div>
            {!ilimitado && (
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                        className={cn('h-full rounded-full', uso.excedido || pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-warning' : 'bg-primary')}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </li>
    )
}

const DatosSuscripcion = ({ s }: { s: AdminSuscripcion }) => (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        <Dato etiqueta="Plan">{s.planNombre}</Dato>
        <Dato etiqueta="Estado"><EstadoBadge estado={s.estado} /></Dato>
        <Dato etiqueta="Días restantes">{s.diasRestantes}</Dato>
        <Dato etiqueta="Vigencia hasta">{fechaCorta(s.vigenciaHasta)}</Dato>
        <Dato etiqueta="Periodo">{s.periodo}</Dato>
        <Dato etiqueta="Renovación automática">{s.renovacionAutomatica ? 'Sí' : 'No'}</Dato>
        <Dato etiqueta="Método de pago">{s.metodoPago}</Dato>
        <Dato etiqueta="Proveedor">{s.proveedor}</Dato>
        <Dato etiqueta="Fin de gracia">{fechaCorta(s.finGracia)}</Dato>
        <Dato etiqueta="Prueba">{s.inicioPrueba ? `${fechaCorta(s.inicioPrueba)} → ${fechaCorta(s.finPrueba)}` : null}</Dato>
        <Dato etiqueta="Periodo actual">{s.inicioPeriodo ? `${fechaCorta(s.inicioPeriodo)} → ${fechaCorta(s.finPeriodo)}` : null}</Dato>
        <Dato etiqueta="Cancelada">{s.canceladaAt ? fechaCorta(s.canceladaAt) : null}</Dato>
    </dl>
)

export const EmpresaDetallePage = () => {
    const id = Number(useParams().id)
    const [accion, setAccion] = useState<AccionSuscripcion | null>(null)

    const { data: empresa, isLoading, error, refetch } = useEmpresa(id)
    const { data: planes } = usePlanes()

    const volver = (
        <Link to="/" className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Volver a empresas
        </Link>
    )

    if (isLoading) return <div className="space-y-4">{volver}<p className="text-sm text-muted-foreground">Cargando…</p></div>

    if (!empresa) {
        const noExiste = error instanceof ApiError && error.code === 'EMPRESA_NOT_FOUND'
        return (
            <div className="space-y-4">
                {volver}
                <p className="text-sm text-destructive">
                    {noExiste || !Number.isFinite(id) ? 'Esa empresa no existe.' : 'No se pudo cargar la empresa.'}
                </p>
                {!noExiste && <Button variant="outline" size="sm" onClick={() => void refetch()}>Reintentar</Button>}
            </div>
        )
    }

    const s = empresa.suscripcion

    return (
        <div className="space-y-6">
            {volver}

            <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold tracking-tight">{empresa.nombre}</h1>
                    <p className="text-sm text-muted-foreground">
                        {[empresa.correo, empresa.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                        {' · '}Última actividad {haceCuanto(empresa.ultimaActividad)}
                    </p>
                </div>
                <EstadoBadge estado={s?.estado ?? null} />
            </header>

            <section className="space-y-3 surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold">Suscripción</h2>
                    {s && (
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => setAccion('plan')} disabled={!planes}>Cambiar plan</Button>
                            <Button variant="outline" size="sm" onClick={() => setAccion('extender')}>Extender días</Button>
                            <Button variant="outline" size="sm" onClick={() => setAccion('estado')}>Cambiar estado</Button>
                        </div>
                    )}
                </div>
                {s ? <DatosSuscripcion s={s} /> : (
                    <p className="text-sm text-muted-foreground">Esta empresa todavía no tiene una suscripción, así que no hay acciones disponibles.</p>
                )}
            </section>

            {empresa.uso.length > 0 && (
                <section className="space-y-3 surface p-5">
                    <h2 className="text-base font-semibold">Uso del plan</h2>
                    <ul className="space-y-3">
                        {empresa.uso.map((u) => <BarraUso key={u.recurso} uso={u} />)}
                    </ul>
                </section>
            )}

            <SaldoMensajesSection empresaId={empresa.id} />

            <section className="space-y-3 surface p-5">
                <h2 className="text-base font-semibold">Pagos</h2>
                {empresa.pagos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="data-table -mx-5 w-[calc(100%+2.5rem)]">
                            <thead>
                                <tr>
                                    <th>Folio</th>
                                    <th>Fecha</th>
                                    <th>Periodo</th>
                                    <th>Método</th>
                                    <th>Estado</th>
                                    <th className="text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {empresa.pagos.map((p) => (
                                    <tr key={p.id}>
                                        <td className="font-mono text-xs">{p.folio}</td>
                                        <td className="pr-3">{fechaCorta(p.pagadoAt ?? p.createdAt)}</td>
                                        <td className="text-muted-foreground">
                                            {p.periodoInicio ? `${fechaCorta(p.periodoInicio)} → ${fechaCorta(p.periodoFin)}` : '—'}
                                        </td>
                                        <td className="pr-3">{[p.metodo, p.proveedor].filter(Boolean).join(' · ') || '—'}</td>
                                        <td className="pr-3">{p.estado}</td>
                                        <td className="text-right tabular-nums">{dinero(p.monto, p.moneda)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <CambioSuscripcionDialog
                accion={accion}
                empresa={empresa}
                planes={planes ?? []}
                onClose={() => setAccion(null)}
            />
        </div>
    )
}
