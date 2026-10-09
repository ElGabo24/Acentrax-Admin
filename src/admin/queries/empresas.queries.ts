import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cambiarSuscripcion, getEmpresa, getEmpresas } from '../actions/empresas/empresas.actions'
import type { AdminEmpresaDetalle, CambioSuscripcion, EmpresasFiltros } from '../interfaces/empresa.interface'
import { metricasKeys } from './metricas.queries'
import { invalidar, STALE_CATALOGO, type OpcionesMutacion } from './shared'

export const empresasKeys = {
    all: ['admin', 'empresas'] as const,
    lists: () => [...empresasKeys.all, 'list'] as const,
    list: (filtros: EmpresasFiltros) => [...empresasKeys.lists(), filtros] as const,
    /** Las primeras empresas por nombre, para llenar selectores. */
    opciones: () => [...empresasKeys.all, 'opciones'] as const,
    details: () => [...empresasKeys.all, 'detail'] as const,
    detail: (id: number) => [...empresasKeys.details(), id] as const,
}

export const empresasListQueryOptions = (filtros: EmpresasFiltros) =>
    queryOptions({
        queryKey: empresasKeys.list(filtros),
        queryFn: ({ signal }) => getEmpresas(filtros, signal),
        // Al cambiar de filtro o de página se sigue viendo la anterior mientras llega la nueva.
        placeholderData: keepPreviousData,
    })

export const empresasOpcionesQueryOptions = () =>
    queryOptions({
        queryKey: empresasKeys.opciones(),
        queryFn: ({ signal }) => getEmpresas({ orden: 'nombre', pagina: 0, tamanio: 100 }, signal),
        select: (pagina) => pagina.contenido,
        staleTime: STALE_CATALOGO,
    })

export const empresaQueryOptions = (id: number) =>
    queryOptions({
        queryKey: empresasKeys.detail(id),
        queryFn: ({ signal }) => getEmpresa(id, signal),
        // `id` puede ser `NaN` si la URL trae basura: no hay nada que pedir.
        enabled: Number.isFinite(id),
    })

export const useEmpresas = (filtros: EmpresasFiltros) => useQuery(empresasListQueryOptions(filtros))

export const useEmpresasOpciones = () => useQuery(empresasOpcionesQueryOptions())

export const useEmpresa = (id: number) => useQuery(empresaQueryOptions(id))

export const useCambiarSuscripcion = (
    empresaId: number,
    opciones?: OpcionesMutacion<AdminEmpresaDetalle, CambioSuscripcion>
) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: (cambio: CambioSuscripcion) => cambiarSuscripcion(empresaId, cambio),
        onSuccess: async (...args) => {
            const [detalle] = args
            // El servidor ya devolvió el detalle nuevo: se escribe tal cual, sin repedirlo.
            queryClient.setQueryData(empresasKeys.detail(empresaId), detalle)
            // Un cambio de estado o de plan mueve las filas de la lista y los contadores de la cabecera.
            await invalidar(queryClient, empresasKeys.lists(), metricasKeys.all)
            return opciones?.onSuccess?.(...args)
        },
    })
}
