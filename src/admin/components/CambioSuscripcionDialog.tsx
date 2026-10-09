import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import type {
    AdminEmpresaDetalle,
    CambioSuscripcion,
    EstadoSuscripcion,
} from '../interfaces/empresa.interface'
import type { AdminPlan } from '../interfaces/plan.interface'
import { useCambiarSuscripcion } from '../queries/empresas.queries'
import { ESTADO_LABEL, ESTADOS, ESTADOS_CON_VIGENCIA } from '../utils/formato'

export type AccionSuscripcion = 'plan' | 'extender' | 'estado'

const TITULO: Record<AccionSuscripcion, string> = {
    plan: 'Cambiar plan',
    extender: 'Extender días',
    estado: 'Cambiar estado',
}

const inputClass =
    'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

interface Props {
    accion: AccionSuscripcion | null
    empresa: AdminEmpresaDetalle
    planes: AdminPlan[]
    onClose: () => void
}

/**
 * Los tres cambios de suscripción comparten formulario: la razón va en todos y
 * el botón de confirmar no se habilita sin ella (no basta con advertirlo).
 */
export const CambioSuscripcionDialog = ({ accion, empresa, planes, onClose }: Props) => (
    <Dialog open={accion !== null} onOpenChange={(abierto) => !abierto && onClose()}>
        <DialogContent>
            {/* Se monta el formulario solo con el diálogo abierto: cada apertura empieza en blanco. */}
            {accion && <Formulario accion={accion} empresa={empresa} planes={planes} onClose={onClose} />}
        </DialogContent>
    </Dialog>
)

const Formulario = ({
    accion,
    empresa,
    planes,
    onClose,
}: Props & { accion: AccionSuscripcion }) => {
    const suscripcion = empresa.suscripcion

    const [planId, setPlanId] = useState<number | ''>(suscripcion?.planId ?? '')
    const [estado, setEstado] = useState<EstadoSuscripcion | ''>(suscripcion?.estado ?? '')
    const [dias, setDias] = useState('')
    const [razon, setRazon] = useState('')

    const diasNum = Number(dias)
    const diasValidos = Number.isInteger(diasNum) && diasNum >= 1 && diasNum <= 3650

    const cambio: CambioSuscripcion | null = (() => {
        const base = { razon: razon.trim() }
        if (accion === 'plan') {
            return planId !== '' && planId !== suscripcion?.planId ? { ...base, planId } : null
        }
        if (accion === 'extender') {
            return diasValidos ? { ...base, extenderDias: diasNum } : null
        }
        if (estado === '' || estado === suscripcion?.estado) return null
        // Los días son opcionales aquí, pero si se escriben tienen que ser válidos.
        if (dias !== '' && !diasValidos) return null
        return { ...base, estado, ...(dias !== '' ? { extenderDias: diasNum } : {}) }
    })()

    const mutation = useCambiarSuscripcion(empresa.id, {
        onSuccess: () => {
            toast.success('Suscripción actualizada.')
            onClose()
        },
    })

    const puedeConfirmar = razon.trim().length > 0 && cambio !== null && !mutation.isPending

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (cambio && puedeConfirmar) mutation.mutate(cambio)
    }

    const error = mutation.error ? mensajeDeError(mutation.error, 'No se pudo guardar el cambio.') : null
    const pideDias = accion === 'estado' && estado !== '' && ESTADOS_CON_VIGENCIA.includes(estado)

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
                <DialogTitle>{TITULO[accion]}</DialogTitle>
                <DialogDescription>{empresa.nombre}</DialogDescription>
            </div>

            {accion === 'plan' && (
                <label className="space-y-1.5 text-sm font-medium">
                    Plan nuevo
                    <select
                        className={inputClass}
                        value={planId}
                        onChange={(e) => setPlanId(Number(e.target.value))}
                    >
                        {planes.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre}{!p.activo || !p.visible ? ' (no visible)' : ''}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            {accion === 'estado' && (
                <label className="space-y-1.5 text-sm font-medium">
                    Estado nuevo
                    <select
                        className={inputClass}
                        value={estado}
                        onChange={(e) => setEstado(e.target.value as EstadoSuscripcion)}
                    >
                        {ESTADOS.map((e) => (
                            <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
                        ))}
                    </select>
                </label>
            )}

            {(accion === 'extender' || accion === 'estado') && (
                <label className="space-y-1.5 text-sm font-medium">
                    {accion === 'extender' ? 'Días a extender' : 'Días de vigencia (opcional)'}
                    <input
                        type="number"
                        min={1}
                        max={3650}
                        inputMode="numeric"
                        className={inputClass}
                        value={dias}
                        onChange={(e) => setDias(e.target.value)}
                    />
                    <span className="block text-xs font-normal text-muted-foreground">
                        {accion === 'extender'
                            ? 'Entre 1 y 3650. Mueve hacia adelante la vigencia del estado actual.'
                            : pideDias
                                ? 'Prueba, activa y gracia necesitan una fecha de fin vigente; si no la tienen, indica cuántos días.'
                                : 'Solo lectura y cancelada no llevan vigencia.'}
                    </span>
                </label>
            )}

            <label className="space-y-1.5 text-sm font-medium">
                Razón del cambio
                <textarea
                    className={`${inputClass} h-20 resize-none py-2`}
                    value={razon}
                    onChange={(e) => setRazon(e.target.value)}
                    placeholder="Queda en la bitácora de actividad."
                />
            </label>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={!puedeConfirmar}>
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    Confirmar
                </Button>
            </div>
        </form>
    )
}
