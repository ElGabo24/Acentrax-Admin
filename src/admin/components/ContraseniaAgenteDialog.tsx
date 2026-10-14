import { useState, type FormEvent } from 'react'
import { Dices, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import type { AdminAgente } from '../interfaces/prospectos.interface'
import { useRestablecerContraseniaAgente } from '../queries/agentes.queries'
import { generarContrasenia, MIN_CONTRASENIA_AGENTE } from '../utils/prospectos'
import { Campo, inputClass } from './Campo'

interface Props {
    agente: AdminAgente | null
    onClose: () => void
}

export const ContraseniaAgenteDialog = ({ agente, onClose }: Props) => (
    <Dialog open={agente !== null} onOpenChange={(a) => !a && onClose()}>
        <DialogContent className="max-w-md">{agente && <Formulario agente={agente} onClose={onClose} />}</DialogContent>
    </Dialog>
)

const Formulario = ({ agente, onClose }: { agente: AdminAgente; onClose: () => void }) => {
    const [contrasenia, setContrasenia] = useState('')
    const valida = contrasenia.length >= MIN_CONTRASENIA_AGENTE

    const mutation = useRestablecerContraseniaAgente({
        onSuccess: () => {
            toast.success(`Contraseña de ${agente.nombre} restablecida. Sus sesiones se cerraron.`)
            onClose()
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (valida) mutation.mutate({ userId: agente.userId, contrasenia })
    }

    const error = mutation.error ? mensajeDeError(mutation.error, 'No se pudo restablecer la contraseña.') : null

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
                <DialogTitle>Restablecer contraseña de {agente.nombre}</DialogTitle>
                <DialogDescription>
                    Se cierran sus sesiones: la app le pedirá entrar de nuevo con la contraseña nueva. Solo aplica a cuentas
                    sin negocio y que no son de superadmin.
                </DialogDescription>
            </div>

            <Campo etiqueta="Contraseña nueva" ayuda={`Mínimo ${MIN_CONTRASENIA_AGENTE} caracteres.`}>
                <div className="flex gap-2">
                    <input
                        className={`${inputClass} font-mono`}
                        value={contrasenia}
                        maxLength={100}
                        autoComplete="off"
                        autoFocus
                        onChange={(e) => setContrasenia(e.target.value)}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        aria-label="Generar contraseña"
                        title="Generar contraseña"
                        onClick={() => setContrasenia(generarContrasenia())}
                    >
                        <Dices />
                    </Button>
                </div>
            </Campo>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={!valida || mutation.isPending}>
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    Restablecer
                </Button>
            </div>
        </form>
    )
}
