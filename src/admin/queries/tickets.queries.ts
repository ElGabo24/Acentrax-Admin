import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ajustarTickets, getTickets } from '../actions/tickets/tickets.actions'
import type { AjusteTicketsPayload, TicketsEmpresa } from '../interfaces/tickets.interface'
import { invalidar, type OpcionesMutacion } from './shared'

export const ticketsKeys = {
    all: ['admin', 'tickets'] as const,
    list: (busqueda: string) => [...ticketsKeys.all, 'list', busqueda] as const,
}

export const ticketsQueryOptions = (busqueda: string) =>
    queryOptions({
        queryKey: ticketsKeys.list(busqueda),
        queryFn: ({ signal }) => getTickets(busqueda, signal),
    })

export const useTickets = (busqueda: string) => useQuery(ticketsQueryOptions(busqueda))

export const useAjustarTickets = (
    empresaId: number,
    opciones?: OpcionesMutacion<TicketsEmpresa, AjusteTicketsPayload>
) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: (payload: AjusteTicketsPayload) => ajustarTickets(empresaId, payload),
        onSuccess: async (...args) => {
            // Cualquier búsqueda en pantalla debe ver el ajuste.
            await invalidar(queryClient, ticketsKeys.all)
            return opciones?.onSuccess?.(...args)
        },
    })
}
