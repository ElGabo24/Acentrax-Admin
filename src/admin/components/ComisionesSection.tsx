import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { mensajeDeError } from '@/api/apiError'
import type { ComisionPasarela } from '../interfaces/comisionPasarela.interface'
import { useComisiones, useGuardarComision } from '../queries/comisiones.queries'

const inputClass =
    'h-9 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

/** Un símbolo dentro del campo (%, $): la unidad se lee sin ocupar una columna aparte. */
const Unidad = ({ lado, simbolo, children }: { lado: 'izq' | 'der'; simbolo: string; children: React.ReactNode }) => (
    <span className="relative block">
        {children}
        <span
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 flex items-center text-sm font-normal text-muted-foreground ${lado === 'izq' ? 'left-2.5' : 'right-2.5'}`}
        >
            {simbolo}
        </span>
    </span>
)

const Fila = ({ inicial }: { inicial: ComisionPasarela }) => {
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

    const mutation = useGuardarComision(inicial.proveedor, {
        onSuccess: () => toast.success(`Tarifa de ${inicial.proveedor} guardada.`),
    })

    return (
        <li className="space-y-1 py-3">
            <form
                className="flex flex-wrap items-end gap-x-4 gap-y-3"
                onSubmit={(e) => { e.preventDefault(); if (valido && cambio) mutation.mutate({ porcentaje: pctNum, fijo: fijoNum, monedaFijo: moneda.toUpperCase() }) }}
            >
                <span className="w-28 pb-2 text-sm font-medium">{inicial.proveedor}</span>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Porcentaje
                    <Unidad lado="der" simbolo="%">
                        <input className={`${inputClass} w-24 pr-7 text-foreground`} inputMode="decimal" value={porcentaje} onChange={(e) => setPorcentaje(e.target.value)} />
                    </Unidad>
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Cargo fijo
                    <Unidad lado="izq" simbolo="$">
                        <input className={`${inputClass} w-28 pl-6 text-foreground`} inputMode="decimal" value={fijo} onChange={(e) => setFijo(e.target.value)} />
                    </Unidad>
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Moneda
                    <input className={`${inputClass} block w-20 text-foreground`} value={moneda} maxLength={3} onChange={(e) => setMoneda(e.target.value.toUpperCase())} />
                </label>
                <Button type="submit" size="sm" variant="outline" className="mb-1" disabled={!valido || !cambio || mutation.isPending}>
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
    const { data, isLoading, isError } = useComisiones()

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
                className="flex flex-wrap items-center gap-2 border-t pt-4"
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
