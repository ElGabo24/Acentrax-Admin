import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import type { TipoMovimientoSaldo } from '../interfaces/paqueteMensajes.interface'
import { useAjustarSaldoMensajes, useSaldoMensajes } from '../queries/paquetes.queries'
import { fechaHora } from '../utils/formato'

const inputClass =
    'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60'

const TIPO_LABEL: Record<TipoMovimientoSaldo, string> = {
    COMPRA: 'Compra',
    CONSUMO: 'Consumo',
    AJUSTE: 'Ajuste',
}

const conSigno = (n: number) => (n > 0 ? `+${n.toLocaleString('es-MX')}` : n.toLocaleString('es-MX'))

const AjusteDialog = ({ empresaId, abierto, onClose }: { empresaId: number; abierto: boolean; onClose: () => void }) => (
    <Dialog open={abierto} onOpenChange={(a) => !a && onClose()}>
        <DialogContent className="max-w-md">
            {abierto && <FormularioAjuste empresaId={empresaId} onClose={onClose} />}
        </DialogContent>
    </Dialog>
)

const FormularioAjuste = ({ empresaId, onClose }: { empresaId: number; onClose: () => void }) => {
    const [delta, setDelta] = useState('')
    const [motivo, setMotivo] = useState('')

    const deltaNum = Number(delta)
    const problema = (() => {
        if (delta.trim() === '' || !Number.isInteger(deltaNum) || deltaNum === 0) return 'La cantidad debe ser un entero distinto de cero.'
        if (!motivo.trim()) return 'Escribe el motivo del ajuste.'
        return null
    })()

    const mutation = useAjustarSaldoMensajes(empresaId, {
        onSuccess: () => {
            toast.success('Saldo ajustado.')
            onClose()
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!problema) mutation.mutate({ delta: deltaNum, motivo: motivo.trim() })
    }

    const error = mutation.error ? mensajeDeError(mutation.error, 'No se pudo ajustar el saldo.') : null

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
                <DialogTitle>Ajustar saldo de mensajes</DialogTitle>
                <DialogDescription>
                    Usa un número negativo para descontar. El ajuste queda registrado con su motivo.
                </DialogDescription>
            </div>
            <label className="space-y-1.5 text-sm font-medium">
                Cantidad de mensajes
                <input className={inputClass} inputMode="numeric" placeholder="Ej. 500 o -100" value={delta} onChange={(e) => setDelta(e.target.value)} />
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

export const SaldoMensajesSection = ({ empresaId }: { empresaId: number }) => {
    const [ajustando, setAjustando] = useState(false)
    const { data, isLoading, isError, refetch } = useSaldoMensajes(empresaId)

    return (
        <section className="space-y-3 surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">Saldo de mensajes</h2>
                {data && <Button variant="outline" size="sm" onClick={() => setAjustando(true)}>Ajustar saldo</Button>}
            </div>

            {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
            {isError && (
                <div className="text-sm">
                    <p className="text-destructive">No se pudo cargar el saldo.</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            )}

            {data && (
                <>
                    <p className="text-sm">
                        <span className="text-2xl font-semibold tabular-nums">{data.saldo.toLocaleString('es-MX')}</span>{' '}
                        <span className="text-muted-foreground">mensajes de paquetes (no caducan)</span>
                    </p>
                    {data.movimientos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin movimientos.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="data-table -mx-5 w-[calc(100%+2.5rem)]">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th className="text-right">Cambio</th>
                                        <th className="text-right">Saldo</th>
                                        <th>Motivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.movimientos.map((m) => (
                                        <tr key={m.id}>
                                            <td className="pr-3">{fechaHora(m.fecha)}</td>
                                            <td className="pr-3">{TIPO_LABEL[m.tipo] ?? m.tipo}</td>
                                            <td className={cn('text-right tabular-nums', m.delta > 0 ? 'text-success' : 'text-destructive')}>
                                                {conSigno(m.delta)}
                                            </td>
                                            <td className="text-right tabular-nums">{m.saldoDespues.toLocaleString('es-MX')}</td>
                                            <td className="pl-3 text-muted-foreground">{m.motivo ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            <AjusteDialog empresaId={empresaId} abierto={ajustando} onClose={() => setAjustando(false)} />
        </section>
    )
}
