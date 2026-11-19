import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type {
    ActualizarProveedorPayload,
    ConsumoTimbres,
    CostosTimbres,
    ProveedorFacturacion,
} from '../../interfaces/facturacion.interface'

export const getConsumoTimbres = async (
    periodo: string | undefined,
    q: string,
    pagina: number,
    signal?: AbortSignal
): Promise<ConsumoTimbres> => {
    try {
        const { data } = await adminApi.get<ConsumoTimbres>('/admin/facturacion/consumo', {
            params: { periodo: periodo || undefined, q: q || undefined, pagina },
            signal,
        })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const getProveedoresFacturacion = async (signal?: AbortSignal): Promise<ProveedorFacturacion[]> => {
    try {
        const { data } = await adminApi.get<ProveedorFacturacion[]>('/admin/facturacion/proveedor', { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const putProveedorFacturacion = async (
    codigo: string,
    payload: ActualizarProveedorPayload
): Promise<ProveedorFacturacion> => {
    try {
        const { data } = await adminApi.put<ProveedorFacturacion>(`/admin/facturacion/proveedor/${codigo}`, payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const getCostosTimbres = async (periodo: string | undefined, signal?: AbortSignal): Promise<CostosTimbres> => {
    try {
        const { data } = await adminApi.get<CostosTimbres>('/admin/facturacion/costos', {
            params: { periodo: periodo || undefined },
            signal,
        })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
