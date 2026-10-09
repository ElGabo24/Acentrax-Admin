import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ApiError, mensajeDeError } from '@/api/apiError'
import type { CostoOperativo } from '../interfaces/costo.interface'
import { costosQueryOptions, useRenovarCosto } from '../queries/costos.queries'
import { finanzasKeys } from '../queries/finanzas.queries'
import { invalidar } from '../queries/shared'
import { dinero, fechaDia } from '../utils/formato'

const inputClass =
    'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

/** `yyyy-MM` del mes siguiente al actual. */
const mesSiguiente = (): string => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const SUFIJO = { MENSUAL: '/mes', ANUAL: '/año' } as const

interface Props {
    costo: CostoOperativo | null
    onClose: () => void
}

export const RenovarCostoDialog = ({ costo, onClose }: Props) => (
    <Dialog open={costo !== null} onOpenChange={(abierto) => !abierto && onClose()}>
        <DialogContent>{costo && <Formulario costo={costo} onClose={onClose} />}</DialogContent>
    </Dialog>
)

const Formulario = ({ costo, onClose }: { costo: CostoOperativo; onClose: () => void }) => {
    const queryClient = useQueryClient()

    const [monto, setMonto] = useState('')
    const [moneda, setMoneda] = useState(costo.moneda)
    const [tipoCambio, setTipoCambio] = useState(costo.tipoCambio ? String(costo.tipoCambio) : '')
    // El reporte cuenta meses completos, así que el selector es de mes, no de día.
    const [mes, setMes] = useState(mesSiguiente())

    const montoNum = Number(monto)
    const tcNum = Number(tipoCambio)
    const extranjera = moneda.toUpperCase() !== 'MXN'
    const fechaEfectiva = `${mes}-01`

    const problema = (() => {
        if (monto.trim() === '' || !(montoNum >= 0)) return 'Escribe el monto nuevo.'
        if (!/^[A-Za-z]{3}$/.test(moneda)) return 'La moneda son tres letras, como MXN o USD.'
        if (extranjera && !(tcNum > 0)) return 'Con una moneda distinta de MXN, escribe el tipo de cambio del día.'
        if (!mes || fechaEfectiva <= costo.fecha) return 'El monto nuevo debe empezar después del inicio de la versión actual.'
        return null
    })()

    const mutation = useRenovarCosto(costo.id, {
        onSuccess: () => {
            toast.success('Monto actualizado. Los meses anteriores no cambian.')
            onClose()
        },
        onError: async (error) => {
            if (!(error instanceof ApiError) || error.code !== 'COSTO_YA_CERRADO') return

            // Otra renovación (o un doble clic) ya cerró esta versión: se recarga
            // la lista y se dice cuál es la vigente, para que edite esa.
            const costos = await queryClient.fetchQuery({ ...costosQueryOptions(), staleTime: 0 })
            const vigente = costos.find(
                (c) => c.recurrente && c.fechaFin === null && c.concepto.toLowerCase() === costo.concepto.toLowerCase()
            )
            void invalidar(queryClient, finanzasKeys.all)
            toast.warning(
                vigente
                    ? `Esa versión ya estaba cerrada. La vigente de «${vigente.concepto}» es ${dinero(vigente.montoMxn, 'MXN', 0)}${SUFIJO[vigente.frecuencia ?? 'MENSUAL']} desde el ${fechaDia(vigente.fecha)}.`
                    : 'Esa versión ya estaba cerrada; la lista se actualizó.'
            )
            onClose()
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (problema) return
        mutation.mutate({
            montoNuevo: montoNum,
            ...(moneda.toUpperCase() !== costo.moneda ? { monedaNueva: moneda.toUpperCase() } : {}),
            ...(extranjera ? { tipoCambioNuevo: tcNum } : {}),
            fechaEfectiva,
        })
    }

    // COSTO_YA_CERRADO ya se explicó con un aviso propio.
    const error =
        mutation.error && !(mutation.error instanceof ApiError && mutation.error.code === 'COSTO_YA_CERRADO')
            ? mensajeDeError(mutation.error, 'No se pudo actualizar el monto.')
            : null

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
                <DialogTitle>Actualizar {costo.concepto}</DialogTitle>
                <DialogDescription>
                    Monto actual: {dinero(costo.monto, costo.moneda, 0)}{SUFIJO[costo.frecuencia ?? 'MENSUAL']}
                    {costo.moneda !== 'MXN' && costo.tipoCambio ? ` (× ${costo.tipoCambio})` : ''}
                </DialogDescription>
            </div>

            <div className="grid grid-cols-[1fr_6rem] gap-3">
                <label className="space-y-1.5 text-sm font-medium">
                    Monto nuevo
                    <input className={inputClass} inputMode="decimal" autoFocus value={monto} onChange={(e) => setMonto(e.target.value)} />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                    Moneda
                    <input className={inputClass} value={moneda} maxLength={3} onChange={(e) => setMoneda(e.target.value.toUpperCase())} />
                </label>
                {extranjera && (
                    <label className="col-span-2 space-y-1.5 text-sm font-medium">
                        Tipo de cambio
                        <input className={inputClass} inputMode="decimal" value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value)} />
                    </label>
                )}
            </div>

            <label className="space-y-1.5 text-sm font-medium">
                Desde cuándo
                <input type="month" className={inputClass} value={mes} onChange={(e) => setMes(e.target.value)} />
                <span className="block text-xs font-normal text-muted-foreground">
                    Empieza el día 1 del mes elegido: el reporte cuenta meses completos.
                </span>
            </label>

            <p className="rounded-lg bg-muted p-3 text-sm">
                Los meses ya calculados no cambian. A partir de esa fecha, el reporte usa el monto nuevo.
            </p>

            {(error ?? problema) && (
                <p role="alert" className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
                    {error ?? problema}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={problema !== null || mutation.isPending}>
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    Actualizar
                </Button>
            </div>
        </form>
    )
}
