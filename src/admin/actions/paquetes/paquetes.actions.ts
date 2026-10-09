import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type {
    AdminPaqueteMensajes,
    AjusteSaldoPayload,
    PaqueteMensajesPayload,
    SaldoMensajesEmpresa,
} from '../../interfaces/paqueteMensajes.interface'

export const getPaquetes = async (signal?: AbortSignal): Promise<AdminPaqueteMensajes[]> => {
    try {
        const { data } = await adminApi.get<AdminPaqueteMensajes[]>('/admin/paquetes-mensajes', { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const crearPaquete = async (payload: PaqueteMensajesPayload): Promise<AdminPaqueteMensajes> => {
    try {
        const { data } = await adminApi.post<AdminPaqueteMensajes>('/admin/paquetes-mensajes', payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** No hay `DELETE`: para retirar un paquete se manda `activo: false`. */
export const editarPaquete = async (id: number, payload: PaqueteMensajesPayload): Promise<AdminPaqueteMensajes> => {
    try {
        const { data } = await adminApi.put<AdminPaqueteMensajes>(`/admin/paquetes-mensajes/${id}`, payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const getSaldoMensajes = async (empresaId: number, signal?: AbortSignal): Promise<SaldoMensajesEmpresa> => {
    try {
        const { data } = await adminApi.get<SaldoMensajesEmpresa>(`/admin/empresas/${empresaId}/saldo-mensajes`, { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const ajustarSaldoMensajes = async (
    empresaId: number,
    payload: AjusteSaldoPayload
): Promise<SaldoMensajesEmpresa> => {
    try {
        const { data } = await adminApi.post<SaldoMensajesEmpresa>(
            `/admin/empresas/${empresaId}/saldo-mensajes/ajustes`,
            payload
        )
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
