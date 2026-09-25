import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type {
    CostoOperativo,
    CostoPayload,
    RenovarCostoPayload,
    RenovarCostoResponse,
} from '../../interfaces/costo.interface'

export const getCostos = async (): Promise<CostoOperativo[]> => {
    try {
        const { data } = await adminApi.get<CostoOperativo[]>('/admin/costos-operativos')
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const crearCosto = async (payload: CostoPayload): Promise<CostoOperativo> => {
    try {
        const { data } = await adminApi.post<CostoOperativo>('/admin/costos-operativos', payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** Solo para corregir errores de captura: cambiar el monto de un recurrente va por `renovarCosto`. */
export const editarCosto = async (id: number, payload: CostoPayload): Promise<CostoOperativo> => {
    try {
        const { data } = await adminApi.put<CostoOperativo>(`/admin/costos-operativos/${id}`, payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const borrarCosto = async (id: number): Promise<void> => {
    try {
        await adminApi.delete(`/admin/costos-operativos/${id}`)
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const renovarCosto = async (
    id: number,
    payload: RenovarCostoPayload
): Promise<RenovarCostoResponse> => {
    try {
        const { data } = await adminApi.post<RenovarCostoResponse>(`/admin/costos-operativos/${id}/renovar`, payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
