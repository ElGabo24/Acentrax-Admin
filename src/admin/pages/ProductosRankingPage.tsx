import { useEffect, useState } from 'react'
import { Download, ImageOff, Search } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { getRanking } from '../actions/prospectos/prospectos.actions'
import { Pildora } from '../components/EstadoBadge'
import { PageHeader } from '../components/PageHeader'
import { useRanking } from '../queries/prospectos.queries'
import { aCsv, descargarCsv } from '../utils/csv'
import { dinero } from '../utils/formato'

const TAMANIO = 50

export const ProductosRankingPage = () => {
    const [params, setParams] = useSearchParams()
    const busqueda = params.get('q') ?? ''
    const soloSinFoto = params.get('sinFoto') === '1'
    const pagina = Number(params.get('pagina') ?? 0)
    const [texto, setTexto] = useState(busqueda)
    const [descargando, setDescargando] = useState(false)
    const [fotoGrande, setFotoGrande] = useState<{ url: string; nombre: string } | null>(null)

    const actualizar = (cambios: Record<string, string | undefined>) =>
        setParams(
            (previos) => {
                const nuevos = new URLSearchParams(previos)
                for (const [clave, valor] of Object.entries(cambios)) {
                    if (valor) nuevos.set(clave, valor)
                    else nuevos.delete(clave)
                }
                if (!('pagina' in cambios)) nuevos.delete('pagina')
                return nuevos
            },
            { replace: true }
        )

    // Debounce del buscador: no se pide en cada tecla.
    useEffect(() => {
        if (texto === busqueda) return
        const t = setTimeout(() => actualizar({ q: texto.trim() || undefined }), 300)
        return () => clearTimeout(t)
    })

    const { data, isLoading, isError, isFetching, refetch } = useRanking({
        q: busqueda || undefined,
        soloSinFoto: soloSinFoto || undefined,
        pagina,
        tamanio: TAMANIO,
    })

    /** Baja todo lo que coincide (hasta 2,000 renglones) como lista de trabajo para quien arregla las fotos. */
    const descargar = async () => {
        setDescargando(true)
        try {
            const filas: (string | number | null)[][] = []
            for (let p = 0; p < 20; p++) {
                const pag = await getRanking({ q: busqueda || undefined, soloSinFoto: soloSinFoto || undefined, pagina: p, tamanio: 100 })
                for (const r of pag.contenido) {
                    filas.push([
                        r.codigoBarras,
                        r.nombre,
                        r.negocios,
                        r.precioPromedio,
                        r.enCatalogo ? 'Sí' : 'No',
                        r.imagenUrl ? 'Sí' : 'No',
                    ])
                }
                if (pag.esUltima) break
            }
            descargarCsv(
                aCsv(['Código de barras', 'Producto', 'Negocios', 'Precio promedio', 'En el catálogo', 'Tiene foto'], filas),
                `productos-por-negocios-${new Date().toISOString().slice(0, 10)}.csv`
            )
        } catch {
            toast.error('No se pudo preparar la lista. Inténtalo de nuevo.')
        } finally {
            setDescargando(false)
        }
    }

    const chip = (activo: boolean) =>
        cn(
            'rounded-full border px-3 py-1 text-sm transition-colors',
            activo ? 'border-transparent bg-primary text-primary-foreground font-medium' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
        )

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Productos más repetidos"
                descripcion="Lo que los agentes cargan en más negocios. Es la lista de trabajo para las fotos: empieza por los de arriba que no tienen."
                accion={
                    <Button variant="outline" size="lg" disabled={descargando || !data?.totalElementos} onClick={() => void descargar()}>
                        <Download /> {descargando ? 'Preparando…' : 'Descargar lista'}
                    </Button>
                }
            />

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-56 flex-1 sm:max-w-sm">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Buscar por nombre o código"
                        aria-label="Buscar producto"
                        className="field w-full pl-8"
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                    />
                </div>
                <div className="flex gap-2" role="group" aria-label="Filtrar por foto">
                    <button type="button" className={chip(!soloSinFoto)} aria-pressed={!soloSinFoto} onClick={() => actualizar({ sinFoto: undefined })}>
                        Todos
                    </button>
                    <button type="button" className={chip(soloSinFoto)} aria-pressed={soloSinFoto} onClick={() => actualizar({ sinFoto: '1' })}>
                        Sin foto
                    </button>
                </div>
                {data && <span className="ml-auto text-sm text-muted-foreground">{data.totalElementos} productos</span>}
            </div>

            {isError && !data ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudo cargar el ranking.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            ) : (
                <div className={cn('surface overflow-x-auto transition-opacity', isFetching && 'opacity-70')}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="w-20">Foto</th>
                                <th>Producto</th>
                                <th className="text-right">Negocios</th>
                                <th className="text-right">Precio promedio</th>
                                <th>Catálogo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">Cargando productos…</td></tr>
                            )}
                            {data?.contenido.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                                        {busqueda || soloSinFoto ? 'Ningún producto coincide.' : 'Todavía no hay productos cargados por los agentes.'}
                                    </td>
                                </tr>
                            )}
                            {data?.contenido.map((p, i) => (
                                <tr key={p.clave}>
                                    <td>
                                        {p.imagenUrl ? (
                                            <button
                                                type="button"
                                                title="Ver la foto completa"
                                                aria-label={`Ver la foto de ${p.nombre}`}
                                                onClick={() => setFotoGrande({ url: p.imagenUrl!, nombre: p.nombre })}
                                                className="block cursor-zoom-in rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                            >
                                                <img src={p.imagenUrl} alt="" loading="lazy" className="size-16 rounded-md border bg-white object-contain p-0.5" />
                                            </button>
                                        ) : (
                                            <span className="flex size-16 items-center justify-center rounded-md border border-dashed text-muted-foreground" title="Sin foto">
                                                <ImageOff className="size-4" />
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="font-medium">
                                            <span className="mr-2 text-xs tabular-nums text-muted-foreground">{pagina * TAMANIO + i + 1}.</span>
                                            {p.nombre}
                                        </div>
                                        <div className="font-mono text-xs text-muted-foreground">{p.codigoBarras ?? 'sin código de barras'}</div>
                                    </td>
                                    <td className="text-right text-base font-semibold tabular-nums">{p.negocios}</td>
                                    <td className="text-right tabular-nums">{p.precioPromedio !== null ? dinero(p.precioPromedio) : '—'}</td>
                                    <td>
                                        {p.imagenUrl ? (
                                            <Pildora className="bg-success/15 text-success">Con foto</Pildora>
                                        ) : !p.enCatalogo ? (
                                            <Pildora className="bg-warning/15 text-warning">No está</Pildora>
                                        ) : (
                                            <Pildora className="bg-muted text-muted-foreground">Sin foto</Pildora>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {data && data.totalPaginas > 1 && (
                <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
                    <span>Página {data.pagina + 1} de {data.totalPaginas}</span>
                    <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => actualizar({ pagina: String(pagina - 1) })}>Anterior</Button>
                    <Button variant="outline" size="sm" disabled={data.esUltima} onClick={() => actualizar({ pagina: String(pagina + 1) })}>Siguiente</Button>
                </div>
            )}

            <Dialog open={fotoGrande !== null} onOpenChange={(abierto) => !abierto && setFotoGrande(null)}>
                <DialogContent className="max-w-xl">
                    <DialogTitle>{fotoGrande?.nombre}</DialogTitle>
                    <DialogDescription className="sr-only">Foto del producto en grande</DialogDescription>
                    {fotoGrande && (
                        <img src={fotoGrande.url} alt={fotoGrande.nombre} className="mx-auto max-h-[70vh] max-w-full rounded-md object-contain" />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
