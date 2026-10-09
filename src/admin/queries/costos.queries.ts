import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { borrarCosto, crearCosto, editarCosto, getCostos, renovarCosto } from '../actions/finanzas/costos.actions'
import type {
    CostoOperativo,
    CostoPayload,
    RenovarCostoPayload,
    RenovarCostoResponse,
} from '../interfaces/costo.interface'
import { finanzasKeys } from './finanzas.queries'
import { invalidar, type OpcionesMutacion } from './shared'

export const costosKeys = {
    all: ['admin', 'costos'] as const,
    list: () => [...costosKeys.all, 'list'] as const,
}

export const costosQueryOptions = () =>
    queryOptions({
        queryKey: costosKeys.list(),
        queryFn: ({ signal }) => getCostos(signal),
    })

export const useCostos = () => useQuery(costosQueryOptions())

/**
 * Cualquier cambio en un gasto mueve la utilidad de los meses que cubre, así
 * que siempre se recargan también las finanzas.
 */
const useInvalidarCostos = () => {
    const queryClient = useQueryClient()
    return () => invalidar(queryClient, costosKeys.list(), finanzasKeys.all)
}

/** Crea el gasto, o lo corrige si se pasa uno: el formulario es el mismo. */
export const useGuardarCosto = (costo: CostoOperativo | null, opciones?: OpcionesMutacion<CostoOperativo, CostoPayload>) => {
    const invalidarCostos = useInvalidarCostos()

    return useMutation({
        ...opciones,
        mutationFn: (payload: CostoPayload) => (costo ? editarCosto(costo.id, payload) : crearCosto(payload)),
        onSuccess: async (...args) => {
            await invalidarCostos()
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const useBorrarCosto = (opciones?: OpcionesMutacion<void, number>) => {
    const invalidarCostos = useInvalidarCostos()

    return useMutation({
        ...opciones,
        mutationFn: (id: number) => borrarCosto(id),
        onSuccess: async (...args) => {
            await invalidarCostos()
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const useRenovarCosto = (
    costoId: number,
    opciones?: OpcionesMutacion<RenovarCostoResponse, RenovarCostoPayload>
) => {
    const invalidarCostos = useInvalidarCostos()

    return useMutation({
        ...opciones,
        mutationFn: (payload: RenovarCostoPayload) => renovarCosto(costoId, payload),
        onSuccess: async (...args) => {
            await invalidarCostos()
            return opciones?.onSuccess?.(...args)
        },
    })
}
