import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    crearPlantilla,
    editarPlantilla,
    eliminarPlantilla,
    getPlantilla,
    getPlantillas,
    importarPlantillas,
    verificarPlantilla,
} from '../actions/plantillas/plantillas.actions'
import type {
    ImportacionPlantillas,
    PlantillaReceta,
    PlantillaRecetaPayload,
} from '../interfaces/plantillaReceta.interface'
import { invalidar, STALE_CATALOGO, type OpcionesMutacion } from './shared'

export const plantillasKeys = {
    all: ['admin', 'plantillas-receta'] as const,
    list: () => [...plantillasKeys.all, 'list'] as const,
    detail: (id: number) => [...plantillasKeys.all, 'detail', id] as const,
}

export const plantillasQueryOptions = () =>
    queryOptions({
        queryKey: plantillasKeys.list(),
        queryFn: ({ signal }) => getPlantillas(signal),
        staleTime: STALE_CATALOGO,
    })

export const plantillaQueryOptions = (id: number) =>
    queryOptions({
        queryKey: plantillasKeys.detail(id),
        queryFn: ({ signal }) => getPlantilla(id, signal),
        staleTime: STALE_CATALOGO,
    })

export const usePlantillas = () => useQuery(plantillasQueryOptions())

export const usePlantilla = (id: number) => useQuery(plantillaQueryOptions(id))

/**
 * Recarga todo lo de plantillas: una importación puede crear, reemplazar y
 * devolver a SUGERIDA varias a la vez, y no se sabe cuáles.
 */
export const useImportarPlantillas = (opciones?: OpcionesMutacion<ImportacionPlantillas, void>) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: importarPlantillas,
        onSuccess: async (...args) => {
            await invalidar(queryClient, plantillasKeys.all)
            return opciones?.onSuccess?.(...args)
        },
    })
}

/** Crea la plantilla, o la edita si se pasa una: el formulario es el mismo. */
export const useGuardarPlantilla = (
    plantilla: PlantillaReceta | null,
    opciones?: OpcionesMutacion<PlantillaReceta, PlantillaRecetaPayload>
) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: (payload: PlantillaRecetaPayload) =>
            plantilla ? editarPlantilla(plantilla.id, payload) : crearPlantilla(payload),
        onSuccess: async (...args) => {
            const [guardada] = args
            // El servidor devuelve la plantilla completa, con su estado ya resuelto: el detalle no hace falta repedirlo.
            queryClient.setQueryData(plantillasKeys.detail(guardada.id), guardada)
            // El listado sí cambia: una fila nueva, o el nombre, el estado, el rendimiento…
            await invalidar(queryClient, plantillasKeys.list())
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const useEliminarPlantilla = (opciones?: OpcionesMutacion<void, number>) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: (id: number) => eliminarPlantilla(id),
        onSuccess: async (...args) => {
            const [, id] = args
            // Ya no existe: su detalle no debe quedar en caché ni servirse de ahí.
            queryClient.removeQueries({ queryKey: plantillasKeys.detail(id) })
            await invalidar(queryClient, plantillasKeys.list())
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const useVerificarPlantilla =(id: number, opciones?: OpcionesMutacion<PlantillaReceta, void>) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: () => verificarPlantilla(id),
        onSuccess: async (...args) => {
            const [plantilla] = args
            // El servidor devuelve la plantilla completa ya verificada: el detalle no hace falta repedirlo.
            queryClient.setQueryData(plantillasKeys.detail(id), plantilla)
            // El listado sí cambia: el estado de esta plantilla.
            await invalidar(queryClient, plantillasKeys.list())
            return opciones?.onSuccess?.(...args)
        },
    })
}
