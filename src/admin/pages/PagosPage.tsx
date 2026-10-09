import { Download, Loader2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PageHeader } from '../components/PageHeader'
import { Pildora } from '../components/EstadoBadge'
import type { EstadoPago, PagosFiltros } from '../interfaces/pago.interface'
import { useComisiones } from '../queries/comisiones.queries'
import { useEmpresasOpciones } from '../queries/empresas.queries'
import { useExportarPagos, usePagos } from '../queries/pagos.queries'
import { aCsv, descargarCsv } from '../utils/csv'
import { dinero, fechaCorta } from '../utils/formato'

const ESTADOS_PAGO: EstadoPago[] = ['PENDIENTE', 'PAGADO', 'EXPIRADO', 'FALLIDO', 'REEMBOLSADO']

const ESTADO_PAGO_LABEL: Record<EstadoPago, string> = {
    PENDIENTE: 'Pendiente',
    PAGADO: 'Pagado',
    EXPIRADO: 'Expirado',
    FALLIDO: 'Fallido',
    REEMBOLSADO: 'Reembolsado',
}

const ESTADO_PAGO_COLOR: Record<EstadoPago, string> = {
    PENDIENTE: 'bg-warning/15 text-warning',
    PAGADO: 'bg-success/15 text-success',
    EXPIRADO: 'bg-muted text-muted-foreground',
    FALLIDO: 'bg-destructive/15 text-destructive',
    REEMBOLSADO: 'bg-secondary text-secondary-foreground',
}

/** `yyyy-MM-dd` del selector → instante en la zona del navegador (inicio o fin del día). */
const inicioDelDia = (fecha: string) => new Date(`${fecha}T00:00:00`).toISOString()
const finDelDia = (fecha: string) => new Date(`${fecha}T23:59:59.999`).toISOString()

export const PagosPage = () => {
    const [params, setParams] = useSearchParams()
    const empresaId = params.get('empresaId') ?? ''
    const proveedor = params.get('proveedor') ?? ''
    const estado = (params.get('estado') as EstadoPago | null) ?? undefined
    const desde = params.get('desde') ?? ''
    const hasta = params.get('hasta') ?? ''
    const pagina = Number(params.get('pagina') ?? 0)

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

    const filtros: PagosFiltros = {
        empresaId: empresaId ? Number(empresaId) : undefined,
        proveedor: proveedor || undefined,
        estado,
        desde: desde ? inicioDelDia(desde) : undefined,
        hasta: hasta ? finDelDia(hasta) : undefined,
    }

    const rangoInvertido = !!desde && !!hasta && desde > hasta

    // Opciones de los selects: las empresas (hasta 100, por nombre) y los
    // proveedores que tienen tarifa configurada.
    const { data: empresas } = useEmpresasOpciones()
    const { data: comisiones } = useComisiones()

    const { data, isLoading, isError, isFetching, refetch } = usePagos(filtros, pagina, !rangoInvertido)

    const proveedores = [...new Set([...(comisiones?.map((c) => c.proveedor) ?? []), ...(proveedor ? [proveedor] : [])])]

    const exportar = useExportarPagos({
        onSuccess: (pagos) => {
            const csv = aCsv(
                [
                    'Folio', 'Creado', 'Pagado', 'Empresa ID', 'Empresa', 'Plan', 'Proveedor', 'Método',
                    'Estado', 'Monto', 'Moneda', 'Referencia externa', 'Periodo inicio', 'Periodo fin',
                ],
                pagos.map((p) => [
                    p.folio, p.createdAt, p.pagadoAt, p.empresaId, p.empresa, p.planCodigo, p.proveedor,
                    p.metodo, p.estado, p.monto, p.moneda, p.referenciaExterna, p.periodoInicio, p.periodoFin,
                ])
            )
            descargarCsv(csv, `pagos-${new Date().toISOString().slice(0, 10)}.csv`)
            toast.success(`${pagos.length} pagos exportados.`)
        },
        onError: (error) => toast.error(error.message || 'No se pudo exportar.'),
    })

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Pagos"
                descripcion="Historial de cobros. Filtra y descarga lo que ves en CSV."
                accion={
                    <Button size="lg" variant="outline" onClick={() => exportar.mutate(filtros)} disabled={exportar.isPending || rangoInvertido}>
                        {exportar.isPending ? <Loader2 className="animate-spin" /> : <Download />}
                        Exportar CSV
                    </Button>
                }
            />

            <div className="surface grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Empresa
                    <select
                        className="field w-full text-foreground"
                        value={empresaId}
                        onChange={(e) => actualizar({ empresaId: e.target.value || undefined })}
                    >
                        <option value="">Todas</option>
                        {empresas?.map((e) => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                    </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Proveedor
                    <select
                        className="field w-full text-foreground"
                        value={proveedor}
                        onChange={(e) => actualizar({ proveedor: e.target.value || undefined })}
                    >
                        <option value="">Todos</option>
                        {proveedores.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Estado
                    <select
                        className="field w-full text-foreground"
                        value={estado ?? ''}
                        onChange={(e) => actualizar({ estado: e.target.value || undefined })}
                    >
                        <option value="">Todos</option>
                        {ESTADOS_PAGO.map((e) => <option key={e} value={e}>{ESTADO_PAGO_LABEL[e]}</option>)}
                    </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Desde
                    <input type="date" className="field w-full text-foreground" value={desde} max={hasta || undefined}
                        onChange={(e) => actualizar({ desde: e.target.value || undefined })} />
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Hasta
                    <input type="date" className="field w-full text-foreground" value={hasta} min={desde || undefined}
                        onChange={(e) => actualizar({ hasta: e.target.value || undefined })} />
                </label>
            </div>

            {rangoInvertido && (
                <p role="alert" className="text-sm text-destructive">La fecha inicial es posterior a la final.</p>
            )}

            {isError && !data ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudieron cargar los pagos.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            ) : (
                <div className={cn('surface overflow-x-auto transition-opacity', isFetching && 'opacity-70')}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Folio</th>
                                <th>Fecha</th>
                                <th>Empresa</th>
                                <th>Plan</th>
                                <th>Proveedor</th>
                                <th>Estado</th>
                                <th className="text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Cargando pagos…</td></tr>
                            )}
                            {data?.contenido.length === 0 && (
                                <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">
                                    Ningún pago coincide con los filtros.
                                </td></tr>
                            )}
                            {data?.contenido.map((p) => (
                                <tr key={p.id} className="hover:bg-muted/50">
                                    <td className="font-mono text-xs">{p.folio}</td>
                                    <td>{fechaCorta(p.pagadoAt ?? p.createdAt)}</td>
                                    <td>
                                        <Link to={`/empresas/${p.empresaId}`} className="hover:underline">{p.empresa}</Link>
                                    </td>
                                    <td>{p.planCodigo ?? '—'}</td>
                                    <td>{[p.proveedor, p.metodo].filter(Boolean).join(' · ') || '—'}</td>
                                    <td><Pildora className={ESTADO_PAGO_COLOR[p.estado]}>{ESTADO_PAGO_LABEL[p.estado]}</Pildora></td>
                                    <td className="text-right tabular-nums">{dinero(p.monto, p.moneda)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {data && data.totalPaginas > 1 && (
                <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
                    <span>Página {data.pagina + 1} de {data.totalPaginas} · {data.totalElementos} pagos</span>
                    <Button variant="outline" size="sm" disabled={pagina === 0}
                        onClick={() => actualizar({ pagina: String(pagina - 1) })}>Anterior</Button>
                    <Button variant="outline" size="sm" disabled={data.esUltima}
                        onClick={() => actualizar({ pagina: String(pagina + 1) })}>Siguiente</Button>
                </div>
            )}
        </div>
    )
}
