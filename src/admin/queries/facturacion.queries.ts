import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    getConsumoTimbres,
    getCostosTimbres,
    getProveedoresFacturacion,
    putProveedorFacturacion,
} from '../actions/facturacion/facturacion.actions'
import type { ActualizarProveedorPayload, ProveedorFacturacion } from '../interfaces/facturacion.interface'
import { invalidar, type OpcionesMutacion } from './shared'

export const facturacionKeys = {
    all: ['admin', 'facturacion'] as const,
    consumo: (periodo: string | undefined, q: string, pagina: number) =>
        [...facturacionKeys.all, 'consumo', periodo ?? 'actual', q, pagina] as const,
    costos: (periodo: string | undefined) => [...facturacionKeys.all, 'costos', periodo ?? 'actual'] as const,
    proveedores: () => [...facturacionKeys.all, 'proveedores'] as const,
}

export const useConsumoTimbres = (periodo: string | undefined, q: string, pagina: number) =>
    useQuery({
        queryKey: facturacionKeys.consumo(periodo, q, pagina),
        queryFn: ({ signal }) => getConsumoTimbres(periodo, q, pagina, signal),
        placeholderData: keepPreviousData,
    })

export const useCostosTimbres = (periodo: string | undefined) =>
    useQuery(
        queryOptions({
            queryKey: facturacionKeys.costos(periodo),
            queryFn: ({ signal }) => getCostosTimbres(periodo, signal),
        })
    )

export const useProveedoresFacturacion = () =>
    useQuery({ queryKey: facturacionKeys.proveedores(), queryFn: ({ signal }) => getProveedoresFacturacion(signal) })

/** Cambiar ambiente o tarifa mueve también los costos estimados y el consumo. */
export const useActualizarProveedor = (
    codigo: string,
    opciones?: OpcionesMutacion<ProveedorFacturacion, ActualizarProveedorPayload>
) => {
    const queryClient = useQueryClient()
    return useMutation({
        ...opciones,
        mutationFn: (payload: ActualizarProveedorPayload) => putProveedorFacturacion(codigo, payload),
        onSuccess: async (...args) => {
            await invalidar(queryClient, facturacionKeys.all)
            return opciones?.onSuccess?.(...args)
        },
    })
}
