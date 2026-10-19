import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    cambiarActivoAgente,
    crearAgente,
    desvincularAgente,
    getAgentes,
    promoverAgente,
    restablecerContraseniaAgente,
    vincularAgente,
} from '../actions/prospectos/agentes.actions'
import type { AdminAgente, AgentePayload } from '../interfaces/prospectos.interface'
import { prospectosKeys } from './prospectos.queries'
import { invalidar, type OpcionesMutacion } from './shared'

export const agentesKeys = {
    all: ['admin', 'agentes'] as const,
    list: () => [...agentesKeys.all, 'list'] as const,
}

export const agentesQueryOptions = () =>
    queryOptions({
        queryKey: agentesKeys.list(),
        queryFn: ({ signal }) => getAgentes(signal),
    })

export const useAgentes = () => useQuery(agentesQueryOptions())

/** Tras cualquier cambio la lista se repide: el servidor es quien sabe si una cuenta quedó activa. */
const useInvalidarAgentes = () => {
    const queryClient = useQueryClient()
    // Un agente nuevo o dado de baja también mueve los filtros y los conteos de prospectos.
    return () => invalidar(queryClient, agentesKeys.list(), prospectosKeys.resumen())
}

export const useCrearAgente = (opciones?: OpcionesMutacion<AdminAgente, AgentePayload>) => {
    const invalidarAgentes = useInvalidarAgentes()
    return useMutation({
        ...opciones,
        mutationFn: crearAgente,
        onSuccess: async (...args) => {
            await invalidarAgentes()
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const usePromoverAgente = (opciones?: OpcionesMutacion<AdminAgente, string>) => {
    const invalidarAgentes = useInvalidarAgentes()
    return useMutation({
        ...opciones,
        mutationFn: promoverAgente,
        onSuccess: async (...args) => {
            await invalidarAgentes()
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const useCambiarActivoAgente = (opciones?: OpcionesMutacion<AdminAgente, { userId: string; activo: boolean }>) => {
    const invalidarAgentes = useInvalidarAgentes()
    return useMutation({
        ...opciones,
        mutationFn: ({ userId, activo }: { userId: string; activo: boolean }) => cambiarActivoAgente(userId, activo),
        onSuccess: async (...args) => {
            await invalidarAgentes()
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const useRestablecerContraseniaAgente = (
    opciones?: OpcionesMutacion<void, { userId: string; contrasenia: string }>
) =>
    useMutation({
        ...opciones,
        mutationFn: ({ userId, contrasenia }: { userId: string; contrasenia: string }) =>
            restablecerContraseniaAgente(userId, contrasenia),
    })

export const useVincularAgente = (opciones?: OpcionesMutacion<AdminAgente, { userId: string; companeroId: string }>) => {
    const invalidarAgentes = useInvalidarAgentes()
    return useMutation({
        ...opciones,
        mutationFn: ({ userId, companeroId }: { userId: string; companeroId: string }) => vincularAgente(userId, companeroId),
        onSuccess: async (...args) => {
            await invalidarAgentes()
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const useDesvincularAgente = (opciones?: OpcionesMutacion<AdminAgente, string>) => {
    const invalidarAgentes = useInvalidarAgentes()
    return useMutation({
        ...opciones,
        mutationFn: desvincularAgente,
        onSuccess: async (...args) => {
            await invalidarAgentes()
            return opciones?.onSuccess?.(...args)
        },
    })
}
