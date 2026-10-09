import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { AdminPlan, ModuloPlan, PlanPayload } from '../../interfaces/plan.interface'

export const getModulosPlan = async (signal?: AbortSignal): Promise<ModuloPlan[]> => {
    try {
        const { data } = await adminApi.get<ModuloPlan[]>('/admin/planes/modulos', { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const crearPlan = async (payload: PlanPayload): Promise<AdminPlan> => {
    try {
        const { data } = await adminApi.post<AdminPlan>('/admin/planes', payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** El `PUT` reemplaza el plan entero: un tope en `null` es ilimitado, no "no lo cambies". */
export const editarPlan = async (id: number, payload: PlanPayload): Promise<AdminPlan> => {
    try {
        const { data } = await adminApi.put<AdminPlan>(`/admin/planes/${id}`, payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
