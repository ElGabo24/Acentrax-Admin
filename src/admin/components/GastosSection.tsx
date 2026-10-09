import { useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mensajeDeError } from '@/api/apiError'
import type { CostoOperativo } from '../interfaces/costo.interface'
import { useBorrarCosto, useCostos } from '../queries/costos.queries'
import { CATEGORIA_LABEL, dinero, fechaDia } from '../utils/formato'
import { CostoFormDialog } from './CostoFormDialog'
import { RenovarCostoDialog } from './RenovarCostoDialog'

const SUFIJO = { MENSUAL: '/mes', ANUAL: '/año' } as const

const clave = (concepto: string) => concepto.trim().toLowerCase()

/** "$350/mes", con el original entre paréntesis si el gasto está en otra moneda. */
const MontoCosto = ({ c, enBloque }: { c: CostoOperativo; enBloque?: boolean }) => (
    <span className={cn('tabular-nums', enBloque && 'block')}>
        {dinero(c.montoMxn, 'MXN', 0)}
        {c.frecuencia ? SUFIJO[c.frecuencia] : ''}
        {c.moneda !== 'MXN' && (
            <span className={cn('text-xs text-muted-foreground', enBloque ? 'block' : 'ml-1')}>
                ({c.monto.toLocaleString('es-MX')} {c.moneda} × {c.tipoCambio})
            </span>
        )}
    </span>
)

interface FilaProps {
    costo: CostoOperativo
    onEditar: (c: CostoOperativo) => void
    onRenovar?: (c: CostoOperativo) => void
    onBorrar: (c: CostoOperativo) => void
    detalle?: React.ReactNode
}

// En pantalla ancha las columnas tienen ancho fijo para que alineen de una fila a otra
// (cada fila es su propia cuadrícula); en estrecha se apilan.
const FilaCosto = ({ costo, onEditar, onRenovar, onBorrar, detalle }: FilaProps) => (
    <li className="rounded-lg px-3 py-3 transition-colors hover:bg-muted/40">
        <div className="grid items-center gap-x-4 gap-y-2 lg:grid-cols-[minmax(0,1fr)_8rem_11rem_13rem]">
            <div className="min-w-0">
                <p className="text-sm font-medium">
                    {!costo.recurrente && (
                        <span className="font-normal text-muted-foreground">{fechaDia(costo.fecha, { day: 'numeric', month: 'short' })} · </span>
                    )}
                    {costo.concepto}
                </p>
                {costo.recurrente && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Desde el {fechaDia(costo.fecha)}
                        {costo.fechaFin ? ` · termina el ${fechaDia(costo.fechaFin)}` : ''}
                        {costo.notas ? ` · ${costo.notas}` : ''}
                    </p>
                )}
            </div>
            <span>
                <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {CATEGORIA_LABEL[costo.categoria]}
                </span>
            </span>
            <div className="text-sm lg:text-right"><MontoCosto c={costo} enBloque /></div>
            <div className="flex gap-1 lg:justify-end">
                {onRenovar && (
                    <Button variant="outline" size="sm" onClick={() => onRenovar(costo)}>Cambiar monto</Button>
                )}
                <Button variant="ghost" size="icon-sm" aria-label={`Corregir ${costo.concepto}`} onClick={() => onEditar(costo)}>
                    <Pencil />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Borrar ${costo.concepto}`} onClick={() => onBorrar(costo)}>
                    <Trash2 />
                </Button>
            </div>
        </div>
        {detalle}
    </li>
)

const Historial = ({ versiones }: { versiones: CostoOperativo[] }) => {
    if (versiones.length === 0) return null
    return (
        <details className="mt-1 text-sm">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Ver historial de precios ({versiones.length})
            </summary>
            <ul className="mt-1 space-y-0.5 border-l pl-3">
                {versiones.map((v) => (
                    <li key={v.id} className="flex flex-wrap justify-between gap-x-4 text-xs text-muted-foreground">
                        <span>{fechaDia(v.fecha)} → {v.fechaFin ? fechaDia(v.fechaFin) : '…'}</span>
                        <MontoCosto c={v} />
                    </li>
                ))}
            </ul>
        </details>
    )
}

export const GastosSection = () => {
    const [editando, setEditando] = useState<CostoOperativo | 'nuevo' | null>(null)
    const [renovando, setRenovando] = useState<CostoOperativo | null>(null)
    const [borrando, setBorrando] = useState<CostoOperativo | null>(null)

    const { data: costos, isLoading, isError, refetch } = useCostos()

    const borrar = useBorrarCosto({
        onSuccess: () => {
            toast.success('Gasto borrado.')
            setBorrando(null)
        },
    })

    const recurrentes = costos?.filter((c) => c.recurrente) ?? []
    const vigentes = recurrentes.filter((c) => c.vigente).sort((a, b) => a.concepto.localeCompare(b.concepto))
    const cerradas = recurrentes.filter((c) => !c.vigente).sort((a, b) => b.fecha.localeCompare(a.fecha))
    const historialDe = (c: CostoOperativo) => cerradas.filter((v) => clave(v.concepto) === clave(c.concepto))
    // Conceptos que se dieron de baja: no tienen versión vigente que los agrupe.
    const conceptosVigentes = new Set(vigentes.map((c) => clave(c.concepto)))
    const dadosDeBaja = cerradas.filter((c) => !conceptosVigentes.has(clave(c.concepto)))
    const puntuales = (costos?.filter((c) => !c.recurrente) ?? []).sort((a, b) => b.fecha.localeCompare(a.fecha))

    const fila = (c: CostoOperativo, extra?: Partial<FilaProps>) => (
        <FilaCosto
            key={c.id}
            costo={c}
            onEditar={setEditando}
            onBorrar={setBorrando}
            {...extra}
        />
    )

    return (
        <section className="space-y-4 surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold">Gastos</h2>
                    <p className="text-xs text-muted-foreground">Lo que cuesta operar. Restan a la utilidad de los meses que cubren.</p>
                </div>
                <Button size="sm" onClick={() => setEditando('nuevo')}><Plus /> Agregar gasto</Button>
            </div>

            {isError ? (
                <div className="text-sm">
                    <p className="text-destructive">No se pudieron cargar los gastos.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            ) : isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : (
                <>
                    <div>
                        <h3 className="px-3 pb-1 text-xs font-medium text-muted-foreground uppercase">Recurrentes</h3>
                        {vigentes.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-muted-foreground">Ningún gasto recurrente vigente.</p>
                        ) : (
                            <ul className="divide-y">
                                {vigentes.map((c) =>
                                    fila(c, {
                                        // Solo se renueva la versión abierta: una con fin ya fijado devolvería COSTO_YA_CERRADO.
                                        onRenovar: c.fechaFin === null ? setRenovando : undefined,
                                        detalle: <Historial versiones={historialDe(c)} />,
                                    })
                                )}
                            </ul>
                        )}
                    </div>

                    <div>
                        <h3 className="px-3 pb-1 text-xs font-medium text-muted-foreground uppercase">Puntuales</h3>
                        {puntuales.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-muted-foreground">Sin gastos puntuales.</p>
                        ) : (
                            <ul className="divide-y">{puntuales.map((c) => fila(c))}</ul>
                        )}
                    </div>

                    {dadosDeBaja.length > 0 && (
                        <details>
                            <summary className="cursor-pointer text-xs font-medium text-muted-foreground uppercase hover:text-foreground">
                                Dados de baja ({dadosDeBaja.length})
                            </summary>
                            <ul className="divide-y">{dadosDeBaja.map((c) => fila(c))}</ul>
                        </details>
                    )}
                </>
            )}

            <CostoFormDialog
                costo={editando}
                onClose={() => setEditando(null)}
                onCambiarMonto={(c) => {
                    setEditando(null)
                    setRenovando(c)
                }}
            />
            <RenovarCostoDialog costo={renovando} onClose={() => setRenovando(null)} />

            <Dialog open={borrando !== null} onOpenChange={(abierto) => !abierto && setBorrando(null)}>
                <DialogContent>
                    {borrando && (
                        <>
                            <div>
                                <DialogTitle>Borrar «{borrando.concepto}»</DialogTitle>
                                <DialogDescription>
                                    Es un borrado real, no se puede deshacer: los meses que este gasto cubría dejarán de contarlo.
                                    {borrando.recurrente && ' Para dar de baja un recurrente sin tocar su historial, ponle fecha de fin en «Corregir».'}
                                </DialogDescription>
                            </div>
                            {borrar.error && (
                                <p role="alert" className="text-sm text-destructive">
                                    {mensajeDeError(borrar.error, 'No se pudo borrar el gasto.')}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setBorrando(null)}>Cancelar</Button>
                                <Button variant="destructive" disabled={borrar.isPending} onClick={() => borrar.mutate(borrando.id)}>
                                    {borrar.isPending && <Loader2 className="animate-spin" />}
                                    Borrar
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    )
}
