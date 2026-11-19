import { useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { mensajeDeError } from '@/api/apiError'
import { PageHeader } from '../components/PageHeader'
import { Pildora } from '../components/EstadoBadge'
import { StatTile } from '../components/StatTile'
import { inputClass } from '../components/Campo'
import type { AmbienteFacturacion, ProveedorFacturacion } from '../interfaces/facturacion.interface'
import {
    useActualizarProveedor,
    useConsumoTimbres,
    useCostosTimbres,
    useProveedoresFacturacion,
} from '../queries/facturacion.queries'
import { dinero } from '../utils/formato'

/** `YYYY-MM` del mes actual en hora de México. */
const mesActual = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7)

const ProveedorTarjeta = ({ proveedor }: { proveedor: ProveedorFacturacion }) => {
    const [ambiente, setAmbiente] = useState<AmbienteFacturacion>(proveedor.ambiente)
    const [costo, setCosto] = useState(String(proveedor.costoTimbre))
    const mutation = useActualizarProveedor(proveedor.codigo, {
        onSuccess: () => toast.success('Proveedor actualizado.'),
        onError: (e) => toast.error(mensajeDeError(e, 'No se pudo actualizar el proveedor.') ?? 'No se pudo actualizar el proveedor.'),
    })

    const costoNum = Number(costo)
    const costoValido = costo.trim() !== '' && costoNum >= 0
    const cambio = ambiente !== proveedor.ambiente || costoNum !== proveedor.costoTimbre

    return (
        <div className="surface space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">{proveedor.codigo}</h2>
                {proveedor.esDefault && <Pildora className="bg-primary/10 text-primary">Predeterminado</Pildora>}
                {proveedor.configurado ? (
                    <Pildora className="bg-success/15 text-success">Con credenciales</Pildora>
                ) : (
                    <Pildora className="bg-destructive/10 text-destructive">Sin credenciales</Pildora>
                )}
            </div>
            {!proveedor.configurado && (
                <p className="text-sm text-muted-foreground">
                    Faltan las llaves del proveedor en el servidor (FACTURAPI_USER_KEY): ninguna empresa podrá facturar.
                </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium">
                    Ambiente
                    <select className={inputClass} value={ambiente} onChange={(e) => setAmbiente(e.target.value as AmbienteFacturacion)}>
                        <option value="SANDBOX">Pruebas (sin valor fiscal)</option>
                        <option value="PRODUCCION">Producción</option>
                    </select>
                </label>
                <label className="space-y-1 text-sm font-medium">
                    Costo estimado por timbre (MXN)
                    <input className={inputClass} inputMode="decimal" value={costo} onChange={(e) => setCosto(e.target.value)} />
                </label>
            </div>
            {ambiente === 'PRODUCCION' && proveedor.ambiente !== 'PRODUCCION' && (
                <p className="text-sm text-warning">
                    Pasar a producción hace que las facturas nuevas tengan valor fiscal. Cada empresa debe tener su CSD real cargado.
                </p>
            )}
            <Button
                disabled={!cambio || !costoValido || mutation.isPending}
                onClick={() =>
                    mutation.mutate({
                        ambiente: ambiente !== proveedor.ambiente ? ambiente : undefined,
                        costoTimbre: costoNum !== proveedor.costoTimbre ? costoNum : undefined,
                    })
                }
            >
                {mutation.isPending && <Loader2 className="animate-spin" />} Guardar
            </Button>
        </div>
    )
}

export const FacturacionPage = () => {
    const [periodo, setPeriodo] = useState(mesActual())
    const [busqueda, setBusqueda] = useState('')
    const [pagina, setPagina] = useState(0)

    const consumo = useConsumoTimbres(periodo, busqueda, pagina)
    const costos = useCostosTimbres(periodo)
    const proveedores = useProveedoresFacturacion()

    const totalPaginas = consumo.data ? Math.max(1, Math.ceil(consumo.data.empresasConConsumo / consumo.data.tamano)) : 1

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Facturación"
                descripcion="Timbres consumidos por empresa, su costo estimado y el proveedor de timbrado. Los topes por plan se editan en Planes."
                accion={
                    <input type="month" className={`${inputClass} w-44`} aria-label="Mes" value={periodo} max={mesActual()}
                        onChange={(e) => { setPeriodo(e.target.value || mesActual()); setPagina(0) }} />
                }
            />

            <section className="grid gap-3 sm:grid-cols-3">
                <StatTile etiqueta="Timbres del mes" valor={(costos.data?.timbres ?? 0).toLocaleString('es-MX')} />
                <StatTile etiqueta="Costo estimado" valor={dinero(costos.data?.costoEstimado ?? 0)} />
                <StatTile etiqueta="Costo por timbre" valor={dinero(costos.data?.costoPorTimbre ?? 0)} />
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-semibold">Proveedor</h2>
                {proveedores.isError ? (
                    <p className="text-sm text-destructive">No se pudo cargar el proveedor.</p>
                ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                        {proveedores.data?.map((p) => <ProveedorTarjeta key={`${p.codigo}-${p.ambiente}-${p.costoTimbre}`} proveedor={p} />)}
                    </div>
                )}
            </section>

            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-semibold">Consumo por empresa</h2>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                        <input className={`${inputClass} w-64 pl-9`} placeholder="Buscar empresa" value={busqueda}
                            onChange={(e) => { setBusqueda(e.target.value); setPagina(0) }} />
                    </div>
                </div>
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th className="text-right">Timbres</th>
                                <th className="text-right">Tope del plan</th>
                                <th className="text-right">Costo estimado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumo.isLoading && <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">Cargando…</td></tr>}
                            {consumo.isError && <tr><td colSpan={4} className="py-10 text-center text-destructive">No se pudo cargar el consumo.</td></tr>}
                            {consumo.data?.empresas.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">Ninguna empresa timbró en este mes.</td></tr>}
                            {consumo.data?.empresas.map((e) => (
                                <tr key={e.empresaId}>
                                    <td className="font-medium">{e.nombre}</td>
                                    <td className="text-right tabular-nums">{e.timbres.toLocaleString('es-MX')}</td>
                                    <td className="text-right tabular-nums">
                                        {e.limite === null ? '∞' : e.limite.toLocaleString('es-MX')}
                                        {e.limite !== null && e.timbres >= e.limite && <Pildora className="ml-2 bg-destructive/10 text-destructive">Al tope</Pildora>}
                                    </td>
                                    <td className="text-right tabular-nums">{dinero(e.costoEstimado)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPaginas > 1 && (
                    <div className="flex items-center justify-end gap-2 text-sm">
                        <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>Anterior</Button>
                        <span className="text-muted-foreground">Página {pagina + 1} de {totalPaginas}</span>
                        <Button variant="outline" size="sm" disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</Button>
                    </div>
                )}
            </section>
        </div>
    )
}
