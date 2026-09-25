import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { AdminMetricas } from '../../interfaces/metricas.interface'

export const getMetricas = async (): Promise<AdminMetricas> => {
    try {
        const { data } = await adminApi.get<AdminMetricas>('/admin/metricas')
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
