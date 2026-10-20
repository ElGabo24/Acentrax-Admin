import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { AdminFeatureFlag } from '../../interfaces/featureFlag.interface'

export const getFlags = async (signal?: AbortSignal): Promise<AdminFeatureFlag[]> => {
    try {
        const { data } = await adminApi.get<AdminFeatureFlag[]>('/admin/flags', { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** No hay alta ni baja: las claves las siembra el servidor, aquí solo se enciende o se apaga. */
export const cambiarFlag = async (clave: string, habilitado: boolean): Promise<AdminFeatureFlag> => {
    try {
        const { data } = await adminApi.put<AdminFeatureFlag>(`/admin/flags/${clave}`, { habilitado })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
