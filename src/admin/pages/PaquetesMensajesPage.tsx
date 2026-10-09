import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PageHeader } from '../components/PageHeader'
import { Pildora } from '../components/EstadoBadge'
import { PaqueteDialog } from '../components/PaqueteDialog'
import type { AdminPaqueteMensajes } from '../interfaces/paqueteMensajes.interface'
import { usePaquetes } from '../queries/paquetes.queries'
import { dinero } from '../utils/formato'

export const PaquetesMensajesPage = () => {
    const [editando, setEditando] = useState<AdminPaqueteMensajes | 'nuevo' | null>(null)
    const { data, isLoading, isError, refetch } = usePaquetes()

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Paquetes de mensajes"
                descripcion="Los paquetes de WhatsApp que las empresas pueden comprar. Toca uno para editarlo; para retirarlo, desmárcalo como activo."
                accion={<Button size="lg" onClick={() => setEditando('nuevo')}><Plus /> Nuevo paquete</Button>}
            />

            {isError ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudieron cargar los paquetes.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            ) : (
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Paquete</th>
                                <th className="text-right">Mensajes</th>
                                <th className="text-right">Precio</th>
                                <th className="text-right">Orden</th>
                                <th className="text-right">Compras pagadas</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Cargando paquetes…</td></tr>
                            )}
                            {data?.length === 0 && (
                                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Todavía no hay paquetes.</td></tr>
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
                                    <td className="text-right tabular-nums">{p.mensajes.toLocaleString('es-MX')}</td>
                                    <td className="text-right tabular-nums">{dinero(p.precio, p.moneda)}</td>
                                    <td className="text-right tabular-nums">{p.orden}</td>
                                    <td className="text-right tabular-nums">{p.comprasPagadas}</td>
                                    <td>
                                        {p.activo
                                            ? <Pildora className="bg-success/15 text-success">Activo</Pildora>
                                            : <Pildora className="bg-muted text-muted-foreground">Retirado</Pildora>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <PaqueteDialog paquete={editando} onClose={() => setEditando(null)} />
        </div>
    )
}
