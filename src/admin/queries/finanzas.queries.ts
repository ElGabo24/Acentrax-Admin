import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { getFinanzas } from '../actions/finanzas/finanzas.actions'

export const finanzasKeys = {
    all: ['admin', 'finanzas'] as const,
    resumen: (desde: string, hasta: string) => [...finanzasKeys.all, 'resumen', { desde, hasta }] as const,
}

export const finanzasQueryOptions = (desde: string, hasta: string) =>
    queryOptions({
        queryKey: finanzasKeys.resumen(desde, hasta),
        queryFn: ({ signal }) => getFinanzas(desde, hasta, signal),
        // Al cambiar el rango se sigue viendo el anterior mientras llega el nuevo.
        placeholderData: keepPreviousData,
    })

export const useFinanzas = (desde: string, hasta: string) => useQuery(finanzasQueryOptions(desde, hasta))
