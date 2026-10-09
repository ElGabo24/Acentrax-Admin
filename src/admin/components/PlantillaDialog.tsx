import { useState } from 'react'
import { BadgeCheck, Loader2, Pencil, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import type { PlantillaReceta } from '../interfaces/plantillaReceta.interface'
import { usePlantilla, useVerificarPlantilla } from '../queries/plantillas.queries'
import { cantidad, FUENTE_LABEL, GIRO_LABEL, MODO_FORMULA_LABEL } from '../utils/formato'
import { PlantillaEstadoBadge } from './EstadoBadge'

interface Props {
    /** Id de la plantilla a ver; `null` cerrado. */
    plantillaId: number | null
    onClose: () => void
    /** Quien lo monta cierra este diálogo y abre el editor de esa plantilla. */
    onEditar: (id: number) => void
}

export const PlantillaDialog = ({ plantillaId, onClose, onEditar }: Props) => (
    <Dialog open={plantillaId !== null} onOpenChange={(abierto) => !abierto && onClose()}>
        <DialogContent className="max-w-2xl">
            {plantillaId !== null && <Detalle id={plantillaId} onClose={onClose} onEditar={onEditar} />}
        </DialogContent>
    </Dialog>
)

/** «harina de trigo» → «Harina de trigo»: `capitalize` de CSS pondría mayúscula a cada palabra. */
const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const Dato = ({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) => (
    <div>
        <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
        <dd className="mt-0.5 text-sm font-medium">{children}</dd>
    </div>
)

const Detalle = ({ id, onClose, onEditar }: { id: number; onClose: () => void; onEditar: (id: number) => void }) => {
    const { data, isLoading, isError, error, refetch } = usePlantilla(id)

    if (isLoading) {
        return (
            <>
                <DialogTitle>Plantilla</DialogTitle>
                <DialogDescription className="sr-only">Cargando la plantilla.</DialogDescription>
                <p className="py-8 text-center text-sm text-muted-foreground">Cargando plantilla…</p>
            </>
        )
    }

    if (isError || !data) {
        return (
            <>
                <DialogTitle>Plantilla</DialogTitle>
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

    return <Contenido plantilla={data} onClose={onClose} onEditar={onEditar} />
}

const Contenido = ({
    plantilla,
    onClose,
    onEditar,
}: {
    plantilla: PlantillaReceta
    onClose: () => void
    onEditar: (id: number) => void
}) => {
    const [confirmando, setConfirmando] = useState(false)

    const mutation = useVerificarPlantilla(plantilla.id, {
        onSuccess: () => {
            toast.success(`«${plantilla.nombre}» quedó verificada.`)
            setConfirmando(false)
        },
    })

    const errorVerificar = mutation.error ? mensajeDeError(mutation.error, 'No se pudo verificar la plantilla.') : null

    return (
        <div className="flex max-h-[85svh] flex-col gap-4">
            <div>
                <div className="flex flex-wrap items-center gap-2">
                    <DialogTitle>{plantilla.nombre}</DialogTitle>
                    <PlantillaEstadoBadge estado={plantilla.estado} />
                </div>
                <DialogDescription>
                    {GIRO_LABEL[plantilla.giro]} · {MODO_FORMULA_LABEL[plantilla.modoFormula]}
                </DialogDescription>
            </div>

            {plantilla.aviso && (
                <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>{plantilla.aviso}</span>
                </p>
            )}

            {/* Lo largo se desplaza; el aviso de arriba y los botones de abajo se quedan a la vista. */}
            <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1">
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Dato etiqueta="Rinde">
                        {cantidad(plantilla.rendimientoBase)} {plantilla.unidadRendimiento}
                    </Dato>
                    <Dato etiqueta="Peso por pieza">
                        {plantilla.pesoPiezaG === null ? '—' : `${cantidad(plantilla.pesoPiezaG)} g`}
                    </Dato>
                    <Dato etiqueta="Merma sugerida">{cantidad(plantilla.mermaSugeridaPct)} %</Dato>
                    <Dato etiqueta="Fuente">{FUENTE_LABEL[plantilla.fuente]}</Dato>
                </dl>

                <section>
                    <h3 className="mb-2 text-sm font-semibold">Ingredientes</h3>
                    <div className="surface overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Ingrediente</th>
                                    <th className="text-right">%</th>
                                    <th className="text-right">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plantilla.ingredientes.length === 0 && (
                                    <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Sin ingredientes.</td></tr>
                                )}
                                {plantilla.ingredientes.map((i) => (
                                    <tr key={i.nombreGenerico}>
                                        <td>
                                            <span>{conMayuscula(i.nombreGenerico)}</span>
                                            {i.esBase && <span className="ml-2 text-xs text-muted-foreground">base</span>}
                                        </td>
                                        <td className="text-right tabular-nums">
                                            {i.porcentaje === null ? '—' : cantidad(i.porcentaje)}
                                        </td>
                                        <td className="text-right tabular-nums">
                                            {i.cantidad === null ? '—' : `${cantidad(i.cantidad)} ${i.unidad}`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h3 className="mb-2 text-sm font-semibold">Etapas</h3>
                    <div className="surface overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="w-12">#</th>
                                    <th>Etapa</th>
                                    <th className="text-right">Merma</th>
                                    <th className="text-right">Minutos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plantilla.etapas.length === 0 && (
                                    <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Sin etapas: se usa la merma sugerida.</td></tr>
                                )}
                                {plantilla.etapas.map((e) => (
                                    <tr key={e.orden}>
                                        <td className="tabular-nums">{e.orden}</td>
                                        <td>{e.nombre}</td>
                                        <td className="text-right tabular-nums">{cantidad(e.mermaPct)} %</td>
                                        <td className="text-right tabular-nums">{e.minutos ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {confirmando && (
                <div className="space-y-3 rounded-lg border border-success/40 bg-success/5 p-3">
                    <p className="text-sm">
                        <strong>¿Un panadero real validó estos números?</strong> Verificar es una afirmación tuya,
                        no un trámite: la app dejará de mostrar el aviso de «fórmula sugerida». Si después cambian
                        sus números en el archivo base, la siguiente importación la regresa a Sugerida.
                    </p>
                    {errorVerificar && <p role="alert" className="text-sm text-destructive">{errorVerificar}</p>}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" disabled={mutation.isPending} onClick={() => setConfirmando(false)}>
                            Todavía no
                        </Button>
                        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
                            {mutation.isPending && <Loader2 className="animate-spin" />}
                            Sí, verificar
                        </Button>
                    </div>
                </div>
            )}

            {!confirmando && (
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button variant="outline" onClick={() => onEditar(plantilla.id)}>
                        <Pencil /> Editar
                    </Button>
                    {!plantilla.verificada && (
                        <Button onClick={() => { mutation.reset(); setConfirmando(true) }}>
                            <BadgeCheck /> Marcar como verificada
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
