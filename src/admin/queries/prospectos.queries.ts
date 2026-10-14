import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    activarCuestionario,
    getCuestionario,
    getCuestionarioActivo,
    getMapa,
    getMetricas,
    getProspecto,
    getProspectos,
    getRanking,
    getResumenProspectos,
    getSeguimiento,
    getVersionesCuestionario,
    publicarCuestionario,
} from '../actions/prospectos/prospectos.actions'
import type {
    Cuestionario,
    DefinicionCuestionario,
    ProspectosFiltros,
    RankingFiltros,
} from '../interfaces/prospectos.interface'
import { invalidar, STALE_CATALOGO, type OpcionesMutacion } from './shared'

export const prospectosKeys = {
    all: ['admin', 'prospectos'] as const,
    lists: () => [...prospectosKeys.all, 'list'] as const,
    list: (filtros: ProspectosFiltros) => [...prospectosKeys.lists(), filtros] as const,
    resumen: () => [...prospectosKeys.all, 'resumen'] as const,
    detail: (id: string) => [...prospectosKeys.all, 'detail', id] as const,
    cuestionario: (id: number) => [...prospectosKeys.all, 'cuestionario', id] as const,
    cuestionarios: () => [...prospectosKeys.all, 'cuestionarios'] as const,
    cuestionarioActivo: () => [...prospectosKeys.all, 'cuestionario-activo'] as const,
    ranking: (filtros: RankingFiltros) => [...prospectosKeys.all, 'ranking', filtros] as const,
    metricas: (desde?: string, hasta?: string) => [...prospectosKeys.all, 'metricas', desde, hasta] as const,
    seguimiento: (diasSinUso: number, diasEspera: number) => [...prospectosKeys.all, 'seguimiento', diasSinUso, diasEspera] as const,
    mapa: (filtros: Pick<ProspectosFiltros, 'agenteId' | 'estado' | 'giro'>) => [...prospectosKeys.all, 'mapa', filtros] as const,
}

export const prospectosListQueryOptions = (filtros: ProspectosFiltros) =>
    queryOptions({
        queryKey: prospectosKeys.list(filtros),
        queryFn: ({ signal }) => getProspectos(filtros, signal),
        // Al cambiar de filtro o de página se sigue viendo la anterior mientras llega la nueva.
        placeholderData: keepPreviousData,
    })

export const useProspectos = (filtros: ProspectosFiltros) => useQuery(prospectosListQueryOptions(filtros))

export const useResumenProspectos = () =>
    useQuery(
        queryOptions({
            queryKey: prospectosKeys.resumen(),
            queryFn: ({ signal }) => getResumenProspectos(signal),
        })
    )

export const useProspecto = (id: string | null) =>
    useQuery(
        queryOptions({
            queryKey: prospectosKeys.detail(id ?? ''),
            queryFn: ({ signal }) => getProspecto(id as string, signal),
            enabled: id !== null,
        })
    )

/** Una versión del cuestionario no cambia nunca: se pide una vez y no se repide. */
export const useCuestionario = (id: number | null) =>
    useQuery(
        queryOptions({
            queryKey: prospectosKeys.cuestionario(id ?? -1),
            queryFn: ({ signal }) => getCuestionario(id as number, signal),
            enabled: id !== null,
            staleTime: Infinity,
        })
    )

export const useVersionesCuestionario = () =>
    useQuery(queryOptions({ queryKey: prospectosKeys.cuestionarios(), queryFn: ({ signal }) => getVersionesCuestionario(signal) }))

/** La versión vigente. Sirve también para ponerle nombre a los motivos de «no» del resumen. */
export const useCuestionarioActivo = () =>
    useQuery(
        queryOptions({
            queryKey: prospectosKeys.cuestionarioActivo(),
            queryFn: ({ signal }) => getCuestionarioActivo(signal),
            staleTime: STALE_CATALOGO,
        })
    )

/** Publicar o reactivar una versión cambia el listado de versiones y la vigente. */
const useInvalidarCuestionarios = () => {
    const queryClient = useQueryClient()
    return () => invalidar(queryClient, prospectosKeys.cuestionarios(), prospectosKeys.cuestionarioActivo())
}

export const usePublicarCuestionario = (opciones?: OpcionesMutacion<Cuestionario, DefinicionCuestionario>) => {
    const invalidarCuestionarios = useInvalidarCuestionarios()
    return useMutation({
        ...opciones,
        mutationFn: publicarCuestionario,
        onSuccess: async (...args) => {
            await invalidarCuestionarios()
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const useActivarCuestionario = (opciones?: OpcionesMutacion<Cuestionario, number>) => {
    const invalidarCuestionarios = useInvalidarCuestionarios()
    return useMutation({
        ...opciones,
        mutationFn: activarCuestionario,
        onSuccess: async (...args) => {
            await invalidarCuestionarios()
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const useRanking = (filtros: RankingFiltros) =>
    useQuery(
        queryOptions({
            queryKey: prospectosKeys.ranking(filtros),
            queryFn: ({ signal }) => getRanking(filtros, signal),
            placeholderData: keepPreviousData,
        })
    )

export const useMetricas = (desde?: string, hasta?: string) =>
    useQuery(
        queryOptions({
            queryKey: prospectosKeys.metricas(desde, hasta),
            queryFn: ({ signal }) => getMetricas(desde, hasta, signal),
            placeholderData: keepPreviousData,
        })
    )

export const useSeguimiento = (diasSinUso: number, diasEspera: number) =>
    useQuery(
        queryOptions({
            queryKey: prospectosKeys.seguimiento(diasSinUso, diasEspera),
            queryFn: ({ signal }) => getSeguimiento(diasSinUso, diasEspera, signal),
            placeholderData: keepPreviousData,
        })
    )

export const useMapa = (filtros: Pick<ProspectosFiltros, 'agenteId' | 'estado' | 'giro'>, habilitado: boolean) =>
    useQuery(
        queryOptions({
            queryKey: prospectosKeys.mapa(filtros),
            queryFn: ({ signal }) => getMapa(filtros, signal),
            enabled: habilitado,
            placeholderData: keepPreviousData,
        })
    )
