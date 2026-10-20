import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import type { AdminFeatureFlag } from '../interfaces/featureFlag.interface'
import { useCambiarFlag } from '../queries/flags.queries'
import { nombreDeFlag } from '../utils/flags'

interface Props {
    flag: AdminFeatureFlag | null
    onClose: () => void
}

/** Encender o apagar un interruptor, diciendo antes lo que cambia para todos los negocios. */
export const FlagDialog = ({ flag, onClose }: Props) => (
    <Dialog open={flag !== null} onOpenChange={(a) => !a && onClose()}>
        <DialogContent className="max-w-md">{flag && <Confirmacion flag={flag} onClose={onClose} />}</DialogContent>
    </Dialog>
)

const Confirmacion = ({ flag, onClose }: { flag: AdminFeatureFlag; onClose: () => void }) => {
    // Lo que se va a hacer: lo contrario de como está.
    const encender = !flag.habilitado
    const nombre = nombreDeFlag(flag.clave)

    const mutation = useCambiarFlag({
        onSuccess: () => {
            toast.success(encender ? `${nombre} quedó encendido.` : `${nombre} quedó apagado.`)
            onClose()
        },
    })

    const error = mutation.error ? mensajeDeError(mutation.error, 'No se pudo cambiar el interruptor.') : null

    return (
        <>
            <div>
                <DialogTitle>{encender ? `Encender ${nombre}` : `Apagar ${nombre}`}</DialogTitle>
                <DialogDescription>
                    {encender
                        ? 'Se mostrará a todos los negocios y a los consumidores. Los paneles abiertos lo verán en la siguiente carga (hasta 5 minutos).'
                        : 'Se esconde en todos los paneles y en Descubre. No borra datos: lo ya configurado se conserva.'}
                </DialogDescription>
            </div>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button
                    type="button"
                    variant={encender ? 'default' : 'destructive'}
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ clave: flag.clave, habilitado: encender })}
                >
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    {encender ? 'Encender' : 'Apagar'}
                </Button>
            </div>
        </>
    )
}
