import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AjusteTicketsDialog } from '../components/AjusteTicketsDialog'
import { PageHeader } from '../components/PageHeader'
import { Pildora } from '../components/EstadoBadge'
import type { TicketsEmpresa } from '../interfaces/tickets.interface'
import { useTickets } from '../queries/tickets.queries'

/** Quién va al tope: sin margen, o con menos del 20 % del cupo. */
const estadoDe = (e: TicketsEmpresa): 'agotado' | 'poco' | 'ok' | 'ilimitado' => {
    if (e.restantes === null || e.incluidosPlan === null) return 'ilimitado'
    if (e.restantes === 0) return 'agotado'
    return e.restantes <= (e.incluidosPlan + e.bono) * 0.2 ? 'poco' : 'ok'
}

export const TicketsPage = () => {
    const [busqueda, setBusqueda] = useState('')
    const [ajustando, setAjustando] = useState<TicketsEmpresa | null>(null)
    const { data, isLoading, isError, refetch } = useTickets(busqueda)

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Escaneos de ticket"
                descripcion="Cuántos tickets de compra ha leído la IA cada empresa este mes contra lo que incluye su plan. El tope de cada plan se edita en Planes; aquí puedes regalar escaneos extra a una empresa (valen solo este mes)."
            />

            <label className="relative block max-w-sm">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar empresa…"
                    aria-label="Buscar empresa"
                    className="h-9 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
            </label>

            {isError ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudo cargar el consumo.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            ) : (
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Plan</th>
                                <th className="text-right">Usados</th>
                                <th className="text-right">Incluidos</th>
                                <th className="text-right">Extra este mes</th>
                                <th className="text-right">Quedan</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Cargando…</td></tr>
                            )}
                            {data?.length === 0 && (
                                <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No hay empresas que coincidan.</td></tr>
                            )}
                            {data?.map((e) => {
                                const estado = estadoDe(e)
                                return (
                                    <tr key={e.empresaId}>
                                        <td className="font-medium">{e.nombre}</td>
                                        <td className="text-muted-foreground">{e.planNombre ?? '—'}</td>
                                        <td className="text-right tabular-nums">{e.usados.toLocaleString('es-MX')}</td>
                                        <td className="text-right tabular-nums">{e.incluidosPlan === null ? '∞' : e.incluidosPlan.toLocaleString('es-MX')}</td>
                                        <td className={cn('text-right tabular-nums', e.bono === 0 && 'text-muted-foreground')}>
                                            {e.bono > 0 ? `+${e.bono.toLocaleString('es-MX')}` : '—'}
                                        </td>
                                        <td className="text-right">
                                            {estado === 'agotado' && <Pildora className="bg-destructive/15 text-destructive">Agotado</Pildora>}
                                            {estado === 'poco' && (
                                                <Pildora className="bg-warning/15 text-warning">{e.restantes?.toLocaleString('es-MX')}</Pildora>
                                            )}
                                            {estado === 'ok' && <span className="tabular-nums">{e.restantes?.toLocaleString('es-MX')}</span>}
                                            {estado === 'ilimitado' && <span className="text-muted-foreground">∞</span>}
                                        </td>
                                        <td className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => setAjustando(e)}>Ajustar</Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <AjusteTicketsDialog empresa={ajustando} onClose={() => setAjustando(null)} />
        </div>
    )
}
