import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { mensajeDeError } from '@/api/apiError'
import { CuestionarioEditor } from '../components/CuestionarioEditor'
import { Pildora } from '../components/EstadoBadge'
import { PageHeader } from '../components/PageHeader'
import type { Cuestionario } from '../interfaces/prospectos.interface'
import { useActivarCuestionario, useCuestionarioActivo, useVersionesCuestionario } from '../queries/prospectos.queries'
import { fechaHora } from '../utils/formato'
import { TIPOS_PREGUNTA } from '../utils/cuestionarioEditor'

const etiquetaDeTipo = (tipo: string) => TIPOS_PREGUNTA.find((t) => t.valor === tipo)?.etiqueta ?? tipo

export const CuestionarioPage = () => {
    const [editando, setEditando] = useState(false)
    const activo = useCuestionarioActivo()
    const versiones = useVersionesCuestionario()
    const reactivar = useActivarCuestionario({
        onSuccess: (c) => toast.success(`Volvió la versión ${c.version}. Las apps la toman en su próxima sincronización.`),
    })

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Cuestionario"
                descripcion="Las preguntas que hacen los agentes. Lo que cambies aquí llega a sus teléfonos en la siguiente sincronización: no hay que publicar una app nueva."
                accion={
                    !editando && activo.data && (
                        <Button size="lg" onClick={() => setEditando(true)}>
                            <Pencil /> Editar y publicar
                        </Button>
                    )
                }
            />

            {activo.isError ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudo cargar el cuestionario.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void activo.refetch()}>Reintentar</Button>
                </div>
            ) : !activo.data ? (
                <div className="surface p-6 text-sm text-muted-foreground">Cargando cuestionario…</div>
            ) : editando ? (
                <CuestionarioEditor
                    inicial={activo.data.definicion}
                    onCancelar={() => setEditando(false)}
                    onPublicado={() => setEditando(false)}
                />
            ) : (
                <Vigente cuestionario={activo.data} />
            )}

            <section className="space-y-2">
                <h2 className="text-sm font-semibold">Versiones</h2>
                <p className="text-sm text-muted-foreground">
                    Cada cambio publica una versión nueva y conserva las anteriores: las visitas ya hechas se leen con la versión con la que se contestaron.
                </p>
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Versión</th>
                                <th>Publicada</th>
                                <th className="text-right">Preguntas</th>
                                <th className="text-right">Visitas que la contestaron</th>
                                <th>Estado</th>
                                <th className="text-right"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {versiones.isLoading && (
                                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Cargando versiones…</td></tr>
                            )}
                            {versiones.data?.map((v) => (
                                <tr key={v.id} className={cn(!v.activo && 'text-muted-foreground')}>
                                    <td className="font-medium">Versión {v.version}</td>
                                    <td>{fechaHora(v.publicadoEn)}</td>
                                    <td className="text-right tabular-nums">{v.preguntas}</td>
                                    <td className="text-right tabular-nums">{v.visitas}</td>
                                    <td>
                                        {v.activo ? (
                                            <Pildora className="bg-success/15 text-success">Vigente</Pildora>
                                        ) : (
                                            <Pildora className="bg-muted text-muted-foreground">Anterior</Pildora>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        {!v.activo && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={reactivar.isPending}
                                                onClick={() => reactivar.mutate(v.id)}
                                            >
                                                Volver a esta
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {reactivar.error && (
                    <p role="alert" className="text-sm text-destructive">
                        {mensajeDeError(reactivar.error, 'No se pudo cambiar de versión.')}
                    </p>
                )}
            </section>
        </div>
    )
}

/** La versión vigente, de solo lectura. */
const Vigente = ({ cuestionario }: { cuestionario: Cuestionario }) => (
    <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
            Versión {cuestionario.version} vigente · publicada {fechaHora(cuestionario.publicadoEn)}
        </p>
        {cuestionario.definicion.secciones.map((s) => (
            <section key={s.id} className="surface p-4">
                <h3 className="text-sm font-semibold">{s.titulo}</h3>
                <ol className="mt-2 space-y-2 text-sm">
                    {s.preguntas.map((p) => (
                        <li key={p.id}>
                            <p>{p.texto}</p>
                            <p className="text-xs text-muted-foreground">
                                {etiquetaDeTipo(p.tipo)}
                                {p.opciones && p.opciones.length > 0 && ` · ${p.opciones.map((o) => o.texto).join(' / ')}`}
                            </p>
                        </li>
                    ))}
                </ol>
            </section>
        ))}
        <section className="surface p-4">
            <h3 className="text-sm font-semibold">Motivos por los que un negocio dice que no</h3>
            <p className="mt-2 text-sm text-muted-foreground">{cuestionario.definicion.motivosNo.map((m) => m.texto).join(' · ')}</p>
        </section>
    </div>
)
