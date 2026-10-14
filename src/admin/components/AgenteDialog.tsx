import { useState, type FormEvent } from 'react'
import { Dices, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import { useCrearAgente } from '../queries/agentes.queries'
import { generarContrasenia, MIN_CONTRASENIA_AGENTE } from '../utils/prospectos'
import { Campo, inputClass } from './Campo'

interface Props {
    abierto: boolean
    onClose: () => void
}

export const AgenteDialog = ({ abierto, onClose }: Props) => (
    <Dialog open={abierto} onOpenChange={(a) => !a && onClose()}>
        <DialogContent className="max-w-lg">{abierto && <Formulario onClose={onClose} />}</DialogContent>
    </Dialog>
)

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Formulario = ({ onClose }: { onClose: () => void }) => {
    const [nombre, setNombre] = useState('')
    const [apellidos, setApellidos] = useState('')
    const [correo, setCorreo] = useState('')
    const [telefono, setTelefono] = useState('')
    const [contrasenia, setContrasenia] = useState('')

    const problema = (() => {
        if (!nombre.trim()) return 'Escribe el nombre del agente.'
        if (!CORREO.test(correo.trim())) return 'Escribe un correo válido.'
        if (!telefono.trim()) return 'Escribe el teléfono del agente.'
        if (contrasenia.length < MIN_CONTRASENIA_AGENTE)
            return `La contraseña debe tener al menos ${MIN_CONTRASENIA_AGENTE} caracteres.`
        return null
    })()

    const mutation = useCrearAgente({
        onSuccess: (agente) => {
            toast.success(`Agente creado: ${agente.nombre}. Entrégale su correo y su contraseña.`)
            onClose()
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (problema) return
        mutation.mutate({
            nombre: nombre.trim(),
            apellidos: apellidos.trim(),
            correo: correo.trim(),
            telefono: telefono.trim(),
            contrasenia,
        })
    }

    const error = mutation.error ? mensajeDeError(mutation.error, 'No se pudo crear el agente.') : null

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
                <DialogTitle>Nuevo agente</DialogTitle>
                <DialogDescription>
                    Crea su cuenta ya verificada. Anota la contraseña: no se vuelve a mostrar, aunque puedes restablecerla después.
                </DialogDescription>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <Campo etiqueta="Nombre">
                    <input className={inputClass} value={nombre} maxLength={100} autoComplete="off" onChange={(e) => setNombre(e.target.value)} />
                </Campo>
                <Campo etiqueta="Apellidos">
                    <input className={inputClass} value={apellidos} maxLength={100} autoComplete="off" onChange={(e) => setApellidos(e.target.value)} />
                </Campo>
                <Campo etiqueta="Correo" className="sm:col-span-2">
                    <input type="email" className={inputClass} value={correo} maxLength={254} autoComplete="off" onChange={(e) => setCorreo(e.target.value)} />
                </Campo>
                <Campo etiqueta="Teléfono">
                    <input type="tel" className={inputClass} value={telefono} maxLength={30} autoComplete="off" onChange={(e) => setTelefono(e.target.value)} />
                </Campo>
                <Campo etiqueta="Contraseña inicial" ayuda={`Mínimo ${MIN_CONTRASENIA_AGENTE} caracteres.`}>
                    <div className="flex gap-2">
                        <input
                            className={`${inputClass} font-mono`}
                            value={contrasenia}
                            maxLength={100}
                            autoComplete="off"
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
            </div>

            {(error ?? (!mutation.error ? problema : null)) && (
                <p role="alert" className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
                    {error ?? problema}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={problema !== null || mutation.isPending}>
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    Crear agente
                </Button>
            </div>
        </form>
    )
}
