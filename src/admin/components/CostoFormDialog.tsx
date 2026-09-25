import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import { crearCosto, editarCosto } from '../actions/finanzas/costos.actions'
import type { CategoriaCosto, CostoOperativo, CostoPayload, FrecuenciaCosto } from '../interfaces/costo.interface'
import { aFechaIso, CATEGORIA_LABEL } from '../utils/formato'

const inputClass =
    'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60'

interface Props {
    /** `null` cerrado; `'nuevo'` alta; un gasto, corrección. */
    costo: CostoOperativo | 'nuevo' | null
    onClose: () => void
    /** Desde la corrección de un recurrente se salta al flujo que conserva el historial. */
    onCambiarMonto: (costo: CostoOperativo) => void
}

export const CostoFormDialog = ({ costo, onClose, onCambiarMonto }: Props) => (
    <Dialog open={costo !== null} onOpenChange={(abierto) => !abierto && onClose()}>
        <DialogContent>
            {costo && (
                <Formulario
                    costo={costo === 'nuevo' ? null : costo}
                    onClose={onClose}
                    onCambiarMonto={onCambiarMonto}
                />
            )}
        </DialogContent>
    </Dialog>
)

const Campo = ({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) => (
    <label className="space-y-1.5 text-sm font-medium">
        {etiqueta}
        {children}
        {ayuda && <span className="block text-xs font-normal text-muted-foreground">{ayuda}</span>}
    </label>
)

const Formulario = ({
    costo,
    onClose,
    onCambiarMonto,
}: {
    costo: CostoOperativo | null
    onClose: () => void
    onCambiarMonto: (costo: CostoOperativo) => void
}) => {
    const queryClient = useQueryClient()
    const esEdicion = costo !== null
    // En un recurrente existente el monto solo se cambia renovando; lo demás se corrige aquí.
    const montoBloqueado = costo?.recurrente === true

    const [concepto, setConcepto] = useState(costo?.concepto ?? '')
    const [categoria, setCategoria] = useState<CategoriaCosto>(costo?.categoria ?? 'INFRAESTRUCTURA')
    const [monto, setMonto] = useState(costo ? String(costo.monto) : '')
    const [moneda, setMoneda] = useState(costo?.moneda ?? 'MXN')
    const [tipoCambio, setTipoCambio] = useState(costo?.tipoCambio ? String(costo.tipoCambio) : '')
    const [recurrente, setRecurrente] = useState(costo?.recurrente ?? false)
    const [frecuencia, setFrecuencia] = useState<FrecuenciaCosto>(costo?.frecuencia ?? 'MENSUAL')
    const [fecha, setFecha] = useState(costo?.fecha ?? aFechaIso(new Date()))
    const [fechaFin, setFechaFin] = useState(costo?.fechaFin ?? '')
    const [notas, setNotas] = useState(costo?.notas ?? '')

    const montoNum = Number(monto)
    const tcNum = Number(tipoCambio)
    const extranjera = moneda.toUpperCase() !== 'MXN'

    const problema = (() => {
        if (!concepto.trim()) return 'Escribe el concepto del gasto.'
        if (monto.trim() === '' || !(montoNum >= 0)) return 'El monto debe ser un número mayor o igual a cero.'
        if (!/^[A-Za-z]{3}$/.test(moneda)) return 'La moneda son tres letras, como MXN o USD.'
        if (extranjera && !(tcNum > 0)) return 'Con una moneda distinta de MXN, escribe el tipo de cambio del día.'
        if (!fecha) return 'Indica la fecha.'
        if (recurrente && fechaFin && fechaFin < fecha) return 'La fecha de fin no puede ser anterior al inicio.'
        return null
    })()

    const mutation = useMutation({
        mutationFn: (payload: CostoPayload) => (costo ? editarCosto(costo.id, payload) : crearCosto(payload)),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin', 'costos'] })
            // Un gasto nuevo o corregido cambia la utilidad de los meses que cubre.
            void queryClient.invalidateQueries({ queryKey: ['admin', 'finanzas'] })
            toast.success(esEdicion ? 'Gasto actualizado.' : 'Gasto registrado.')
            onClose()
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (problema) return
        mutation.mutate({
            concepto: concepto.trim(),
            categoria,
            monto: montoNum,
            moneda: moneda.toUpperCase(),
            tipoCambio: extranjera ? tcNum : null,
            recurrente,
            frecuencia: recurrente ? frecuencia : null,
            fecha,
            fechaFin: recurrente && fechaFin ? fechaFin : null,
            notas: notas.trim() || null,
        })
    }

    const error = mutation.error ? mensajeDeError(mutation.error, 'No se pudo guardar el gasto.') : null

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
                <DialogTitle>{esEdicion ? 'Corregir gasto' : 'Agregar gasto'}</DialogTitle>
                <DialogDescription>
                    {esEdicion
                        ? 'Para corregir errores de captura. Estos cambios se reflejan en los meses que el gasto cubre.'
                        : 'Un gasto puntual cuenta en el mes de su fecha; uno recurrente, en cada mes que cubre.'}
                </DialogDescription>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Campo etiqueta="Concepto">
                        <input className={inputClass} value={concepto} maxLength={120} onChange={(e) => setConcepto(e.target.value)} />
                    </Campo>
                </div>
                <Campo etiqueta="Categoría">
                    <select className={inputClass} value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaCosto)}>
                        {(Object.keys(CATEGORIA_LABEL) as CategoriaCosto[]).map((c) => (
                            <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
                        ))}
                    </select>
                </Campo>
                <Campo etiqueta={recurrente ? 'Fecha de inicio' : 'Fecha'}>
                    <input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </Campo>

                {montoBloqueado && costo ? (
                    <div className="space-y-1.5 text-sm sm:col-span-2">
                        <p className="font-medium">Monto</p>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>
                                {costo.monto.toLocaleString('es-MX')} {costo.moneda}
                                {costo.moneda !== 'MXN' && costo.tipoCambio ? ` × ${costo.tipoCambio}` : ''}
                            </span>
                            <Button type="button" variant="outline" size="sm" onClick={() => onCambiarMonto(costo)}>
                                Cambiar monto…
                            </Button>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Cambiarlo aquí movería meses ya calculados. «Cambiar monto» cierra esta versión y abre una nueva.
                        </p>
                    </div>
                ) : (
                    <>
                        <Campo etiqueta="Monto">
                            <input className={inputClass} inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} />
                        </Campo>
                        <Campo etiqueta="Moneda">
                            <input className={inputClass} value={moneda} maxLength={3} onChange={(e) => setMoneda(e.target.value.toUpperCase())} />
                        </Campo>
                        {extranjera && (
                            <div className="sm:col-span-2">
                                <Campo etiqueta="Tipo de cambio" ayuda="Pesos por cada unidad, con el valor del día que tengas a la mano.">
                                    <input className={inputClass} inputMode="decimal" value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value)} />
                                </Campo>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={recurrente}
                        // Cambiar entre puntual y recurrente reescribiría el historial: se borra y se vuelve a capturar.
                        disabled={esEdicion}
                        onChange={(e) => setRecurrente(e.target.checked)}
                    />
                    Recurrente
                </label>
                {recurrente && (
                    <select
                        aria-label="Frecuencia"
                        className={`${inputClass} w-auto`}
                        value={frecuencia}
                        disabled={esEdicion}
                        onChange={(e) => setFrecuencia(e.target.value as FrecuenciaCosto)}
                    >
                        <option value="MENSUAL">Cada mes</option>
                        <option value="ANUAL">Cada año</option>
                    </select>
                )}
                {esEdicion && (
                    <span className="text-xs text-muted-foreground">
                        Para cambiar entre puntual y recurrente, o la frecuencia, borra el gasto y captúralo de nuevo.
                    </span>
                )}
            </div>

            {recurrente && esEdicion && (
                <Campo etiqueta="Fecha de fin" ayuda="Para dar de baja el gasto: los meses posteriores dejan de contarlo. Vacío = sigue vigente.">
                    <input type="date" className={inputClass} value={fechaFin} min={fecha} onChange={(e) => setFechaFin(e.target.value)} />
                </Campo>
            )}

            <Campo etiqueta="Notas">
                <textarea className={`${inputClass} h-16 resize-none py-2`} value={notas} maxLength={255} onChange={(e) => setNotas(e.target.value)} />
            </Campo>

            {(error ?? problema) && (
                <p role="alert" className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
                    {error ?? problema}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={problema !== null || mutation.isPending}>
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    {esEdicion ? 'Guardar' : 'Agregar'}
                </Button>
            </div>
        </form>
    )
}
