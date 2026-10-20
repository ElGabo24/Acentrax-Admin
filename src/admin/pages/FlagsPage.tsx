import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '../components/PageHeader'
import { Pildora } from '../components/EstadoBadge'
import { FlagDialog } from '../components/FlagDialog'
import type { AdminFeatureFlag } from '../interfaces/featureFlag.interface'
import { useFlags } from '../queries/flags.queries'
import { nombreDeFlag } from '../utils/flags'

export const FlagsPage = () => {
    const [cambiando, setCambiando] = useState<AdminFeatureFlag | null>(null)
    const { data, isLoading, isError, refetch } = useFlags()

    return (
        <div className="space-y-6">
            <PageHeader
                titulo="Interruptores"
                descripcion="Funciones que todavía no están al 100%. Apagadas, no se muestran en ninguna pantalla; al encenderlas aparecen para todos."
            />

            {isError ? (
                <div className="surface p-6 text-sm">
                    <p className="text-destructive">No se pudieron cargar los interruptores.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            ) : (
                <div className="surface overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Función</th>
                                <th>Estado</th>
                                <th className="text-right">Última vez</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">Cargando interruptores…</td></tr>
                            )}
                            {data?.map((f) => (
                                <tr key={f.clave}>
                                    <td>
                                        <div className="font-medium">{nombreDeFlag(f.clave)}</div>
                                        <div className="max-w-xl text-xs text-muted-foreground">{f.descripcion}</div>
                                        <div className="font-mono text-xs text-muted-foreground">{f.clave}</div>
                                    </td>
                                    <td>
                                        {f.habilitado
                                            ? <Pildora className="bg-success/15 text-success">Encendido</Pildora>
                                            : <Pildora className="bg-muted text-muted-foreground">Apagado</Pildora>}
                                    </td>
                                    <td className="text-right tabular-nums text-muted-foreground">
                                        {new Date(f.updatedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td className="text-right">
                                        <Button
                                            size="sm"
                                            variant={f.habilitado ? 'outline' : 'default'}
                                            onClick={() => setCambiando(f)}
                                        >
                                            {f.habilitado ? 'Apagar' : 'Encender'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <FlagDialog flag={cambiando} onClose={() => setCambiando(null)} />
        </div>
    )
}
