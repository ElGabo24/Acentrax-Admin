import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { AdminAgente, AgentePayload } from '../../interfaces/prospectos.interface'

export const getAgentes = async (signal?: AbortSignal): Promise<AdminAgente[]> => {
    try {
        const { data } = await adminApi.get<AdminAgente[]>('/admin/agentes', { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const crearAgente = async (payload: AgentePayload): Promise<AdminAgente> => {
    try {
        const { data } = await adminApi.post<AdminAgente>('/admin/agentes', payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** Convierte en agente una cuenta que ya existe; si ya lo era, la reactiva. */
export const promoverAgente = async (correo: string): Promise<AdminAgente> => {
    try {
        const { data } = await adminApi.post<AdminAgente>('/admin/agentes/promover', { correo })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const cambiarActivoAgente = async (userId: string, activo: boolean): Promise<AdminAgente> => {
    try {
        const { data } = await adminApi.put<AdminAgente>(`/admin/agentes/${userId}/activo`, { activo })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** Solo cuentas sin negocio. Cierra las sesiones del agente. */
export const restablecerContraseniaAgente = async (userId: string, contrasenia: string): Promise<void> => {
    try {
        await adminApi.post(`/admin/agentes/${userId}/contrasenia`, { contrasenia })
    } catch (error) {
        throw normalizeApiError(error)
    }
}
