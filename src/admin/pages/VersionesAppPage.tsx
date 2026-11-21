import { useMemo, useState } from 'react'
import { ChevronDown, Eye, ImageIcon, Loader2, Lock, Pencil, Plus, Rocket, Smartphone, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { mensajeDeError } from '@/api/apiError'
import { PageHeader } from '../components/PageHeader'
import { Pildora } from '../components/EstadoBadge'
import { aPayload, VersionAppDialog, type NuevaVersion } from '../components/VersionAppDialog'
import { VistaPreviaVersion } from '../components/VistaPreviaVersion'
import type { AdminVersionApp, PlataformaApp } from '../interfaces/versionApp.interface'
import { useGuardarVersion, useVersiones } from '../queries/versiones.queries'
import { fechaHora, haceCuanto } from '../utils/formato'

const PLATAFORMAS: { clave: PlataformaApp; nombre: string; tile: string }[] = [
    { clave: 'ANDROID', nombre: 'Android', tile: 'bg-success/15 text-success' },
    { clave: 'IOS', nombre: 'iOS', tile: 'bg-muted text-foreground' },
]

/** Mayor versión primero: compara por partes numéricas, no como texto. */
const comparar = (a: string, b: string) => {
    const pa = a.split('.').map(Number)
    const pb = b.split('.').map(Number)
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pa[i] ?? 0) - (pb[i] ?? 0)
        if (d !== 0) return d
    }
    return 0
}

export const VersionesAppPage = () => {
    const [editando, setEditando] = useState<AdminVersionApp | NuevaVersion | null>(null)
    const [viendo, setViendo] = useState<AdminVersionApp | null>(null)
    const { data, isLoading, isError, refetch } = useVersiones()

    const apps = useMemo(() => {
        const porApp = new Map<string, AdminVersionApp[]>()
        data?.forEach((v) => porApp.set(v.app, [...(porApp.get(v.app) ?? []), v]))
        return [...porApp.entries()].sort(([a], [b]) => a.localeCompare(b))
    }, [data])

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Versiones de las apps"
                descripcion="Publica la versión disponible de cada app móvil: invita a actualizar o hazlo obligatorio. Las apps lo consultan al abrirse."
                accion={<Button size="lg" onClick={() => setEditando({ nueva: true })}><Plus /> Nueva app</Button>}
            />

            <div className="surface flex gap-3 border-l-4 border-l-warning p-4 text-sm">
                <div>
                    <p className="font-medium">Cuándo ve el aviso la app</p>
                    <p className="mt-0.5 text-muted-foreground">
                        Sólo cuando hay una versión <strong className="text-foreground">publicada</strong> más nueva que la instalada. Con{' '}
                        <strong className="text-foreground">obligatoria</strong> no puede cerrarlo. Publica hasta que la tienda ya la
                        libere: si no, todos verán el aviso sin tener qué descargar.
                    </p>
                </div>
            </div>

            {isError && (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudieron cargar las versiones.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            )}
            {isLoading && <p className="py-10 text-center text-sm text-muted-foreground">Cargando versiones…</p>}
            {data?.length === 0 && (
                <p className="surface py-10 text-center text-sm text-muted-foreground">Todavía no hay apps. Crea la primera con «Nueva app».</p>
            )}

            {apps.map(([app, versiones]) => (
                <section key={app} className="surface overflow-hidden">
                    <header className="flex items-center gap-3 border-b px-5 py-3.5">
                        <h2 className="font-semibold tracking-tight">{app}</h2>
                        <span className="text-xs text-muted-foreground">{versiones.length} versión(es)</span>
                    </header>

                    <div className="grid gap-4 p-4 lg:grid-cols-2">
                        {PLATAFORMAS.map((p) => (
                            <TarjetaPlataforma
                                key={p.clave}
                                app={app}
                                plataforma={p}
                                versiones={versiones.filter((v) => v.plataforma === p.clave)}
                                onEditar={setEditando}
                                onVer={setViendo}
                            />
                        ))}
                    </div>

                    <details className="group border-t">
                        <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 text-sm text-muted-foreground hover:text-foreground">
                            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                            Historial de versiones
                        </summary>
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr><th>Plataforma</th><th>Versión</th><th>Aviso</th><th>Tipo</th><th>Estado</th></tr>
                                </thead>
                                <tbody>
                                    {[...versiones].sort((a, b) => comparar(b.version, a.version)).map((v) => (
                                        <tr key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setEditando(v)}>
                                            <td>{v.plataforma === 'IOS' ? 'iOS' : 'Android'}</td>
                                            <td className="font-medium tabular-nums">{v.version}</td>
                                            <td className="max-w-xs truncate">{v.titulo}</td>
                                            <td>{v.obligatoria ? 'Obligatoria' : 'Opcional'}</td>
                                            <td>{v.publicada ? 'Publicada' : 'Borrador'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </section>
            ))}

            <VersionAppDialog version={editando} onClose={() => setEditando(null)} />
            <VistaPreviaVersion version={viendo} onClose={() => setViendo(null)} />
        </div>
    )
}

interface TarjetaProps {
    app: string
    plataforma: (typeof PLATAFORMAS)[number]
    versiones: AdminVersionApp[]
    onEditar: (v: AdminVersionApp | NuevaVersion) => void
    onVer: (v: AdminVersionApp) => void
}

const TarjetaPlataforma = ({ app, plataforma, versiones, onEditar, onVer }: TarjetaProps) => {
    // La que ve la app es la más alta publicada; si no hay, se muestra el borrador más alto.
    const ordenadas = [...versiones].sort((a, b) => comparar(b.version, a.version))
    const vigente = ordenadas.find((v) => v.publicada) ?? ordenadas[0]
    const borradorNuevo = vigente && !vigente.publicada ? null : ordenadas.find((v) => !v.publicada)

    return (
        <article className="flex flex-col rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
                <span className={cn('grid size-10 place-items-center rounded-xl', plataforma.tile)}>
                    <Smartphone className="size-5" />
                </span>
                <h3 className="font-semibold">{plataforma.nombre}</h3>
                {vigente && (
                    <span className="ml-auto">
                        {vigente.publicada
                            ? <Pildora className="bg-success/15 text-success">Publicada</Pildora>
                            : <Pildora className="bg-muted text-muted-foreground">Borrador</Pildora>}
                    </span>
                )}
            </div>

            {!vigente ? (
                <div className="flex flex-1 flex-col items-start gap-3 py-6">
                    <p className="text-sm text-muted-foreground">Todavía no hay versión para {plataforma.nombre}.</p>
                    <Button variant="outline" size="sm" onClick={() => onEditar({ nueva: true, app, plataforma: plataforma.clave })}>
                        <Plus /> Crear primera versión
                    </Button>
                </div>
            ) : (
                <Detalle
                    v={vigente}
                    hayBorrador={!!borradorNuevo}
                    onEditar={() => onEditar(vigente)}
                    onVer={() => onVer(vigente)}
                    onNueva={() => onEditar({ nueva: true, app, plataforma: plataforma.clave })}
                />
            )}
        </article>
    )
}

const Detalle = ({
    v,
    hayBorrador,
    onEditar,
    onVer,
    onNueva,
}: {
    v: AdminVersionApp
    hayBorrador: boolean
    onEditar: () => void
    onVer: () => void
    onNueva: () => void
}) => {
    const guardar = useGuardarVersion(v)
    const cambiar = (cambio: Parameters<typeof aPayload>[1], aviso: string) =>
        guardar.mutate(aPayload(v, cambio), {
            onSuccess: () => toast.success(aviso),
            onError: (e) => toast.error(mensajeDeError(e, 'No se pudo guardar el cambio.')),
        })

    return (
        <div className="mt-3 flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="text-4xl font-semibold tracking-tight tabular-nums">
                    {v.version}
                    <span className="ml-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">versión {v.publicada ? 'actual' : 'en borrador'}</span>
                </p>
                <button
                    type="button"
                    disabled={guardar.isPending}
                    onClick={() => cambiar({ obligatoria: !v.obligatoria }, v.obligatoria ? 'Ya no es obligatoria.' : 'Ahora es obligatoria.')}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                        v.obligatoria ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                    aria-pressed={v.obligatoria}
                    title="Cambiar entre obligatoria y opcional"
                >
                    {v.obligatoria ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                    {v.obligatoria ? 'Obligatoria' : 'Opcional'}
                </button>
            </div>

            <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                    <dt className="text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">Aviso</dt>
                    <dd className="mt-1 font-medium">{v.titulo}</dd>
                    {v.subtitulo && <dd className="text-xs text-muted-foreground">{v.subtitulo}</dd>}
                </div>
                <div>
                    <dt className="text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">Mejoras</dt>
                    <dd className="mt-1 font-medium">{v.mejoras.length === 0 ? 'Ninguna' : `${v.mejoras.length} en el aviso`}</dd>
                </div>
                <div>
                    <dt className="text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">Última actualización</dt>
                    <dd className="mt-1 font-medium">{fechaHora(v.updatedAt)}</dd>
                    <dd className="text-xs text-muted-foreground">{haceCuanto(v.updatedAt)}</dd>
                </div>
                <div>
                    <dt className="text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">Imagen de cabecera</dt>
                    <dd className="mt-1">
                        {v.imagen ? (
                            <a href={v.imagen} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                                <ImageIcon className="size-4" /> Ver imagen
                            </a>
                        ) : (
                            <span className="text-muted-foreground">Sin imagen</span>
                        )}
                    </dd>
                </div>
            </dl>

            <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-4">
                <Button variant="outline" size="sm" onClick={onEditar}><Pencil /> Editar</Button>
                {v.publicada ? (
                    <Button variant="outline" size="sm" disabled={guardar.isPending} onClick={() => cambiar({ publicada: false }, 'Versión despublicada.')}>
                        {guardar.isPending && <Loader2 className="animate-spin" />} Despublicar
                    </Button>
                ) : (
                    <Button size="sm" disabled={guardar.isPending || !v.urlTienda} title={v.urlTienda ? undefined : 'Falta el enlace de la tienda'} onClick={() => cambiar({ publicada: true }, 'Versión publicada.')}>
                        {guardar.isPending ? <Loader2 className="animate-spin" /> : <Rocket />} Publicar versión
                    </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onNueva}><Plus /> {hayBorrador ? 'Otra versión' : 'Nueva versión'}</Button>
                <Button size="sm" className="ml-auto" onClick={onVer}><Eye /> Vista previa</Button>
            </div>
        </div>
    )
}
