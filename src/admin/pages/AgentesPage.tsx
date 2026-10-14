import { useState } from 'react'
import { KeyRound, Plus, UserCheck, UserPlus, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ActivoAgenteDialog } from '../components/ActivoAgenteDialog'
import { AgenteDialog } from '../components/AgenteDialog'
import { ContraseniaAgenteDialog } from '../components/ContraseniaAgenteDialog'
import { Pildora } from '../components/EstadoBadge'
import { PageHeader } from '../components/PageHeader'
import { PromoverAgenteDialog } from '../components/PromoverAgenteDialog'
import type { AdminAgente } from '../interfaces/prospectos.interface'
import { useAgentes } from '../queries/agentes.queries'
import { fechaCorta } from '../utils/formato'

export const AgentesPage = () => {
    const [creando, setCreando] = useState(false)
    const [promoviendo, setPromoviendo] = useState(false)
    const [cambiandoActivo, setCambiandoActivo] = useState<AdminAgente | null>(null)
    const [conContrasenia, setConContrasenia] = useState<AdminAgente | null>(null)

    const { data, isLoading, isError, refetch } = useAgentes()

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Agentes"
                descripcion="Quienes visitan negocios con la app de prospectos. Aquí les das acceso, les restableces la contraseña o los das de baja."
                accion={
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="lg" onClick={() => setPromoviendo(true)}>
                            <UserPlus /> Convertir una cuenta existente
                        </Button>
                        <Button size="lg" onClick={() => setCreando(true)}>
                            <Plus /> Nuevo agente
                        </Button>
                    </div>
                }
            />

            {isError ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudieron cargar los agentes.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            ) : (
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Agente</th>
                                <th>Teléfono</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Alta</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Cargando agentes…</td></tr>
                            )}
                            {data?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                                        Todavía no hay agentes. Convierte tu cuenta o crea el primero.
                                    </td>
                                </tr>
                            )}
                            {data?.map((a) => (
                                <tr key={a.userId} className={cn(!a.activo && 'text-muted-foreground')}>
                                    <td>
                                        <div className="font-medium">{`${a.nombre} ${a.apellidos}`.trim()}</div>
                                        <div className="text-xs text-muted-foreground">{a.correo}</div>
                                    </td>
                                    <td className="whitespace-nowrap tabular-nums">{a.telefono}</td>
                                    <td>{a.tipo === 'PROPIO' ? 'Propio' : 'Distribuidor'}</td>
                                    <td>
                                        {a.activo ? (
                                            <Pildora className="bg-success/15 text-success">Activo</Pildora>
                                        ) : (
                                            <div>
                                                <Pildora className="bg-muted text-muted-foreground">De baja</Pildora>
                                                {a.desactivadoEn && (
                                                    <div className="mt-0.5 text-xs">{fechaCorta(a.desactivadoEn)}</div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap">{fechaCorta(a.creadoEn)}</td>
                                    <td>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label={`Restablecer la contraseña de ${a.nombre}`}
                                                title="Restablecer contraseña"
                                                onClick={() => setConContrasenia(a)}
                                            >
                                                <KeyRound /> <span className="hidden xl:inline">Contraseña</span>
                                            </Button>
                                            <Button
                                                variant={a.activo ? 'ghost' : 'outline'}
                                                size="sm"
                                                aria-label={`${a.activo ? 'Dar de baja a' : 'Reactivar a'} ${a.nombre}`}
                                                title={a.activo ? 'Dar de baja' : 'Reactivar'}
                                                onClick={() => setCambiandoActivo(a)}
                                            >
                                                {a.activo ? <UserX /> : <UserCheck />}
                                                <span className="hidden xl:inline">{a.activo ? 'Dar de baja' : 'Reactivar'}</span>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AgenteDialog abierto={creando} onClose={() => setCreando(false)} />
            <PromoverAgenteDialog abierto={promoviendo} onClose={() => setPromoviendo(false)} />
            <ActivoAgenteDialog agente={cambiandoActivo} onClose={() => setCambiandoActivo(null)} />
            <ContraseniaAgenteDialog agente={conContrasenia} onClose={() => setConContrasenia(null)} />
        </div>
    )
}
