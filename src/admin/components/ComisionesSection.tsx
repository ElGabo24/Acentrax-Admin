import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { mensajeDeError } from '@/api/apiError'
import { getComisionesPasarela, guardarComisionPasarela } from '../actions/finanzas/comisionesPasarela.actions'
import type { ComisionPasarela } from '../interfaces/comisionPasarela.interface'

const inputClass =
    'h-9 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const Fila = ({ inicial }: { inicial: ComisionPasarela }) => {
    const queryClient = useQueryClient()
    const [porcentaje, setPorcentaje] = useState(String(inicial.porcentaje))
    const [fijo, setFijo] = useState(String(inicial.fijo ?? 0))
    const [moneda, setMoneda] = useState(inicial.monedaFijo ?? 'MXN')

    const pctNum = Number(porcentaje)
    const fijoNum = Number(fijo)
    const valido =
        porcentaje.trim() !== '' && pctNum >= 0 && pctNum <= 100 &&
        fijo.trim() !== '' && fijoNum >= 0 &&
        /^[A-Za-z]{3}$/.test(moneda)
    const cambio =
        pctNum !== inicial.porcentaje || fijoNum !== (inicial.fijo ?? 0) || moneda.toUpperCase() !== (inicial.monedaFijo ?? 'MXN')

    const mutation = useMutation({
        mutationFn: () => guardarComisionPasarela(inicial.proveedor, { porcentaje: pctNum, fijo: fijoNum, monedaFijo: moneda.toUpperCase() }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin', 'comisiones-pasarela'] })
            // La comisión estimada de todos los meses depende de esta tarifa.
            void queryClient.invalidateQueries({ queryKey: ['admin', 'finanzas'] })
            toast.success(`Tarifa de ${inicial.proveedor} guardada.`)
        },
    })

    return (
        <li className="space-y-1 py-2">
            <form
                className="flex flex-wrap items-center gap-x-3 gap-y-2"
                onSubmit={(e) => { e.preventDefault(); if (valido && cambio) mutation.mutate() }}
            >
                <span className="w-24 text-sm font-medium">{inicial.proveedor}</span>
                <label className="flex items-center gap-1.5 text-sm">
                    <input aria-label="Porcentaje" className={`${inputClass} w-20`} inputMode="decimal" value={porcentaje} onChange={(e) => setPorcentaje(e.target.value)} /> %
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                    Fijo $
                    <input aria-label="Cargo fijo" className={`${inputClass} w-20`} inputMode="decimal" value={fijo} onChange={(e) => setFijo(e.target.value)} />
                    <input aria-label="Moneda del cargo fijo" className={`${inputClass} w-16`} value={moneda} maxLength={3} onChange={(e) => setMoneda(e.target.value.toUpperCase())} />
                </label>
                <Button type="submit" size="sm" variant="outline" disabled={!valido || !cambio || mutation.isPending}>
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    Guardar
                </Button>
            </form>
            {mutation.error && (
                <p role="alert" className="text-xs text-destructive">{mensajeDeError(mutation.error, 'No se pudo guardar la tarifa.')}</p>
            )}
        </li>
    )
}

export const ComisionesSection = () => {
    const [nuevo, setNuevo] = useState('')
    const [agregados, setAgregados] = useState<string[]>([])
    const { data, isLoading, isError } = useQuery({ queryKey: ['admin', 'comisiones-pasarela'], queryFn: getComisionesPasarela })

    const existentes = new Set(data?.map((c) => c.proveedor))
    const pendientes = agregados.filter((p) => !existentes.has(p))
    const nombreNuevo = nuevo.trim().toUpperCase()

    return (
        <section className="space-y-3 surface p-5">
            <div>
                <h2 className="text-base font-semibold">Comisiones de pasarela</h2>
                <p className="text-xs text-muted-foreground">
                    Tarifas de <b>referencia</b> con las que se estima la comisión, no lo que cobra la pasarela: Stripe cobra distinto
                    según tarjeta nacional, internacional, OXXO o SPEI. Revisa la tuya en su dashboard.
                </p>
            </div>

            {isError ? (
                <p className="text-sm text-destructive">No se pudieron cargar las tarifas.</p>
            ) : isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : (
                <ul className="divide-y">
                    {data?.map((c) => <Fila key={`${c.proveedor}-${c.updatedAt}`} inicial={c} />)}
                    {pendientes.map((p) => (
                        <Fila key={p} inicial={{ proveedor: p, porcentaje: 0, fijo: 0, monedaFijo: 'MXN', updatedAt: '' }} />
                    ))}
                </ul>
            )}

            <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                    e.preventDefault()
                    if (nombreNuevo && !existentes.has(nombreNuevo) && !agregados.includes(nombreNuevo)) {
                        setAgregados((a) => [...a, nombreNuevo])
                    }
                    setNuevo('')
                }}
            >
                <input
                    aria-label="Proveedor nuevo"
                    placeholder="Otro proveedor (ej. MERCADOPAGO)"
                    className={`${inputClass} w-64`}
                    value={nuevo}
                    onChange={(e) => setNuevo(e.target.value)}
                />
                <Button type="submit" size="sm" variant="ghost" disabled={!nombreNuevo}>Agregar fila</Button>
            </form>
        </section>
    )
}
