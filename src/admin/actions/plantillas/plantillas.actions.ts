import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type {
    ImportacionPlantillas,
    PlantillaReceta,
    PlantillaRecetaPayload,
} from '../../interfaces/plantillaReceta.interface'

/** Todas las activas, sin ingredientes ni etapas: esos vienen en el detalle. */
export const getPlantillas = async (signal?: AbortSignal): Promise<PlantillaReceta[]> => {
    try {
        const { data } = await adminApi.get<PlantillaReceta[]>('/admin/plantillas-receta', { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const getPlantilla = async (id: number, signal?: AbortSignal): Promise<PlantillaReceta> => {
    try {
        const { data } = await adminApi.get<PlantillaReceta>(`/admin/plantillas-receta/${id}`, { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** Lee `plantillas-base.json` del servidor. Idempotente; no recibe cuerpo. */
export const importarPlantillas = async (): Promise<ImportacionPlantillas> => {
    try {
        const { data } = await adminApi.post<ImportacionPlantillas>('/admin/plantillas-receta/importar')
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** Siempre nace `SUGERIDA`. Devuelve la plantilla completa. */
export const crearPlantilla = async (payload: PlantillaRecetaPayload): Promise<PlantillaReceta> => {
    try {
        const { data } = await adminApi.post<PlantillaReceta>('/admin/plantillas-receta', payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** Reemplazo completo: ingredientes y etapas que no se manden se borran. */
export const editarPlantilla = async (id: number, payload: PlantillaRecetaPayload): Promise<PlantillaReceta> => {
    try {
        const { data } = await adminApi.put<PlantillaReceta>(`/admin/plantillas-receta/${id}`, payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** 204 sin cuerpo. Las recetas ya clonadas de la plantilla no cambian. */
export const eliminarPlantilla = async (id: number): Promise<void> => {
    try {
        await adminApi.delete(`/admin/plantillas-receta/${id}`)
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const verificarPlantilla = async (id: number): Promise<PlantillaReceta> => {
    try {
        const { data } = await adminApi.post<PlantillaReceta>(`/admin/plantillas-receta/${id}/verificar`)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
