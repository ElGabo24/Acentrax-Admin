import { useRef, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Info, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ApiError, mensajeDeError } from '@/api/apiError'
import type {
    FuentePlantilla,
    GiroPlantilla,
    ModoFormula,
    PlantillaEtapaPayload,
    PlantillaIngredientePayload,
    PlantillaReceta,
    UnidadReceta,
} from '../interfaces/plantillaReceta.interface'
import { plantillasKeys, useGuardarPlantilla, usePlantilla } from '../queries/plantillas.queries'
import { invalidar } from '../queries/shared'
import { FUENTE_LABEL, GIRO_LABEL, MODO_FORMULA_LABEL, UNIDAD_LABEL, UNIDADES } from '../utils/formato'

const inputClass =
    'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 aria-invalid:border-destructive'

const GIROS = Object.keys(GIRO_LABEL) as GiroPlantilla[]
const FUENTES = Object.keys(FUENTE_LABEL) as FuentePlantilla[]
const MODOS: ModoFormula[] = ['PORCENTAJE_PANADERO', 'CANTIDAD_ABSOLUTA']

// En pantalla ancha cada fila es una cuadrícula con las mismas columnas que su encabezado; en estrecha se apilan.
const COLUMNAS_INGREDIENTE: Record<ModoFormula, string> = {
    PORCENTAJE_PANADERO: 'sm:grid-cols-[3rem_minmax(0,1fr)_6rem_7rem_6rem_2rem]',
    CANTIDAD_ABSOLUTA: 'sm:grid-cols-[minmax(0,1fr)_7rem_6rem_2rem]',
}
const COLUMNAS_ETAPA = 'sm:grid-cols-[4.5rem_minmax(0,1fr)_7rem_7rem_2rem]'

interface Props {
    /** `null` cerrado; `'nuevo'` alta; un id, edición (se carga su detalle: el listado no trae ingredientes ni etapas). */
    plantilla: number | 'nuevo' | null
    onClose: () => void
}

export const PlantillaFormDialog = ({ plantilla, onClose }: Props) => (
    <Dialog open={plantilla !== null} onOpenChange={(abierto) => !abierto && onClose()}>
        <DialogContent className="max-w-3xl">
            {plantilla === 'nuevo' && <Formulario plantilla={null} onClose={onClose} />}
            {typeof plantilla === 'number' && <Cargador id={plantilla} onClose={onClose} />}
        </DialogContent>
    </Dialog>
)

/** El editor parte del detalle, nunca de la fila del listado. */
const Cargador = ({ id, onClose }: { id: number; onClose: () => void }) => {
    const { data, isLoading, isError, error, refetch } = usePlantilla(id)

    if (isLoading) {
        return (
            <>
                <DialogTitle>Editar plantilla</DialogTitle>
                <DialogDescription className="sr-only">Cargando la plantilla.</DialogDescription>
                <p className="py-8 text-center text-sm text-muted-foreground">Cargando plantilla…</p>
            </>
        )
    }

    if (isError || !data) {
        return (
            <>
                <DialogTitle>Editar plantilla</DialogTitle>
                <DialogDescription className="sr-only">No se pudo cargar la plantilla.</DialogDescription>
                <p role="alert" className="text-sm text-destructive">
                    {mensajeDeError(error, 'No se pudo cargar la plantilla.') ?? 'No se pudo cargar la plantilla.'}
                </p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button onClick={() => void refetch()}>Reintentar</Button>
                </div>
            </>
        )
    }

    return <Formulario plantilla={data} onClose={onClose} />
}

const texto = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))

/** Vacío es `NaN`: así «sin capturar» nunca pasa por un cero. */
const numero = (s: string) => (s.trim() === '' ? NaN : Number(s))
const decimales = (s: string) => s.trim().split('.')[1]?.length ?? 0
const positivo = (n: number) => Number.isFinite(n) && n > 0
/** El servidor no distingue mayúsculas ni espacios de los extremos al buscar repetidos. */
const clave = (s: string) => s.trim().toLowerCase()

interface FilaIngrediente {
    /** Identidad de la fila: el nombre es editable y el índice cambia al quitar, así que ninguno sirve de `key`. */
    uid: number
    nombre: string
    unidad: UnidadReceta
    cantidad: string
    porcentaje: string
    esBase: boolean
}

interface FilaEtapa {
    uid: number
    orden: string
    nombre: string
    mermaPct: string
    minutos: string
}

let ultimoUid = 0
const nuevoUid = () => ++ultimoUid

const ingredienteVacio = (esBase: boolean): FilaIngrediente => ({
    uid: nuevoUid(),
    nombre: '',
    unidad: 'G',
    cantidad: '',
    porcentaje: '',
    esBase,
})

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

/** Un campo de una fila dinámica: la etiqueta se ve al apilar y, con el encabezado a la vista, queda solo para lectores de pantalla. */
const Celda = ({ etiqueta, className, children }: { etiqueta: string; className?: string; children: React.ReactNode }) => (
    <label className={cn('space-y-1', className)}>
        <span className="block text-xs text-muted-foreground sm:sr-only">{etiqueta}</span>
        {children}
    </label>
)

const Encabezado = ({ columnas, titulos }: { columnas: string; titulos: string[] }) => (
    <div aria-hidden className={cn('hidden gap-2 px-[13px] text-xs text-muted-foreground sm:grid', columnas)}>
        {titulos.map((t, i) => <span key={i}>{t}</span>)}
    </div>
)

const Formulario = ({ plantilla, onClose }: { plantilla: PlantillaReceta | null; onClose: () => void }) => {
    const esEdicion = plantilla !== null
    const queryClient = useQueryClient()
    const nombreRef = useRef<HTMLInputElement>(null)

    const [giro, setGiro] = useState<GiroPlantilla>(plantilla?.giro ?? 'PANADERIA')
    const [nombre, setNombre] = useState(plantilla?.nombre ?? '')
    // Se prellena con la actual: si no, editar una GENERADA la dejaría en MANUAL sin que nadie lo decidiera.
    const [fuente, setFuente] = useState<FuentePlantilla>(plantilla?.fuente ?? 'MANUAL')
    const [modo, setModo] = useState<ModoFormula>(plantilla?.modoFormula ?? 'PORCENTAJE_PANADERO')

    const [rendimiento, setRendimiento] = useState(texto(plantilla?.rendimientoBase))
    const [unidad, setUnidad] = useState<UnidadReceta>((plantilla?.unidadRendimiento as UnidadReceta | undefined) ?? 'KG')
    const [pesoPieza, setPesoPieza] = useState(texto(plantilla?.pesoPiezaG))
    const [merma, setMerma] = useState(plantilla ? texto(plantilla.mermaSugeridaPct) : '0')

    const [ingredientes, setIngredientes] = useState<FilaIngrediente[]>(() =>
        plantilla
            ? plantilla.ingredientes.map((i) => ({
                uid: nuevoUid(),
                nombre: i.nombreGenerico,
                unidad: i.unidad as UnidadReceta,
                // En porcentaje panadero solo la base lleva cantidad: la de los demás la deriva el servidor.
                cantidad: plantilla.modoFormula === 'PORCENTAJE_PANADERO' && !i.esBase ? '' : texto(i.cantidad),
                // La base va siempre al 100 %: no se captura.
                porcentaje: i.esBase ? '' : texto(i.porcentaje),
                esBase: i.esBase,
            }))
            : [ingredienteVacio(true)]
    )
    const [etapas, setEtapas] = useState<FilaEtapa[]>(() =>
        (plantilla?.etapas ?? [])
            .toSorted((a, b) => a.orden - b.orden)
            .map((e) => ({
                uid: nuevoUid(),
                orden: String(e.orden),
                nombre: e.nombre,
                mermaPct: texto(e.mermaPct),
                minutos: texto(e.minutos),
            }))
    )

    /** Qué se limpió al cambiar de modo; se queda a la vista hasta que se cierre o se cambie otra vez. */
    const [avisoModo, setAvisoModo] = useState<string | null>(null)
    /** La fila recién agregada recibe el foco para capturar varias seguidas. */
    const [filaNueva, setFilaNueva] = useState<number | null>(null)

    const porcentajeModo = modo === 'PORCENTAJE_PANADERO'
    const conEtapas = etapas.length > 0
    const rendNum = numero(rendimiento)
    const pesoNum = numero(pesoPieza)
    const mermaNum = numero(merma)
    // La merma es una o la otra: con una merma sugerida mayor que cero no se capturan etapas.
    const mermaBloqueaEtapas = !conEtapas && mermaNum > 0
    const sugerirPeso = unidad === 'PZA' && pesoPieza.trim() === ''

    // El primer problema que el servidor rechazaría, para mostrarlo bajo el formulario. El servidor manda:
    // aquí solo van las reglas del contrato.
    const problema = (() => {
        if (!nombre.trim()) return 'Escribe el nombre de la plantilla.'
        if (!positivo(rendNum)) return 'El rendimiento debe ser un número mayor que cero.'
        if (decimales(rendimiento) > 3) return 'El rendimiento admite hasta 3 decimales.'
        if (pesoPieza.trim() !== '') {
            if (!positivo(pesoNum)) return 'El peso por pieza debe ser mayor que cero, o déjalo vacío.'
            if (decimales(pesoPieza) > 2) return 'El peso por pieza admite hasta 2 decimales.'
        }
        if (!conEtapas && merma.trim() !== '') {
            if (!(mermaNum >= 0 && mermaNum < 100)) return 'La merma sugerida debe estar entre 0 y menos de 100.'
            if (decimales(merma) > 2) return 'La merma sugerida admite hasta 2 decimales.'
        }

        if (ingredientes.length === 0) return 'Agrega al menos un ingrediente.'
        if (porcentajeModo && ingredientes.filter((f) => f.esBase).length !== 1) {
            return 'Marca un ingrediente como base (uno solo).'
        }
        const vistos = new Set<string>()
        for (const [i, f] of ingredientes.entries()) {
            const etiqueta = `Ingrediente ${i + 1}`
            if (!f.nombre.trim()) return `${etiqueta}: escribe el nombre.`
            if (vistos.has(clave(f.nombre))) return `«${f.nombre.trim()}» está repetido: cada ingrediente va una sola vez.`
            vistos.add(clave(f.nombre))

            if (!porcentajeModo || f.esBase) {
                if (!positivo(numero(f.cantidad))) return `${etiqueta}: la cantidad debe ser mayor que cero.`
                if (decimales(f.cantidad) > 3) return `${etiqueta}: la cantidad admite hasta 3 decimales.`
            } else {
                const p = numero(f.porcentaje)
                if (!positivo(p)) return `${etiqueta}: el porcentaje debe ser mayor que cero.`
                if (p >= 10000) return `${etiqueta}: el porcentaje debe ser menor que 10 000.`
                if (decimales(f.porcentaje) > 3) return `${etiqueta}: el porcentaje admite hasta 3 decimales.`
            }
        }

        const ordenes = new Set<number>()
        for (const [i, e] of etapas.entries()) {
            const etiqueta = `Etapa ${i + 1}`
            const orden = numero(e.orden)
            if (!Number.isInteger(orden) || orden < 1) return `${etiqueta}: el orden es un entero desde 1.`
            if (ordenes.has(orden)) return `${etiqueta}: el orden ${orden} está repetido.`
            ordenes.add(orden)
            if (!e.nombre.trim()) return `${etiqueta}: escribe el nombre.`
            if (e.mermaPct.trim() !== '') {
                if (!(numero(e.mermaPct) >= 0 && numero(e.mermaPct) < 100)) return `${etiqueta}: la merma debe estar entre 0 y menos de 100.`
                if (decimales(e.mermaPct) > 2) return `${etiqueta}: la merma admite hasta 2 decimales.`
            }
            if (e.minutos.trim() !== '' && !(Number.isInteger(numero(e.minutos)) && numero(e.minutos) >= 1)) {
                return `${etiqueta}: los minutos son un entero desde 1, o déjalos vacíos.`
            }
        }
        return null
    })()

    const mutation = useGuardarPlantilla(plantilla, {
        onSuccess: (guardada) => {
            // El estado se lee de la respuesta: el servidor decide si los cambios la regresaron a Sugerida.
            if (!esEdicion) {
                toast.success('Plantilla creada.', {
                    description: 'Nace Sugerida: verifícala cuando un panadero real haya validado sus números.',
                })
            } else if (plantilla?.estado === 'VERIFICADA' && guardada.estado === 'SUGERIDA') {
                toast.warning('Plantilla actualizada.', {
                    description: 'Cambiaron sus números: volvió a Sugerida y hay que verificarla de nuevo.',
                })
            } else {
                toast.success('Plantilla actualizada.')
            }
            onClose()
        },
        onError: (error) => {
            if (!(error instanceof ApiError)) return
            if (error.code === 'PLANTILLA_RECETA_DUPLICADA') nombreRef.current?.focus()
            if (error.code === 'PLANTILLA_RECETA_NOT_FOUND' && plantilla) {
                // Otra sesión la eliminó mientras se editaba: se cierra, se limpia su caché y se refresca la lista.
                onClose()
                queryClient.removeQueries({ queryKey: plantillasKeys.detail(plantilla.id) })
                void invalidar(queryClient, plantillasKeys.list())
                toast.warning('Esa plantilla ya no existe; la lista se actualizó.')
            }
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (problema) return

        const ingredientesPayload = ingredientes.map((f): PlantillaIngredientePayload => {
            const comun = { nombreGenerico: f.nombre.trim(), unidad: f.unidad }
            if (!porcentajeModo) return { ...comun, cantidad: numero(f.cantidad) }
            // La cantidad de los demás no se manda: el servidor la deriva.
            return f.esBase
                ? { ...comun, cantidad: numero(f.cantidad), porcentaje: 100, esBase: true }
                : { ...comun, porcentaje: numero(f.porcentaje) }
        })

        const etapasPayload = etapas
            .map((f): PlantillaEtapaPayload => ({
                orden: numero(f.orden),
                nombre: f.nombre.trim(),
                ...(f.mermaPct.trim() !== '' ? { mermaPct: numero(f.mermaPct) } : {}),
                minutos: f.minutos.trim() !== '' ? numero(f.minutos) : null,
            }))
            .sort((a, b) => a.orden - b.orden)

        mutation.mutate({
            giro,
            nombre: nombre.trim(),
            modoFormula: modo,
            fuente,
            rendimientoBase: rendNum,
            unidadRendimiento: unidad,
            pesoPiezaG: pesoPieza.trim() !== '' ? pesoNum : null,
            // Con etapas la merma sugerida va en 0, esté lo que esté escrito en el campo.
            mermaSugeridaPct: conEtapas || merma.trim() === '' ? 0 : mermaNum,
            ingredientes: ingredientesPayload,
            // Sin etapas se omiten (con `null` el servidor responde 400); en un PUT omitirlas las borra.
            ...(conEtapas ? { etapas: etapasPayload } : {}),
        })
    }

    // --- Ingredientes ---

    const editarIngrediente = (uid: number, cambio: Partial<Omit<FilaIngrediente, 'uid'>>) =>
        setIngredientes((filas) => filas.map((f) => (f.uid === uid ? { ...f, ...cambio } : f)))

    const agregarIngrediente = () => {
        const fila = ingredienteVacio(porcentajeModo && !ingredientes.some((f) => f.esBase))
        setIngredientes((filas) => [...filas, fila])
        setFilaNueva(fila.uid)
    }

    const quitarIngrediente = (uid: number) => setIngredientes((filas) => filas.filter((f) => f.uid !== uid))

    /** Una sola base: la anterior deja de serlo y pierde su cantidad, que ya no aplica. */
    const marcarBase = (uid: number) =>
        setIngredientes((filas) =>
            filas.map((f) =>
                f.uid === uid
                    ? { ...f, esBase: true, porcentaje: '' }
                    : f.esBase ? { ...f, esBase: false, cantidad: '' } : f
            )
        )

    const cambiarModo = (nuevo: ModoFormula) => {
        if (nuevo === modo) return

        if (nuevo === 'CANTIDAD_ABSOLUTA') {
            const habiaPorcentajes = ingredientes.some((f) => f.porcentaje.trim() !== '')
            setIngredientes((filas) => filas.map((f) => ({ ...f, porcentaje: '', esBase: false })))
            setAvisoModo(
                habiaPorcentajes
                    ? 'Se limpiaron los porcentajes y la marca de base: en cantidad absoluta cada ingrediente lleva su cantidad.'
                    : null
            )
        } else {
            // La primera fila pasa a ser la base y conserva su cantidad; la de las demás se calcula con su porcentaje.
            const habiaCantidades = ingredientes.some((f, i) => i > 0 && f.cantidad.trim() !== '')
            setIngredientes((filas) =>
                filas.map((f, i) => (i === 0 ? { ...f, esBase: true, porcentaje: '' } : { ...f, esBase: false, cantidad: '' }))
            )
            setAvisoModo(
                habiaCantidades
                    ? 'Se limpiaron las cantidades de los ingredientes que no son la base: en porcentaje panadero se calculan con su porcentaje. Marcamos el primero como base; cámbialo si no lo es.'
                    : null
            )
        }
        setModo(nuevo)
    }

    // --- Etapas ---

    const editarEtapa = (uid: number, cambio: Partial<Omit<FilaEtapa, 'uid'>>) =>
        setEtapas((filas) => filas.map((f) => (f.uid === uid ? { ...f, ...cambio } : f)))

    const agregarEtapa = () => {
        const ultimoOrden = etapas.reduce((max, f) => Math.max(max, Number.isInteger(numero(f.orden)) ? numero(f.orden) : 0), 0)
        const fila: FilaEtapa = { uid: nuevoUid(), orden: String(ultimoOrden + 1), nombre: '', mermaPct: '', minutos: '' }
        setEtapas((filas) => [...filas, fila])
        setFilaNueva(fila.uid)
    }

    const quitarEtapa = (uid: number) => setEtapas((filas) => filas.filter((f) => f.uid !== uid))

    // --- Errores del servidor ---

    // El duplicado se pinta en el nombre; la lista de VALIDATION_ERROR no trae nombres de campo, así que va aparte.
    const errorNombre =
        mutation.error instanceof ApiError && mutation.error.code === 'PLANTILLA_RECETA_DUPLICADA'
            ? mutation.error.message
            : undefined
    const listaDeErrores =
        mutation.error instanceof ApiError && mutation.error.code === 'VALIDATION_ERROR' && mutation.error.fieldErrors.length > 0
            ? mutation.error.fieldErrors
            : null
    const errorGeneral =
        mutation.error && !errorNombre && !listaDeErrores
            ? mensajeDeError(mutation.error, 'No se pudo guardar la plantilla.')
            : null

    return (
        // El alto máximo descuenta el relleno del diálogo: así scrollea solo el cuerpo y el pie queda a la vista.
        <form onSubmit={onSubmit} className="flex max-h-[calc(92dvh-3rem)] flex-col gap-4">
            <div>
                <DialogTitle>{esEdicion ? `Editar ${plantilla.nombre}` : 'Nueva plantilla de receta'}</DialogTitle>
                <DialogDescription>
                    Toda plantilla nace Sugerida: verifícala solo cuando un panadero real haya validado sus números.
                </DialogDescription>
            </div>

            {plantilla?.estado === 'VERIFICADA' && (
                <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <p>Si cambias los números, volverá a Sugerida y habrá que verificarla de nuevo.</p>
                </div>
            )}

            <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-1">
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Datos</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Etiqueta etiqueta="Giro">
                            <select className={inputClass} value={giro} onChange={(e) => setGiro(e.target.value as GiroPlantilla)}>
                                {GIROS.map((g) => <option key={g} value={g}>{GIRO_LABEL[g]}</option>)}
                            </select>
                        </Etiqueta>
                        <Etiqueta etiqueta="Nombre" error={errorNombre}>
                            <input
                                ref={nombreRef}
                                className={inputClass}
                                value={nombre}
                                maxLength={120}
                                aria-invalid={!!errorNombre}
                                onChange={(e) => setNombre(e.target.value)}
                            />
                        </Etiqueta>
                        <Etiqueta etiqueta="Fuente">
                            <select className={inputClass} value={fuente} onChange={(e) => setFuente(e.target.value as FuentePlantilla)}>
                                {FUENTES.map((f) => <option key={f} value={f}>{FUENTE_LABEL[f]}</option>)}
                            </select>
                        </Etiqueta>
                        <Etiqueta
                            etiqueta="Modo de la fórmula"
                            ayuda={
                                porcentajeModo
                                    ? 'Cada ingrediente es un % de la base (la harina = 100 %). Solo la base lleva cantidad.'
                                    : 'Cada ingrediente lleva su cantidad; no hay porcentajes.'
                            }
                        >
                            <select className={inputClass} value={modo} onChange={(e) => cambiarModo(e.target.value as ModoFormula)}>
                                {MODOS.map((m) => <option key={m} value={m}>{MODO_FORMULA_LABEL[m]}</option>)}
                            </select>
                        </Etiqueta>
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Rendimiento</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Etiqueta etiqueta="Rendimiento base" ayuda="Lo que rinde la fórmula.">
                            <input className={inputClass} inputMode="decimal" value={rendimiento} onChange={(e) => setRendimiento(e.target.value)} />
                        </Etiqueta>
                        <Etiqueta etiqueta="Unidad">
                            <select className={inputClass} value={unidad} onChange={(e) => setUnidad(e.target.value as UnidadReceta)}>
                                {UNIDADES.map((u) => <option key={u} value={u}>{UNIDAD_LABEL[u]}</option>)}
                            </select>
                        </Etiqueta>
                        <Etiqueta etiqueta="Peso por pieza (g)" ayuda="Masa antes de hornear. Opcional.">
                            <input className={inputClass} inputMode="decimal" value={pesoPieza} onChange={(e) => setPesoPieza(e.target.value)} />
                        </Etiqueta>
                        <Etiqueta
                            etiqueta="Merma sugerida (%)"
                            ayuda={conEtapas ? 'Con etapas queda en 0: la merma sale de ellas.' : 'De 0 a menos de 100.'}
                        >
                            <input
                                className={inputClass}
                                inputMode="decimal"
                                value={conEtapas ? '0' : merma}
                                disabled={conEtapas}
                                onChange={(e) => setMerma(e.target.value)}
                            />
                        </Etiqueta>
                    </div>
                    {sugerirPeso && (
                        <p className="flex items-start gap-2 text-xs text-warning">
                            <AlertTriangle className="mt-px size-3.5 shrink-0" />
                            <span>
                                Conviene capturar el peso por pieza: sin él la plantilla no se puede clonar en un producto que se vende por kilo.
                            </span>
                        </p>
                    )}
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">Ingredientes</h3>
                        <Button type="button" variant="outline" size="sm" onClick={agregarIngrediente}>
                            <Plus /> Agregar ingrediente
                        </Button>
                    </div>

                    {avisoModo && (
                        <div role="status" className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
                            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            <p className="flex-1">{avisoModo}</p>
                            <Button type="button" variant="ghost" size="xs" onClick={() => setAvisoModo(null)}>Entendido</Button>
                        </div>
                    )}

                    <Encabezado
                        columnas={COLUMNAS_INGREDIENTE[modo]}
                        titulos={porcentajeModo ? ['Base', 'Ingrediente', '%', 'Cantidad', 'Unidad', ''] : ['Ingrediente', 'Cantidad', 'Unidad', '']}
                    />
                    <ul className="space-y-2">
                        {ingredientes.map((f, i) => {
                            const n = i + 1
                            return (
                                <li
                                    key={f.uid}
                                    className={cn(
                                        'grid grid-cols-2 items-end gap-2 rounded-lg border bg-muted/30 p-3 sm:items-center',
                                        COLUMNAS_INGREDIENTE[modo]
                                    )}
                                >
                                    {porcentajeModo && (
                                        <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-1">
                                            <input
                                                type="radio"
                                                name="ingrediente-base"
                                                className="size-4 accent-primary"
                                                checked={f.esBase}
                                                aria-label={`Marcar el ingrediente ${n} como base`}
                                                onChange={() => marcarBase(f.uid)}
                                            />
                                            <span className="sm:sr-only">Es la base</span>
                                        </label>
                                    )}
                                    <Celda etiqueta="Ingrediente" className="col-span-2 sm:col-span-1">
                                        <input
                                            className={inputClass}
                                            value={f.nombre}
                                            maxLength={80}
                                            autoFocus={f.uid === filaNueva}
                                            aria-label={`Ingrediente ${n}`}
                                            onChange={(e) => editarIngrediente(f.uid, { nombre: e.target.value })}
                                        />
                                    </Celda>
                                    {porcentajeModo && (
                                        <Celda etiqueta="%">
                                            {f.esBase ? (
                                                <input className={inputClass} value="100" disabled readOnly aria-label={`Porcentaje del ingrediente ${n}: la base va al 100 %`} />
                                            ) : (
                                                <input
                                                    className={inputClass}
                                                    inputMode="decimal"
                                                    value={f.porcentaje}
                                                    aria-label={`Porcentaje del ingrediente ${n}`}
                                                    onChange={(e) => editarIngrediente(f.uid, { porcentaje: e.target.value })}
                                                />
                                            )}
                                        </Celda>
                                    )}
                                    <Celda etiqueta="Cantidad">
                                        {porcentajeModo && !f.esBase ? (
                                            <input className={inputClass} value="" placeholder="Se calcula" disabled readOnly aria-label={`Cantidad del ingrediente ${n}: se calcula con su porcentaje`} />
                                        ) : (
                                            <input
                                                className={inputClass}
                                                inputMode="decimal"
                                                value={f.cantidad}
                                                aria-label={`Cantidad del ingrediente ${n}`}
                                                onChange={(e) => editarIngrediente(f.uid, { cantidad: e.target.value })}
                                            />
                                        )}
                                    </Celda>
                                    <Celda etiqueta="Unidad">
                                        <select
                                            className={inputClass}
                                            value={f.unidad}
                                            aria-label={`Unidad del ingrediente ${n}`}
                                            onChange={(e) => editarIngrediente(f.uid, { unidad: e.target.value as UnidadReceta })}
                                        >
                                            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </Celda>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="col-span-2 justify-self-end sm:col-span-1"
                                        aria-label={`Quitar el ingrediente ${n}`}
                                        disabled={ingredientes.length === 1}
                                        onClick={() => quitarIngrediente(f.uid)}
                                    >
                                        <Trash2 />
                                    </Button>
                                </li>
                            )
                        })}
                    </ul>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">Etapas <span className="font-normal text-muted-foreground">(opcional)</span></h3>
                        <Button type="button" variant="outline" size="sm" disabled={mermaBloqueaEtapas} onClick={agregarEtapa}>
                            <Plus /> Agregar etapa
                        </Button>
                    </div>

                    {mermaBloqueaEtapas && (
                        <p className="text-xs text-muted-foreground">
                            La merma es una o la otra: con una merma sugerida mayor que cero no se capturan etapas. Pon la merma en 0 para usarlas.
                        </p>
                    )}
                    {!conEtapas && !mermaBloqueaEtapas && (
                        <p className="text-sm text-muted-foreground">Sin etapas: se usa la merma sugerida.</p>
                    )}

                    {conEtapas && (
                        <>
                            <Encabezado columnas={COLUMNAS_ETAPA} titulos={['Orden', 'Etapa', 'Merma (%)', 'Minutos', '']} />
                            <ul className="space-y-2">
                                {etapas.map((f, i) => {
                                    const n = i + 1
                                    return (
                                        <li
                                            key={f.uid}
                                            className={cn('grid grid-cols-2 items-end gap-2 rounded-lg border bg-muted/30 p-3 sm:items-center', COLUMNAS_ETAPA)}
                                        >
                                            <Celda etiqueta="Orden">
                                                <input
                                                    className={inputClass}
                                                    inputMode="numeric"
                                                    value={f.orden}
                                                    aria-label={`Orden de la etapa ${n}`}
                                                    onChange={(e) => editarEtapa(f.uid, { orden: e.target.value })}
                                                />
                                            </Celda>
                                            <Celda etiqueta="Etapa" className="col-span-2 sm:col-span-1">
                                                <input
                                                    className={inputClass}
                                                    value={f.nombre}
                                                    maxLength={60}
                                                    autoFocus={f.uid === filaNueva}
                                                    aria-label={`Nombre de la etapa ${n}`}
                                                    onChange={(e) => editarEtapa(f.uid, { nombre: e.target.value })}
                                                />
                                            </Celda>
                                            <Celda etiqueta="Merma (%)">
                                                <input
                                                    className={inputClass}
                                                    inputMode="decimal"
                                                    value={f.mermaPct}
                                                    aria-label={`Merma de la etapa ${n}`}
                                                    onChange={(e) => editarEtapa(f.uid, { mermaPct: e.target.value })}
                                                />
                                            </Celda>
                                            <Celda etiqueta="Minutos">
                                                <input
                                                    className={inputClass}
                                                    inputMode="numeric"
                                                    value={f.minutos}
                                                    aria-label={`Minutos de la etapa ${n}`}
                                                    onChange={(e) => editarEtapa(f.uid, { minutos: e.target.value })}
                                                />
                                            </Celda>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                className="col-span-2 justify-self-end sm:col-span-1"
                                                aria-label={`Quitar la etapa ${n}`}
                                                onClick={() => quitarEtapa(f.uid)}
                                            >
                                                <Trash2 />
                                            </Button>
                                        </li>
                                    )
                                })}
                            </ul>
                            <p className="text-xs text-muted-foreground">
                                La merma de cada etapa es en cascada: no se suma. Quita todas las etapas para volver a la merma sugerida.
                            </p>
                        </>
                    )}
                </section>
            </div>

            <div className="space-y-3">
                {listaDeErrores && (
                    <div role="alert" className="max-h-[25svh] overflow-y-auto text-sm text-destructive">
                        <p className="font-medium">El servidor no aceptó la plantilla:</p>
                        <ul className="list-disc pl-5">
                            {listaDeErrores.map((e, i) => <li key={`${i}-${e}`}>{e}</li>)}
                        </ul>
                    </div>
                )}

                {(errorGeneral ?? (!mutation.error ? problema : null)) && (
                    <p role="alert" className={errorGeneral ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
                        {errorGeneral ?? problema}
                    </p>
                )}

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={problema !== null || mutation.isPending}>
                        {mutation.isPending && <Loader2 className="animate-spin" />}
                        {esEdicion ? 'Guardar cambios' : 'Crear plantilla'}
                    </Button>
                </div>
            </div>
        </form>
    )
}
