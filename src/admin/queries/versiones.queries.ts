import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crearVersion, editarVersion, eliminarVersion, getVersiones } from '../actions/versiones/versiones.actions'
import type { AdminVersionApp, VersionAppPayload } from '../interfaces/versionApp.interface'
import { invalidar, type OpcionesMutacion } from './shared'

export const versionesKeys = {
    all: ['admin', 'versiones-app'] as const,
    list: () => [...versionesKeys.all, 'list'] as const,
}

export const versionesQueryOptions = () =>
    queryOptions({
        queryKey: versionesKeys.list(),
        queryFn: ({ signal }) => getVersiones(signal),
    })

export const useVersiones = () => useQuery(versionesQueryOptions())

/** Crea la versión, o la edita si se pasa una: el formulario es el mismo. */
export const useGuardarVersion = (
    version: AdminVersionApp | null,
    opciones?: OpcionesMutacion<AdminVersionApp, VersionAppPayload>
) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: (payload: VersionAppPayload) => (version ? editarVersion(version.id, payload) : crearVersion(payload)),
        onSuccess: async (...args) => {
            await invalidar(queryClient, versionesKeys.list())
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const useEliminarVersion = (opciones?: OpcionesMutacion<void, number>) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: (id: number) => eliminarVersion(id),
        onSuccess: async (...args) => {
            await invalidar(queryClient, versionesKeys.list())
            return opciones?.onSuccess?.(...args)
        },
    })
}
