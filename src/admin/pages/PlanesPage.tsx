import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PageHeader } from '../components/PageHeader'
import { Pildora } from '../components/EstadoBadge'
import { PlanDialog } from '../components/PlanDialog'
import type { AdminPlan } from '../interfaces/plan.interface'
import { usePlanes } from '../queries/planes.queries'
import { dinero } from '../utils/formato'

const tope = (n: number | null) => (n === null ? '∞' : n.toLocaleString('es-MX'))

export const PlanesPage = () => {
    const [editando, setEditando] = useState<AdminPlan | 'nuevo' | null>(null)
    const { data, isLoading, isError, refetch } = usePlanes()

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Planes"
                descripcion="Precios, límites y módulos de cada plan. Toca un plan para editarlo."
                accion={<Button size="lg" onClick={() => setEditando('nuevo')}><Plus /> Nuevo plan</Button>}
            />

            {isError ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudieron cargar los planes.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            ) : (
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Plan</th>
                                <th className="text-right">Mensual</th>
                                <th className="text-right">Anual</th>
                                <th title="Usuarios / productos / ubicaciones / dispositivos con PIN / mensajes">Límites</th>
                                <th>Módulos</th>
                                <th className="text-right">Empresas</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Cargando planes…</td></tr>
                            )}
                            {data?.map((p) => (
                                <tr
                                    key={p.id}
                                    className={cn('cursor-pointer hover:bg-muted/50', !p.activo && 'text-muted-foreground')}
                                    onClick={() => setEditando(p)}
                                >
                                    <td>
                                        <button
                                            type="button"
                                            className="text-left font-medium hover:underline"
                                            onClick={(e) => { e.stopPropagation(); setEditando(p) }}
                                        >
                                            {p.nombre}
                                        </button>
                                        <div className="font-mono text-xs text-muted-foreground">{p.codigo}</div>
                                    </td>
                                    <td className="text-right tabular-nums">{dinero(p.precioMensual, p.moneda)}</td>
                                    <td className="text-right tabular-nums">{dinero(p.precioAnual, p.moneda)}</td>
                                    <td className="tabular-nums">
                                        {[p.maxUsuarios, p.maxProductos, p.maxUbicaciones, p.maxDispositivos, p.maxMensajesMes].map(tope).join(' / ')}
                                    </td>
                                    <td className="text-muted-foreground">{p.modulos.length}</td>
                                    <td className="text-right tabular-nums">{p.empresas}</td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {p.activo && p.visible && p.cobrable && (
                                                <Pildora className="bg-success/15 text-success">Activo</Pildora>
                                            )}
                                            {!p.activo && <Pildora className="bg-muted text-muted-foreground">Inactivo</Pildora>}
                                            {!p.visible && <Pildora className="bg-secondary text-secondary-foreground">Heredado</Pildora>}
                                            {!p.cobrable && <Pildora className="bg-warning/15 text-warning">Sin Stripe</Pildora>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <PlanDialog plan={editando} onClose={() => setEditando(null)} />
        </div>
    )
}
