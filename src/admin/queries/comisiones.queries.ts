import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    getComisionesPasarela,
    guardarComisionPasarela,
    type ComisionPayload,
} from '../actions/finanzas/comisionesPasarela.actions'
import type { ComisionPasarela } from '../interfaces/comisionPasarela.interface'
import { finanzasKeys } from './finanzas.queries'
import { invalidar, STALE_CATALOGO, type OpcionesMutacion } from './shared'

export const comisionesKeys = {
    all: ['admin', 'comisiones-pasarela'] as const,
    list: () => [...comisionesKeys.all, 'list'] as const,
}

export const comisionesQueryOptions = () =>
    queryOptions({
        queryKey: comisionesKeys.list(),
        queryFn: ({ signal }) => getComisionesPasarela(signal),
        staleTime: STALE_CATALOGO,
    })

export const useComisiones = () => useQuery(comisionesQueryOptions())

export const useGuardarComision = (
    proveedor: string,
    opciones?: OpcionesMutacion<ComisionPasarela, ComisionPayload>
) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: (payload: ComisionPayload) => guardarComisionPasarela(proveedor, payload),
        onSuccess: async (...args) => {
            // La comisión estimada de todos los meses depende de esta tarifa.
            await invalidar(queryClient, comisionesKeys.list(), finanzasKeys.all)
            return opciones?.onSuccess?.(...args)
        },
    })
}
