import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import type { AdminAgente } from '../interfaces/prospectos.interface'
import { useDesvincularAgente, useVincularAgente } from '../queries/agentes.queries'
import { Campo, inputClass } from './Campo'
import { companerosDe, nombreDe } from '../utils/equipo'

interface Props {
    agente: AdminAgente | null
    /** Todos los agentes: de aquí salen los compañeros posibles y los actuales. */
    agentes: AdminAgente[]
    onClose: () => void
}

/** Vincular a un agente con otro (comparten negocios) o sacarlo de su equipo. */
export const EquipoAgenteDialog = ({ agente, agentes, onClose }: Props) => (
    <Dialog open={agente !== null} onOpenChange={(a) => !a && onClose()}>
        <DialogContent className="max-w-md">
            {agente && <Contenido agente={agente} agentes={agentes} onClose={onClose} />}
        </DialogContent>
    </Dialog>
)

const Contenido = ({ agente, agentes, onClose }: { agente: AdminAgente; agentes: AdminAgente[]; onClose: () => void }) => {
    const companeros = companerosDe(agente, agentes)
    const enEquipo = agente.equipoId !== null

    // Quien ya está en otro equipo no se puede vincular con alguien más sin sacarlo antes: el servidor lo rechaza.
    const posibles = agentes.filter(
        (a) => a.userId !== agente.userId && a.activo && (a.equipoId === null || a.equipoId === agente.equipoId) && !companeros.includes(a)
    )
    const [companeroId, setCompaneroId] = useState('')

    const vincular = useVincularAgente({
        onSuccess: () => {
            toast.success(`${agente.nombre} ya comparte negocios con su compañero.`)
            onClose()
        },
    })
    const desvincular = useDesvincularAgente({
        onSuccess: () => {
            toast.success(`${agente.nombre} ya no comparte negocios.`)
            onClose()
        },
    })

    const error = vincular.error
        ? mensajeDeError(vincular.error, 'No se pudo vincular al agente.')
        : desvincular.error
          ? mensajeDeError(desvincular.error, 'No se pudo sacar al agente del equipo.')
          : null
    const ocupado = vincular.isPending || desvincular.isPending

    return (
        <div className="flex flex-col gap-4">
            <div>
                <DialogTitle>Equipo de {agente.nombre}</DialogTitle>
                <DialogDescription>
                    Quienes están en el mismo equipo ven y completan los mismos negocios: lo que uno registra, el otro lo
                    abre en su teléfono, agrega productos y hasta genera la invitación. Cada negocio sigue a nombre de
                    quien lo capturó.
                </DialogDescription>
            </div>

            {enEquipo && (
                <div className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-medium">Comparte negocios con</p>
                    <ul className="mt-1 list-disc pl-5">
                        {companeros.map((c) => (
                            <li key={c.userId}>{nombreDe(c)}</li>
                        ))}
                    </ul>
                </div>
            )}

            {posibles.length > 0 ? (
                <Campo etiqueta={enEquipo ? 'Agregar a alguien más al equipo' : 'Vincular con'}>
                    <select className={inputClass} value={companeroId} onChange={(e) => setCompaneroId(e.target.value)}>
                        <option value="">Elige un agente…</option>
                        {posibles.map((a) => (
                            <option key={a.userId} value={a.userId}>
                                {nombreDe(a)} · {a.correo}
                            </option>
                        ))}
                    </select>
                </Campo>
            ) : (
                !enEquipo && (
                    <p className="text-sm text-muted-foreground">
                        No hay otro agente sin equipo con quien vincularlo. Da de alta o convierte primero la cuenta de su compañero.
                    </p>
                )
            )}

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap justify-between gap-2">
                {enEquipo ? (
                    <Button type="button" variant="destructive" disabled={ocupado} onClick={() => desvincular.mutate(agente.userId)}>
                        {desvincular.isPending && <Loader2 className="animate-spin" />}
                        Sacar del equipo
                    </Button>
                ) : (
                    <span />
                )}
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button
                        type="button"
                        disabled={!companeroId || ocupado}
                        onClick={() => vincular.mutate({ userId: agente.userId, companeroId })}
                    >
                        {vincular.isPending && <Loader2 className="animate-spin" />}
                        Vincular
                    </Button>
                </div>
            </div>
        </div>
    )
}
