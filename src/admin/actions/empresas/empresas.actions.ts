import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { PageResponse } from '@/interface/page.response'
import type {
    AdminEmpresaDetalle,
    AdminEmpresaResumen,
    CambioSuscripcion,
    EmpresasFiltros,
} from '../../interfaces/empresa.interface'

export const getEmpresas = async (
    filtros: EmpresasFiltros,
    signal?: AbortSignal
): Promise<PageResponse<AdminEmpresaResumen>> => {
    try {
        const { data } = await adminApi.get<PageResponse<AdminEmpresaResumen>>('/admin/empresas', {
            params: filtros,
            signal,
        })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const getEmpresa = async (id: number, signal?: AbortSignal): Promise<AdminEmpresaDetalle> => {
    try {
        const { data } = await adminApi.get<AdminEmpresaDetalle>(`/admin/empresas/${id}`, { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const cambiarSuscripcion = async (
    id: number,
    cambio: CambioSuscripcion
): Promise<AdminEmpresaDetalle> => {
    try {
        const { data } = await adminApi.put<AdminEmpresaDetalle>(`/admin/empresas/${id}/suscripcion`, cambio)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
