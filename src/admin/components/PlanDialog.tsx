import { useState, type FormEvent } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import type { AdminPlan } from '../interfaces/plan.interface'
import { useGuardarPlan, useModulosPlan } from '../queries/planes.queries'

const inputClass =
    'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60'

interface Props {
    /** `null` cerrado; `'nuevo'` alta; un plan, edición. */
    plan: AdminPlan | 'nuevo' | null
    onClose: () => void
}

export const PlanDialog = ({ plan, onClose }: Props) => (
    <Dialog open={plan !== null} onOpenChange={(abierto) => !abierto && onClose()}>
        <DialogContent className="max-w-2xl">
            {plan && <Formulario plan={plan === 'nuevo' ? null : plan} onClose={onClose} />}
        </DialogContent>
    </Dialog>
)

const texto = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))

/** Vacío = `null` (ilimitado / sin valor); `NaN` señala un valor que no es número. */
const aNumeroONulo = (s: string): number | null => (s.trim() === '' ? null : Number(s))

const Campo = ({
    etiqueta,
    ayuda,
    children,
}: {
    etiqueta: string
    ayuda?: string
    children: React.ReactNode
}) => (
    <label className="space-y-1.5 text-sm font-medium">
        {etiqueta}
        {children}
        {ayuda && <span className="block text-xs font-normal text-muted-foreground">{ayuda}</span>}
    </label>
)

const Formulario = ({ plan, onClose }: { plan: AdminPlan | null; onClose: () => void }) => {
    const esEdicion = plan !== null
    const { data: catalogo, isError: sinCatalogo } = useModulosPlan()

    const [codigo, setCodigo] = useState(plan?.codigo ?? '')
    const [nombre, setNombre] = useState(plan?.nombre ?? '')
    const [descripcion, setDescripcion] = useState(plan?.descripcion ?? '')
    const [precioMensual, setPrecioMensual] = useState(texto(plan?.precioMensual))
    const [precioAnual, setPrecioAnual] = useState(texto(plan?.precioAnual))
    const [moneda, setMoneda] = useState(plan?.moneda ?? 'MXN')
    const [maxUsuarios, setMaxUsuarios] = useState(texto(plan?.maxUsuarios))
    const [maxProductos, setMaxProductos] = useState(texto(plan?.maxProductos))
    const [maxUbicaciones, setMaxUbicaciones] = useState(texto(plan?.maxUbicaciones))
    const [maxDispositivos, setMaxDispositivos] = useState(texto(plan?.maxDispositivos))
    const [maxMensajesMes, setMaxMensajesMes] = useState(texto(plan?.maxMensajesMes))
    const [modulos, setModulos] = useState<string[]>(plan?.modulos ?? [])
    const [stripeMensual, setStripeMensual] = useState(plan?.stripePriceMensual ?? '')
    const [stripeAnual, setStripeAnual] = useState(plan?.stripePriceAnual ?? '')
    const [orden, setOrden] = useState(texto(plan?.orden))
    const [activo, setActivo] = useState(plan?.activo ?? true)
    const [visible, setVisible] = useState(plan?.visible ?? true)

    const mensual = Number(precioMensual)
    const anual = Number(precioAnual)
    const topes = [maxUsuarios, maxProductos, maxUbicaciones, maxDispositivos].map(aNumeroONulo)
    const mensajes = aNumeroONulo(maxMensajesMes)
    const ordenNum = Number(orden)

    // El primer problema que impide guardar, para mostrarlo bajo el formulario.
    const problema = (() => {
        if (!esEdicion && !/^[A-Z0-9_]{2,32}$/.test(codigo)) return 'El código lleva de 2 a 32 caracteres: A-Z, 0-9 y guion bajo.'
        if (!nombre.trim()) return 'Escribe el nombre del plan.'
        if (precioMensual.trim() === '' || !(mensual >= 0)) return 'El precio mensual debe ser un número mayor o igual a cero.'
        if (precioAnual.trim() === '' || !(anual >= 0)) return 'El precio anual debe ser un número mayor o igual a cero.'
        if (!/^[A-Za-z]{3}$/.test(moneda)) return 'La moneda son tres letras, como MXN.'
        if (topes.slice(0, 3).some((t) => t !== null && !(Number.isInteger(t) && t > 0))) return 'Los topes deben ser enteros mayores que cero, o vacíos para ilimitado.'
        if (topes[3] !== null && !(Number.isInteger(topes[3]) && topes[3] > 0)) return 'Los dispositivos con PIN deben ser un entero mayor que cero, o vacío para ilimitado.'
        if (mensajes !== null && !(Number.isInteger(mensajes) && mensajes >= 0)) return 'Los mensajes incluidos deben ser un entero mayor o igual a cero, o vacío para ilimitado.'
        if (orden.trim() === '' || !Number.isInteger(ordenNum)) return 'El orden debe ser un número entero.'
        return null
    })()

    const mutation = useGuardarPlan(plan, {
        onSuccess: () => {
            toast.success(esEdicion ? 'Plan actualizado.' : 'Plan creado.')
            onClose()
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (problema) return
        mutation.mutate({
            codigo: plan?.codigo ?? codigo,
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            precioMensual: mensual,
            precioAnual: anual,
            moneda: moneda.toUpperCase(),
            maxUsuarios: topes[0],
            maxProductos: topes[1],
            maxUbicaciones: topes[2],
            maxDispositivos: topes[3],
            maxMensajesMes: mensajes,
            modulos,
            stripePriceMensual: stripeMensual.trim() || null,
            stripePriceAnual: stripeAnual.trim() || null,
            orden: ordenNum,
            activo,
            visible,
        })
    }

    const alternarModulo = (valor: string) =>
        setModulos((actuales) =>
            actuales.includes(valor) ? actuales.filter((m) => m !== valor) : [...actuales, valor]
        )

    const error = mutation.error ? mensajeDeError(mutation.error, 'No se pudo guardar el plan.') : null

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
                <DialogTitle>{esEdicion ? `Editar ${plan.nombre}` : 'Nuevo plan'}</DialogTitle>
                <DialogDescription>Los precios van sin IVA: el impuesto lo aplica la pasarela.</DialogDescription>
            </div>

            {esEdicion && plan.empresas > 0 && (
                <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <p>
                        {plan.empresas} {plan.empresas === 1 ? 'empresa está' : 'empresas están'} en este plan.
                        El cambio de precio no les afecta hasta su próxima renovación.
                    </p>
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                <Campo etiqueta="Código" ayuda={esEdicion ? 'No se puede cambiar.' : 'A-Z, 0-9 y guion bajo. Definitivo.'}>
                    <input
                        className={inputClass}
                        value={codigo}
                        disabled={esEdicion}
                        maxLength={32}
                        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    />
                </Campo>
                <Campo etiqueta="Nombre">
                    <input className={inputClass} value={nombre} maxLength={64} onChange={(e) => setNombre(e.target.value)} />
                </Campo>
                <div className="sm:col-span-2">
                    <Campo etiqueta="Descripción">
                        <input className={inputClass} value={descripcion} maxLength={255} onChange={(e) => setDescripcion(e.target.value)} />
                    </Campo>
                </div>
                <Campo etiqueta="Precio mensual">
                    <input className={inputClass} inputMode="decimal" value={precioMensual} onChange={(e) => setPrecioMensual(e.target.value)} />
                </Campo>
                <Campo etiqueta="Precio anual">
                    <input className={inputClass} inputMode="decimal" value={precioAnual} onChange={(e) => setPrecioAnual(e.target.value)} />
                </Campo>
                <Campo etiqueta="Moneda">
                    <input className={inputClass} value={moneda} maxLength={3} onChange={(e) => setMoneda(e.target.value.toUpperCase())} />
                </Campo>
                <Campo etiqueta="Orden en el comparador">
                    <input className={inputClass} inputMode="numeric" value={orden} onChange={(e) => setOrden(e.target.value)} />
                </Campo>
            </div>

            <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Límites</legend>
                <p className="text-xs text-muted-foreground">Vacío significa ilimitado. Bajar un tope no expulsa a quien ya lo excede: solo le impide crecer.</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {([
                        ['Usuarios', maxUsuarios, setMaxUsuarios],
                        ['Productos', maxProductos, setMaxProductos],
                        ['Ubicaciones', maxUbicaciones, setMaxUbicaciones],
                        ['Dispositivos con PIN máx.', maxDispositivos, setMaxDispositivos],
                        ['Mensajes/mes', maxMensajesMes, setMaxMensajesMes],
                    ] as const).map(([etiqueta, valor, set]) => (
                        <Campo key={etiqueta} etiqueta={etiqueta}>
                            <input
                                className={inputClass}
                                inputMode="numeric"
                                placeholder="Ilimitado"
                                value={valor}
                                onChange={(e) => set(e.target.value)}
                            />
                        </Campo>
                    ))}
                </div>
            </fieldset>

            <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Módulos incluidos</legend>
                {sinCatalogo ? (
                    <p className="text-sm text-destructive">No se pudo cargar la lista de módulos.</p>
                ) : !catalogo ? (
                    <p className="text-sm text-muted-foreground">Cargando…</p>
                ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                        {catalogo.map((m) => (
                            <label key={m.valor} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="size-4 accent-primary"
                                    checked={modulos.includes(m.valor)}
                                    onChange={() => alternarModulo(m.valor)}
                                />
                                {m.etiqueta}
                            </label>
                        ))}
                    </div>
                )}
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
                <Campo etiqueta="Stripe · precio mensual" ayuda="Con los dos ids el plan es cobrable.">
                    <input className={inputClass} placeholder="price_…" value={stripeMensual} maxLength={64} onChange={(e) => setStripeMensual(e.target.value)} />
                </Campo>
                <Campo etiqueta="Stripe · precio anual">
                    <input className={inputClass} placeholder="price_…" value={stripeAnual} maxLength={64} onChange={(e) => setStripeAnual(e.target.value)} />
                </Campo>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <label className="flex items-center gap-2">
                    <input type="checkbox" className="size-4 accent-primary" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                    Activo
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" className="size-4 accent-primary" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
                    Visible en el comparador
                    <span className="text-xs text-muted-foreground">(sin marcar = plan heredado)</span>
                </label>
            </div>

            {(error ?? problema) && (
                <p role="alert" className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
                    {error ?? problema}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={problema !== null || mutation.isPending}>
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    {esEdicion ? 'Guardar cambios' : 'Crear plan'}
                </Button>
            </div>
        </form>
    )
}
