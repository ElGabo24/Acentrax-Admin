import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import type { TicketsEmpresa } from '../interfaces/tickets.interface'
import { useAjustarTickets } from '../queries/tickets.queries'

const inputClass =
    'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60'

const MAXIMO = 10_000

/** Regalar o corregir escaneos de ticket de UNA empresa para este mes. */
export const AjusteTicketsDialog = ({ empresa, onClose }: { empresa: TicketsEmpresa | null; onClose: () => void }) => (
    <Dialog open={empresa !== null} onOpenChange={(abierto) => !abierto && onClose()}>
        <DialogContent className="max-w-md">{empresa && <Formulario empresa={empresa} onClose={onClose} />}</DialogContent>
    </Dialog>
)

const Formulario = ({ empresa, onClose }: { empresa: TicketsEmpresa; onClose: () => void }) => {
    const [delta, setDelta] = useState('')
    const [motivo, setMotivo] = useState('')

    const n = Number(delta)
    const problema = (() => {
        if (delta.trim() === '' || !Number.isInteger(n) || n === 0) return 'La cantidad debe ser un entero distinto de cero.'
        if (Math.abs(n) > MAXIMO) return `Un ajuste admite hasta ${MAXIMO.toLocaleString('es-MX')} escaneos.`
        if (n < 0 && -n > empresa.bono) return `Solo se pueden quitar escaneos regalados este mes (hay ${empresa.bono}).`
        if (!motivo.trim()) return 'Escribe el motivo del ajuste.'
        return null
    })()

    const mutation = useAjustarTickets(empresa.empresaId, {
        onSuccess: () => {
            toast.success('Escaneos ajustados.')
            onClose()
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!problema) mutation.mutate({ delta: n, motivo: motivo.trim() })
    }

    const error = mutation.error ? mensajeDeError(mutation.error, 'No se pudo ajustar.') : null

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
                <DialogTitle>Escaneos de ticket · {empresa.nombre}</DialogTitle>
                <DialogDescription>
                    Los escaneos extra valen solo este mes y se suman a lo que incluye su plan. Usa un número negativo para
                    corregir un regalo. Queda registrado con su motivo.
                </DialogDescription>
            </div>

            <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                Lleva <strong className="tabular-nums">{empresa.usados}</strong> de{' '}
                <strong className="tabular-nums">
                    {empresa.incluidosPlan === null ? '∞' : empresa.incluidosPlan + empresa.bono}
                </strong>
                {empresa.bono > 0 && <span className="text-muted-foreground"> (incluye {empresa.bono} extra)</span>}.
            </p>

            <label className="space-y-1.5 text-sm font-medium">
                Cantidad de escaneos
                <input className={inputClass} inputMode="numeric" placeholder="Ej. 20 o -10" value={delta} onChange={(e) => setDelta(e.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
                Motivo
                <input className={inputClass} maxLength={200} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </label>

            {(error ?? (!mutation.error ? problema : null)) && (
                <p role="alert" className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
                    {error ?? problema}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={problema !== null || mutation.isPending}>
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    Aplicar ajuste
                </Button>
            </div>
        </form>
    )
}
