import { useState, type FormEvent } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ApiError, mensajeDeError } from '@/api/apiError'
import type { AdminVersionApp, MejoraVersion, PlataformaApp, VersionAppPayload } from '../interfaces/versionApp.interface'
import { CampoImagen } from './CampoImagen'
import { useEliminarVersion, useGuardarVersion } from '../queries/versiones.queries'

const inputClass =
    'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 aria-invalid:border-destructive'

type Campo = 'app' | 'plataforma' | 'version' | 'titulo' | 'subtitulo' | 'imagen' | 'urlTienda' | 'mejoras'

const CAMPO_DEL_CODIGO: Partial<Record<string, Campo>> = {
    APP_INVALIDA: 'app',
    PLATAFORMA_INVALIDA: 'plataforma',
    VERSION_INVALIDA: 'version',
    VERSION_DUPLICADA: 'version',
    TITULO_INVALIDO: 'titulo',
    SUBTITULO_INVALIDO: 'subtitulo',
    IMAGEN_INVALIDA: 'imagen',
    URL_TIENDA_INVALIDA: 'urlTienda',
    MEJORAS_INVALIDAS: 'mejoras',
}

/** Alta; la app y la plataforma pueden venir ya puestas (la tarjeta desde la que se abrió). */
export interface NuevaVersion {
    nueva: true
    app?: string
    plataforma?: PlataformaApp
}

interface Props {
    /** `null` cerrado; `NuevaVersion` alta; una versión, edición. */
    version: AdminVersionApp | NuevaVersion | null
    onClose: () => void
}

/** Cuerpo de un PUT con la misma versión y un cambio. */
export const aPayload = (v: AdminVersionApp, cambio: Partial<VersionAppPayload>): VersionAppPayload => ({
    obligatoria: v.obligatoria,
    titulo: v.titulo,
    subtitulo: v.subtitulo,
    imagen: v.imagen,
    urlTienda: v.urlTienda,
    mejoras: v.mejoras,
    publicada: v.publicada,
    ...cambio,
})

export const VersionAppDialog = ({ version, onClose }: Props) => (
    <Dialog open={version !== null} onOpenChange={(abierto) => !abierto && onClose()}>
        <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
            {version && <Formulario version={'nueva' in version ? null : version} previa={'nueva' in version ? version : undefined} onClose={onClose} />}
        </DialogContent>
    </Dialog>
)

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

const esUrl = (s: string) => /^https?:\/\/\S+$/i.test(s.trim())

const Formulario = ({ version, previa, onClose }: { version: AdminVersionApp | null; previa?: NuevaVersion; onClose: () => void }) => {
    const esEdicion = version !== null

    const [app, setApp] = useState(version?.app ?? previa?.app ?? '')
    const [plataforma, setPlataforma] = useState<PlataformaApp>(version?.plataforma ?? previa?.plataforma ?? 'ANDROID')
    const [numero, setNumero] = useState(version?.version ?? '')
    const [obligatoria, setObligatoria] = useState(version?.obligatoria ?? false)
    const [titulo, setTitulo] = useState(version?.titulo ?? '')
    const [subtitulo, setSubtitulo] = useState(version?.subtitulo ?? '')
    const [imagen, setImagen] = useState(version?.imagen ?? '')
    const [urlTienda, setUrlTienda] = useState(version?.urlTienda ?? '')
    const [mejoras, setMejoras] = useState<MejoraVersion[]>(version?.mejoras ?? [])
    const [publicada, setPublicada] = useState(version?.publicada ?? false)

    const problema = (() => {
        if (!esEdicion && !app.trim()) return 'Escribe la clave de la app.'
        if (!esEdicion && !/^\d{1,5}(\.\d{1,5}){0,3}$/.test(numero.trim())) return 'La versión son números separados por punto, como 1.0.25.'
        if (!titulo.trim()) return 'Escribe el título del aviso.'
        if (urlTienda.trim() && !esUrl(urlTienda)) return 'El enlace de la tienda debe empezar con http:// o https://.'
        if (publicada && !urlTienda.trim()) return 'Para publicar, indica el enlace de la tienda.'
        if (mejoras.some((m) => !m.titulo.trim())) return 'Cada mejora necesita un título.'
        return null
    })()

    const guardar = useGuardarVersion(version, {
        onSuccess: () => {
            toast.success(esEdicion ? 'Versión actualizada.' : 'Versión creada.')
            onClose()
        },
    })
    const eliminar = useEliminarVersion({
        onSuccess: () => {
            toast.success('Borrador eliminado.')
            onClose()
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (problema) return
        guardar.mutate({
            // La clave de la versión es inmutable: en edición ni se manda.
            ...(esEdicion ? {} : { app: app.trim(), plataforma, version: numero.trim() }),
            obligatoria,
            titulo: titulo.trim(),
            subtitulo: subtitulo.trim() || null,
            imagen: imagen.trim() || null,
            urlTienda: urlTienda.trim() || null,
            mejoras: mejoras.map((m) => ({
                titulo: m.titulo.trim(),
                descripcion: m.descripcion?.trim() || null,
                icono: m.icono?.trim() || null,
            })),
            publicada,
        })
    }

    const campoConError = guardar.error instanceof ApiError ? CAMPO_DEL_CODIGO[guardar.error.code] : undefined
    const errorDeCampo = (campo: Campo) =>
        campoConError === campo && guardar.error instanceof ApiError ? guardar.error.message : undefined
    const errorGeneral = guardar.error && !campoConError ? mensajeDeError(guardar.error, 'No se pudo guardar la versión.') : null
    const errorAlBorrar = eliminar.error ? mensajeDeError(eliminar.error, 'No se pudo eliminar el borrador.') : null

    const cambiarMejora = (i: number, cambio: Partial<MejoraVersion>) =>
        setMejoras((lista) => lista.map((m, j) => (j === i ? { ...m, ...cambio } : m)))

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
                <DialogTitle>{esEdicion ? `Editar ${version.app} ${version.version}` : 'Nueva versión de una app'}</DialogTitle>
                <DialogDescription>
                    Publícala cuando ya esté disponible en la tienda: las apps que corran una versión menor mostrarán este aviso.
                </DialogDescription>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <Etiqueta
                    etiqueta="App"
                    ayuda={esEdicion ? 'No se puede cambiar.' : 'Clave de la app.'}
                    error={errorDeCampo('app')}
                >
                    <input
                        className={inputClass}
                        value={app}
                        disabled={esEdicion || !!previa?.app}
                        maxLength={32}
                        aria-invalid={!!errorDeCampo('app')}
                        onChange={(e) => setApp(e.target.value.toUpperCase())}
                    />
                </Etiqueta>
                <Etiqueta etiqueta="Plataforma" error={errorDeCampo('plataforma')}>
                    <select
                        className={inputClass}
                        value={plataforma}
                        disabled={esEdicion || !!previa?.plataforma}
                        onChange={(e) => setPlataforma(e.target.value as PlataformaApp)}
                    >
                        <option value="ANDROID">Android</option>
                        <option value="IOS">iOS</option>
                    </select>
                </Etiqueta>
                <Etiqueta etiqueta="Versión" error={errorDeCampo('version')}>
                    <input
                        className={inputClass}
                        value={numero}
                        disabled={esEdicion}
                        maxLength={32}
                        placeholder="1.0.25"
                        aria-invalid={!!errorDeCampo('version')}
                        onChange={(e) => setNumero(e.target.value)}
                    />
                </Etiqueta>
            </div>

            <Etiqueta etiqueta="Título" error={errorDeCampo('titulo')}>
                <input
                    className={inputClass}
                    value={titulo}
                    maxLength={120}
                    placeholder="Nueva versión disponible"
                    aria-invalid={!!errorDeCampo('titulo')}
                    onChange={(e) => setTitulo(e.target.value)}
                />
            </Etiqueta>
            <Etiqueta etiqueta="Subtítulo" error={errorDeCampo('subtitulo')}>
                <textarea
                    className={`${inputClass} h-20 py-2`}
                    value={subtitulo}
                    maxLength={300}
                    aria-invalid={!!errorDeCampo('subtitulo')}
                    onChange={(e) => setSubtitulo(e.target.value)}
                />
            </Etiqueta>
            <div className="space-y-1.5">
                <p className="text-sm font-medium">Imagen de cabecera</p>
                <CampoImagen tipo="CABECERA" valor={imagen} onChange={setImagen} error={errorDeCampo('imagen')} />
            </div>
            <Etiqueta etiqueta="Enlace de la tienda" ayuda="Google Play o App Store." error={errorDeCampo('urlTienda')}>
                <input className={inputClass} value={urlTienda} aria-invalid={!!errorDeCampo('urlTienda')} onChange={(e) => setUrlTienda(e.target.value)} />
            </Etiqueta>

            <fieldset className="space-y-2">
                <div className="flex items-center justify-between">
                    <legend className="text-sm font-medium">Mejoras</legend>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={mejoras.length >= 10}
                        onClick={() => setMejoras((l) => [...l, { titulo: '', descripcion: '', icono: '' }])}
                    >
                        <Plus /> Agregar
                    </Button>
                </div>
                {mejoras.length === 0 && <p className="text-xs text-muted-foreground">Sin mejoras: el aviso sólo mostrará el título.</p>}
                {mejoras.map((m, i) => (
                    <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto]">
                        <div className="space-y-2">
                            <input className={inputClass} placeholder="Título" value={m.titulo} onChange={(e) => cambiarMejora(i, { titulo: e.target.value })} />
                            <input className={inputClass} placeholder="Descripción" value={m.descripcion ?? ''} onChange={(e) => cambiarMejora(i, { descripcion: e.target.value })} />
                            <CampoImagen compacto tipo="ICONO" valor={m.icono ?? ''} onChange={(url) => cambiarMejora(i, { icono: url })} />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Quitar mejora"
                            onClick={() => setMejoras((l) => l.filter((_, j) => j !== i))}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                ))}
                {errorDeCampo('mejoras') && <p role="alert" className="text-xs text-destructive">{errorDeCampo('mejoras')}</p>}
            </fieldset>

            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4 accent-primary" checked={obligatoria} onChange={(e) => setObligatoria(e.target.checked)} />
                    Actualización obligatoria
                    <span className="text-xs text-muted-foreground">(la app no deja seguir sin actualizar)</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4 accent-primary" checked={publicada} onChange={(e) => setPublicada(e.target.checked)} />
                    Publicada
                    <span className="text-xs text-muted-foreground">(sin marcar es borrador: ninguna app la ve)</span>
                </label>
            </div>

            {(errorGeneral ?? errorAlBorrar ?? (!guardar.error ? problema : null)) && (
                <p role="alert" className={errorGeneral || errorAlBorrar ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
                    {errorGeneral ?? errorAlBorrar ?? problema}
                </p>
            )}

            <div className="flex justify-between gap-2">
                <div>
                    {esEdicion && !version.publicada && (
                        <Button type="button" variant="outline" disabled={eliminar.isPending} onClick={() => eliminar.mutate(version.id)}>
                            {eliminar.isPending && <Loader2 className="animate-spin" />}
                            Eliminar borrador
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={problema !== null || guardar.isPending}>
                        {guardar.isPending && <Loader2 className="animate-spin" />}
                        {esEdicion ? 'Guardar cambios' : 'Crear versión'}
                    </Button>
                </div>
            </div>
        </form>
    )
}
