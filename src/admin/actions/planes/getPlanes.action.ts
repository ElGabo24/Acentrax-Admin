import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { AdminPlan } from '../../interfaces/plan.interface'

export const getPlanes = async (): Promise<AdminPlan[]> => {
    try {
        const { data } = await adminApi.get<AdminPlan[]>('/admin/planes')
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
