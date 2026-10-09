import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ApiError, mensajeDeError } from '@/api/apiError'
import type { AdminPaqueteMensajes } from '../interfaces/paqueteMensajes.interface'
import { useGuardarPaquete } from '../queries/paquetes.queries'

const inputClass =
    'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 aria-invalid:border-destructive'

type Campo = 'codigo' | 'nombre' | 'mensajes' | 'precio' | 'moneda'

/** A qué campo pinta el servidor cada uno de sus códigos de validación. */
const CAMPO_DEL_CODIGO: Partial<Record<string, Campo>> = {
    CODIGO_INVALIDO: 'codigo',
    CODIGO_DUPLICADO: 'codigo',
    CODIGO_INMUTABLE: 'codigo',
    NOMBRE_INVALIDO: 'nombre',
    MENSAJES_INVALIDOS: 'mensajes',
    PRECIO_INVALIDO: 'precio',
    MONEDA_INVALIDA: 'moneda',
}

/**
 * Los textos son de paquete: los globales de `CODIGO_INVALIDO`, `PRECIO_INVALIDO`
 * y `MONEDA_INVALIDA` hablan de planes y aquí confundirían.
 */
const MENSAJE_DEL_CODIGO: Record<string, string> = {
    CODIGO_INVALIDO: 'El código no es válido.',
    CODIGO_DUPLICADO: 'Ya existe un paquete con ese código.',
    CODIGO_INMUTABLE: 'El código no se puede cambiar.',
    NOMBRE_INVALIDO: 'Escribe el nombre del paquete.',
    MENSAJES_INVALIDOS: 'Los mensajes deben ser un entero mayor que cero.',
    PRECIO_INVALIDO: 'El precio debe ser mayor que cero.',
    MONEDA_INVALIDA: 'Esa moneda no existe. Usa un código de tres letras como MXN.',
}

interface Props {
    /** `null` cerrado; `'nuevo'` alta; un paquete, edición. */
    paquete: AdminPaqueteMensajes | 'nuevo' | null
    onClose: () => void
}

export const PaqueteDialog = ({ paquete, onClose }: Props) => (
    <Dialog open={paquete !== null} onOpenChange={(abierto) => !abierto && onClose()}>
        <DialogContent className="max-w-lg">
            {paquete && <Formulario paquete={paquete === 'nuevo' ? null : paquete} onClose={onClose} />}
        </DialogContent>
    </Dialog>
)

const texto = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))

const Etiqueta = ({
    etiqueta,
    ayuda,
    error,
    children,
}: {
    etiqueta: string
    ayuda?: string
    error?: string
    children: React.ReactNode
}) => (
    <label className="space-y-1.5 text-sm font-medium">
        {etiqueta}
        {children}
        {error ? (
            <span role="alert" className="block text-xs font-normal text-destructive">{error}</span>
        ) : (
            ayuda && <span className="block text-xs font-normal text-muted-foreground">{ayuda}</span>
        )}
    </label>
)

const Formulario = ({ paquete, onClose }: { paquete: AdminPaqueteMensajes | null; onClose: () => void }) => {
    const esEdicion = paquete !== null

    const [codigo, setCodigo] = useState(paquete?.codigo ?? '')
    const [nombre, setNombre] = useState(paquete?.nombre ?? '')
    const [mensajes, setMensajes] = useState(texto(paquete?.mensajes))
    const [precio, setPrecio] = useState(texto(paquete?.precio))
    const [moneda, setMoneda] = useState(paquete?.moneda ?? 'MXN')
    const [orden, setOrden] = useState(texto(paquete?.orden ?? 0))
    const [activo, setActivo] = useState(paquete?.activo ?? true)

    const mensajesNum = Number(mensajes)
    const precioNum = Number(precio)
    const ordenNum = Number(orden)

    const problema = (() => {
        if (!esEdicion && !codigo.trim()) return 'Escribe el código del paquete.'
        if (!nombre.trim()) return 'Escribe el nombre del paquete.'
        if (mensajes.trim() === '' || !(Number.isInteger(mensajesNum) && mensajesNum > 0)) return 'Los mensajes deben ser un entero mayor que cero.'
        if (precio.trim() === '' || !(precioNum > 0)) return 'El precio debe ser mayor que cero.'
        if (!/^[A-Za-z]{3}$/.test(moneda)) return 'La moneda son tres letras, como MXN.'
        if (orden.trim() === '' || !Number.isInteger(ordenNum)) return 'El orden debe ser un número entero.'
        return null
    })()

    const mutation = useGuardarPaquete(paquete, {
        onSuccess: () => {
            toast.success(esEdicion ? 'Paquete actualizado.' : 'Paquete creado.')
            onClose()
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (problema) return
        mutation.mutate({
            // El código es inmutable: en edición ni siquiera se manda.
            ...(esEdicion ? {} : { codigo: codigo.trim() }),
            nombre: nombre.trim(),
            mensajes: mensajesNum,
            precio: precioNum,
            moneda: moneda.toUpperCase(),
            orden: ordenNum,
            activo,
        })
    }

    // Un error de validación se pinta en su campo; cualquier otro, abajo.
    const campoConError = mutation.error instanceof ApiError ? CAMPO_DEL_CODIGO[mutation.error.code] : undefined
    const errorDeCampo = (campo: Campo) =>
        campoConError === campo && mutation.error instanceof ApiError
            ? (MENSAJE_DEL_CODIGO[mutation.error.code] ?? mutation.error.message)
            : undefined
    const errorGeneral = mutation.error && !campoConError
        ? mensajeDeError(mutation.error, 'No se pudo guardar el paquete.')
        : null

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
                <DialogTitle>{esEdicion ? `Editar ${paquete.nombre}` : 'Nuevo paquete de mensajes'}</DialogTitle>
                <DialogDescription>
                    El precio va sin IVA. Los paquetes no se borran: para retirar uno, desmarca «Activo».
                </DialogDescription>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <Etiqueta
                    etiqueta="Código"
                    ayuda={esEdicion ? 'No se puede cambiar.' : 'Definitivo: no se podrá cambiar.'}
                    error={errorDeCampo('codigo')}
                >
                    <input
                        className={inputClass}
                        value={codigo}
                        disabled={esEdicion}
                        maxLength={32}
                        aria-invalid={!!errorDeCampo('codigo')}
                        onChange={(e) => setCodigo(e.target.value)}
                    />
                </Etiqueta>
                <Etiqueta etiqueta="Nombre" error={errorDeCampo('nombre')}>
                    <input
                        className={inputClass}
                        value={nombre}
                        maxLength={64}
                        aria-invalid={!!errorDeCampo('nombre')}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                </Etiqueta>
                <Etiqueta etiqueta="Mensajes" error={errorDeCampo('mensajes')}>
                    <input
                        className={inputClass}
                        inputMode="numeric"
                        value={mensajes}
                        aria-invalid={!!errorDeCampo('mensajes')}
                        onChange={(e) => setMensajes(e.target.value)}
                    />
                </Etiqueta>
                <Etiqueta etiqueta="Precio (sin IVA)" error={errorDeCampo('precio')}>
                    <input
                        className={inputClass}
                        inputMode="decimal"
                        value={precio}
                        aria-invalid={!!errorDeCampo('precio')}
                        onChange={(e) => setPrecio(e.target.value)}
                    />
                </Etiqueta>
                <Etiqueta etiqueta="Moneda" error={errorDeCampo('moneda')}>
                    <input
                        className={inputClass}
                        value={moneda}
                        maxLength={3}
                        aria-invalid={!!errorDeCampo('moneda')}
                        onChange={(e) => setMoneda(e.target.value.toUpperCase())}
                    />
                </Etiqueta>
                <Etiqueta etiqueta="Orden en la lista">
                    <input className={inputClass} inputMode="numeric" value={orden} onChange={(e) => setOrden(e.target.value)} />
                </Etiqueta>
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-primary" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                Activo
                <span className="text-xs text-muted-foreground">(sin marcar, deja de ofrecerse)</span>
            </label>

            {(errorGeneral ?? (!mutation.error ? problema : null)) && (
                <p role="alert" className={errorGeneral ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
                    {errorGeneral ?? problema}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={problema !== null || mutation.isPending}>
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    {esEdicion ? 'Guardar cambios' : 'Crear paquete'}
                </Button>
            </div>
        </form>
    )
}
