import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Download, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ApiError, mensajeDeError } from '@/api/apiError'
import { PageHeader } from '../components/PageHeader'
import { PlantillaEstadoBadge } from '../components/EstadoBadge'
import { PlantillaDialog } from '../components/PlantillaDialog'
import { PlantillaFormDialog } from '../components/PlantillaFormDialog'
import { StatTile } from '../components/StatTile'
import type { GiroPlantilla, PlantillaReceta } from '../interfaces/plantillaReceta.interface'
import {
    plantillasKeys,
    useEliminarPlantilla,
    useImportarPlantillas,
    usePlantillas,
} from '../queries/plantillas.queries'
import { invalidar } from '../queries/shared'
import { cantidad, FUENTE_LABEL, GIRO_LABEL } from '../utils/formato'

const GIROS = Object.keys(GIRO_LABEL) as GiroPlantilla[]

const chip = (activo: boolean) =>
    cn(
        'rounded-full border px-3 py-1 text-sm transition-colors',
        activo
            ? 'border-transparent bg-primary text-primary-foreground font-medium'
            : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
    )

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

export const RecetasPage = () => {
    // El giro en la URL: al recargar o compartir el enlace la lista queda igual.
    const [params, setParams] = useSearchParams()
    const giro = GIROS.find((g) => g === params.get('giro'))
    const queryClient = useQueryClient()
    const [viendo, setViendo] = useState<number | null>(null)
    const [editando, setEditando] = useState<number | 'nuevo' | null>(null)
    const [borrando, setBorrando] = useState<PlantillaReceta | null>(null)

    const { data, isLoading, isError, refetch } = usePlantillas()

    const importar = useImportarPlantillas({
        onSuccess: ({ creadas, actualizadas, sinCambios, omitidas }) =>
            toast.success('Plantillas importadas.', {
                description:
                    `${plural(creadas, 'nueva', 'nuevas')} · ${plural(actualizadas, 'actualizada', 'actualizadas')}` +
                    ` · ${sinCambios} sin cambios` +
                    // Las que el superadmin creó, editó o eliminó: la importación ya no las toca.
                    (omitidas > 0
                        ? ` · ${plural(omitidas, 'omitida', 'omitidas')} (${omitidas === 1 ? 'la' : 'las'} creaste, editaste o eliminaste tú)`
                        : '') +
                    (actualizadas > 0 ? '. Las actualizadas volvieron a Sugerida.' : '.'),
            }),
        onError: (error) => {
            const mensaje = mensajeDeError(error, 'No se pudieron importar las plantillas.')
            if (mensaje) toast.error(mensaje)
        },
    })

    const eliminar = useEliminarPlantilla({
        onSuccess: () => {
            toast.success(`«${borrando?.nombre ?? 'La plantilla'}» eliminada.`)
            setBorrando(null)
        },
        onError: (error, id) => {
            if (!(error instanceof ApiError) || error.code !== 'PLANTILLA_RECETA_NOT_FOUND') return
            // Ya la había eliminado otra sesión: se cierra la confirmación y se pone la lista al día.
            setBorrando(null)
            queryClient.removeQueries({ queryKey: plantillasKeys.detail(id) })
            void invalidar(queryClient, plantillasKeys.list())
            toast.warning('Esa plantilla ya no existe; la lista se actualizó.')
        },
    })

    const verificadas = data?.filter((p) => p.verificada).length ?? 0
    const total = data?.length ?? 0
    const visibles = giro ? data?.filter((p) => p.giro === giro) : data

    const elegirGiro = (nuevo: GiroPlantilla | undefined) =>
        setParams(nuevo ? { giro: nuevo } : {}, { replace: true })

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Plantillas de receta"
                descripcion="Las fórmulas base que ven todas las empresas al crear una receta. Toda plantilla nace Sugerida; verifícala solo cuando un panadero real haya validado sus números."
                accion={
                    <div className="flex flex-wrap gap-2">
                        <Button size="lg" variant="outline" disabled={importar.isPending} onClick={() => importar.mutate()}>
                            {importar.isPending ? <Loader2 className="animate-spin" /> : <Download />}
                            Importar plantillas
                        </Button>
                        <Button size="lg" onClick={() => setEditando('nuevo')}><Plus /> Nueva plantilla</Button>
                    </div>
                }
            />

            <div className="grid max-w-xl grid-cols-2 gap-3">
                <StatTile
                    etiqueta="Verificadas"
                    valor={isLoading ? '—' : verificadas}
                    detalle={isLoading ? undefined : `De ${total} plantillas`}
                />
                <StatTile
                    etiqueta="Sugeridas"
                    valor={isLoading ? '—' : total - verificadas}
                    detalle="Sin validar por un panadero"
                />
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por giro">
                <button type="button" className={chip(!giro)} onClick={() => elegirGiro(undefined)}>
                    Todos
                </button>
                {GIROS.map((g) => (
                    <button
                        key={g}
                        type="button"
                        aria-pressed={giro === g}
                        className={chip(giro === g)}
                        onClick={() => elegirGiro(giro === g ? undefined : g)}
                    >
                        {GIRO_LABEL[g]}
                    </button>
                ))}
            </div>

            {isError ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudieron cargar las plantillas.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            ) : (
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Plantilla</th>
                                <th>Estado</th>
                                <th>Fuente</th>
                                <th className="text-right">Rinde</th>
                                <th className="text-right">Merma sugerida</th>
                                <th className="w-24"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Cargando plantillas…</td></tr>
                            )}
                            {visibles?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                                        {data?.length === 0
                                            ? 'Todavía no hay plantillas. Crea una con «Nueva plantilla» o carga las base con «Importar plantillas».'
                                            : 'Ninguna plantilla de ese giro.'}
                                    </td>
                                </tr>
                            )}
                            {visibles?.map((p) => (
                                <tr key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViendo(p.id)}>
                                    <td>
                                        <button
                                            type="button"
                                            className="text-left font-medium hover:underline"
                                            onClick={(e) => { e.stopPropagation(); setViendo(p.id) }}
                                        >
                                            {p.nombre}
                                        </button>
                                        <div className="text-xs text-muted-foreground">{GIRO_LABEL[p.giro]}</div>
                                    </td>
                                    <td><PlantillaEstadoBadge estado={p.estado} /></td>
                                    <td>{FUENTE_LABEL[p.fuente]}</td>
                                    <td className="text-right tabular-nums">
                                        {cantidad(p.rendimientoBase)} {p.unidadRendimiento}
                                    </td>
                                    <td className="text-right tabular-nums">{cantidad(p.mermaSugeridaPct)} %</td>
                                    <td>
                                        {/* La fila entera abre el detalle: los botones no deben dejar pasar el clic. */}
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={`Editar ${p.nombre}`}
                                                onClick={(e) => { e.stopPropagation(); setEditando(p.id) }}
                                            >
                                                <Pencil />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={`Eliminar ${p.nombre}`}
                                                onClick={(e) => { e.stopPropagation(); eliminar.reset(); setBorrando(p) }}
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <PlantillaDialog
                plantillaId={viendo}
                onClose={() => setViendo(null)}
                onEditar={(id) => {
                    setViendo(null)
                    setEditando(id)
                }}
            />
            <PlantillaFormDialog plantilla={editando} onClose={() => setEditando(null)} />

            <Dialog open={borrando !== null} onOpenChange={(abierto) => !abierto && setBorrando(null)}>
                <DialogContent>
                    {borrando && (
                        <>
                            <div>
                                <DialogTitle>Eliminar plantilla</DialogTitle>
                                <DialogDescription>
                                    «{borrando.nombre}» dejará de aparecer y de poder clonarse. Las recetas que ya se clonaron de ella no cambian.
                                </DialogDescription>
                            </div>
                            {eliminar.error && (
                                <p role="alert" className="text-sm text-destructive">
                                    {mensajeDeError(eliminar.error, 'No se pudo eliminar la plantilla.')}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setBorrando(null)}>Cancelar</Button>
                                <Button variant="destructive" disabled={eliminar.isPending} onClick={() => eliminar.mutate(borrando.id)}>
                                    {eliminar.isPending && <Loader2 className="animate-spin" />}
                                    Eliminar
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
