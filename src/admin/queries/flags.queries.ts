import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cambiarFlag, getFlags } from '../actions/flags/flags.actions'
import type { AdminFeatureFlag } from '../interfaces/featureFlag.interface'
import { invalidar, type OpcionesMutacion } from './shared'

export const flagsKeys = {
    all: ['admin', 'flags'] as const,
    list: () => [...flagsKeys.all, 'list'] as const,
}

export const flagsQueryOptions = () =>
    queryOptions({
        queryKey: flagsKeys.list(),
        queryFn: ({ signal }) => getFlags(signal),
    })

export const useFlags = () => useQuery(flagsQueryOptions())

export const useCambiarFlag = (
    opciones?: OpcionesMutacion<AdminFeatureFlag, { clave: string; habilitado: boolean }>
) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: ({ clave, habilitado }: { clave: string; habilitado: boolean }) => cambiarFlag(clave, habilitado),
        onSuccess: async (...args) => {
            await invalidar(queryClient, flagsKeys.list())
            return opciones?.onSuccess?.(...args)
        },
    })
}
