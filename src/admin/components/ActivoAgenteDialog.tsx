import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import type { AdminAgente } from '../interfaces/prospectos.interface'
import { useCambiarActivoAgente } from '../queries/agentes.queries'

interface Props {
    agente: AdminAgente | null
    onClose: () => void
}

/** Dar de baja o reactivar a un agente, con lo que implica dicho antes de confirmar. */
export const ActivoAgenteDialog = ({ agente, onClose }: Props) => (
    <Dialog open={agente !== null} onOpenChange={(a) => !a && onClose()}>
        <DialogContent className="max-w-md">{agente && <Confirmacion agente={agente} onClose={onClose} />}</DialogContent>
    </Dialog>
)

const Confirmacion = ({ agente, onClose }: { agente: AdminAgente; onClose: () => void }) => {
    // Lo que se va a hacer: lo contrario de como está.
    const activar = !agente.activo

    const mutation = useCambiarActivoAgente({
        onSuccess: () => {
            toast.success(activar ? `${agente.nombre} volvió a ser agente.` : `${agente.nombre} quedó dado de baja.`)
            onClose()
        },
    })

    const error = mutation.error ? mensajeDeError(mutation.error, 'No se pudo cambiar el estado del agente.') : null

    return (
        <>
            <div>
                <DialogTitle>{activar ? `Reactivar a ${agente.nombre}` : `Dar de baja a ${agente.nombre}`}</DialogTitle>
                <DialogDescription>
                    {activar
                        ? 'Podrá volver a entrar a la app y registrar visitas. Lo que ya capturó sigue ahí.'
                        : 'Deja de poder usar la app de prospectos. Si su cuenta no tiene un negocio, también se bloquea y se cierran sus sesiones. Lo que ya registró se conserva.'}
                </DialogDescription>
            </div>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button
                    type="button"
                    variant={activar ? 'default' : 'destructive'}
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ userId: agente.userId, activo: activar })}
                >
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    {activar ? 'Reactivar' : 'Dar de baja'}
                </Button>
            </div>
        </>
    )
}
