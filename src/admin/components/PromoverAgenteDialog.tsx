import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import { usePromoverAgente } from '../queries/agentes.queries'
import { Campo, inputClass } from './Campo'

interface Props {
    abierto: boolean
    onClose: () => void
}

export const PromoverAgenteDialog = ({ abierto, onClose }: Props) => (
    <Dialog open={abierto} onOpenChange={(a) => !a && onClose()}>
        <DialogContent className="max-w-md">{abierto && <Formulario onClose={onClose} />}</DialogContent>
    </Dialog>
)

const Formulario = ({ onClose }: { onClose: () => void }) => {
    const [correo, setCorreo] = useState('')

    const mutation = usePromoverAgente({
        onSuccess: (agente) => {
            toast.success(`${agente.nombre} ya puede entrar a la app de prospectos.`)
            onClose()
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (correo.trim()) mutation.mutate(correo.trim())
    }

    const error = mutation.error ? mensajeDeError(mutation.error, 'No se pudo convertir la cuenta.') : null

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
                <DialogTitle>Convertir una cuenta existente</DialogTitle>
                <DialogDescription>
                    Para quien ya tiene cuenta en Acentrax (la tuya, por ejemplo). Conserva su contraseña y su negocio.
                    Si ya era agente y estaba dado de baja, lo reactiva.
                </DialogDescription>
            </div>

            <Campo etiqueta="Correo de la cuenta">
                <input type="email" className={inputClass} value={correo} maxLength={254} autoFocus onChange={(e) => setCorreo(e.target.value)} />
            </Campo>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={!correo.trim() || mutation.isPending}>
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    Convertir en agente
                </Button>
            </div>
        </form>
    )
}
