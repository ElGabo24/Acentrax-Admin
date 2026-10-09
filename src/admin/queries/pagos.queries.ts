import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { getPagos, getTodosLosPagos, TAMANIO_MAXIMO } from '../actions/pagos/pagos.actions'
import type { AdminPago, PagosFiltros } from '../interfaces/pago.interface'
import type { OpcionesMutacion } from './shared'

export const pagosKeys = {
    all: ['admin', 'pagos'] as const,
    lists: () => [...pagosKeys.all, 'list'] as const,
    list: (filtros: PagosFiltros, pagina: number) => [...pagosKeys.lists(), { ...filtros, pagina }] as const,
}

export const pagosListQueryOptions = (filtros: PagosFiltros, pagina: number) =>
    queryOptions({
        queryKey: pagosKeys.list(filtros, pagina),
        queryFn: ({ signal }) => getPagos(filtros, pagina, TAMANIO_MAXIMO, signal),
        placeholderData: keepPreviousData,
    })

/** `habilitado` en `false` cuando los filtros no pueden dar resultado (p. ej. un rango invertido). */
export const usePagos = (filtros: PagosFiltros, pagina: number, habilitado = true) =>
    useQuery({ ...pagosListQueryOptions(filtros, pagina), enabled: habilitado })

/**
 * Todas las páginas que cumplen los filtros, para armar el CSV. Es una lectura,
 * pero se pide a demanda y recorre varias páginas: una mutación da el estado
 * «exportando» sin guardar nada en caché.
 *
 * Aquí el error puede ser un `Error` común (el tope de páginas), no solo `ApiError`.
 */
export const useExportarPagos = (opciones?: OpcionesMutacion<AdminPago[], PagosFiltros, Error>) =>
    useMutation<AdminPago[], Error, PagosFiltros>({
        ...opciones,
        mutationFn: getTodosLosPagos,
    })
