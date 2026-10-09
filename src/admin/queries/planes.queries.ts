import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPlanes } from '../actions/planes/getPlanes.action'
import { crearPlan, editarPlan, getModulosPlan } from '../actions/planes/planes.actions'
import type { AdminPlan, PlanPayload } from '../interfaces/plan.interface'
import { empresasKeys } from './empresas.queries'
import { invalidar, STALE_CATALOGO, type OpcionesMutacion } from './shared'

export const planesKeys = {
    all: ['admin', 'planes'] as const,
    list: () => [...planesKeys.all, 'list'] as const,
    /** Catálogo de módulos que se pueden asignar a un plan. */
    modulos: () => [...planesKeys.all, 'modulos'] as const,
}

export const planesQueryOptions = () =>
    queryOptions({
        queryKey: planesKeys.list(),
        queryFn: ({ signal }) => getPlanes(signal),
        staleTime: STALE_CATALOGO,
    })

export const modulosPlanQueryOptions = () =>
    queryOptions({
        queryKey: planesKeys.modulos(),
        queryFn: ({ signal }) => getModulosPlan(signal),
        staleTime: Infinity,
    })

export const usePlanes = () => useQuery(planesQueryOptions())

export const useModulosPlan = () => useQuery(modulosPlanQueryOptions())

/** Crea el plan, o lo edita si se pasa uno: el formulario es el mismo. */
export const useGuardarPlan = (plan: AdminPlan | null, opciones?: OpcionesMutacion<AdminPlan, PlanPayload>) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: (payload: PlanPayload) => (plan ? editarPlan(plan.id, payload) : crearPlan(payload)),
        onSuccess: async (...args) => {
            // Las empresas muestran el nombre y los topes de su plan.
            await invalidar(queryClient, planesKeys.list(), empresasKeys.all)
            return opciones?.onSuccess?.(...args)
        },
    })
}
