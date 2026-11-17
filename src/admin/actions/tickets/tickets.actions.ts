import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { AjusteTicketsPayload, TicketsEmpresa } from '../../interfaces/tickets.interface'

export const getTickets = async (busqueda: string, signal?: AbortSignal): Promise<TicketsEmpresa[]> => {
    try {
        const { data } = await adminApi.get<TicketsEmpresa[]>('/admin/tickets', {
            params: busqueda.trim() ? { busqueda: busqueda.trim() } : undefined,
            signal,
        })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** El servidor responde la fila de la empresa ya con el ajuste. */
export const ajustarTickets = async (empresaId: number, payload: AjusteTicketsPayload): Promise<TicketsEmpresa> => {
    try {
        const { data } = await adminApi.post<TicketsEmpresa>(`/admin/empresas/${empresaId}/tickets/ajustes`, payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
