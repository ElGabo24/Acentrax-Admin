import { queryOptions, useQuery } from '@tanstack/react-query'
import { getMetricas } from '../actions/metricas/getMetricas.action'

export const metricasKeys = {
    all: ['admin', 'metricas'] as const,
}

export const metricasQueryOptions = () =>
    queryOptions({
        queryKey: metricasKeys.all,
        queryFn: ({ signal }) => getMetricas(signal),
        staleTime: 60_000,
    })

export const useMetricas = () => useQuery(metricasQueryOptions())
