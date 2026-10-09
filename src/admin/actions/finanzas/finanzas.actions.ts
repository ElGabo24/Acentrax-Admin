import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { Finanzas } from '../../interfaces/finanzas.interface'

export const getFinanzas = async (desde: string, hasta: string, signal?: AbortSignal): Promise<Finanzas> => {
    try {
        const { data } = await adminApi.get<Finanzas>('/admin/finanzas', {
            params: { desde, hasta, agrupar: 'mes' },
            signal,
        })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
