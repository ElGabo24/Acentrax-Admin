import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { ComisionPasarela } from '../../interfaces/comisionPasarela.interface'

export const getComisionesPasarela = async (): Promise<ComisionPasarela[]> => {
    try {
        const { data } = await adminApi.get<ComisionPasarela[]>('/admin/comisiones-pasarela')
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export interface ComisionPayload {
    porcentaje: number
    fijo: number
    monedaFijo: string
}

/** No hay `POST`: una pasarela nueva entra con su primer `PUT`. */
export const guardarComisionPasarela = async (
    proveedor: string,
    payload: ComisionPayload
): Promise<ComisionPasarela> => {
    try {
        const { data } = await adminApi.put<ComisionPasarela>(
            `/admin/comisiones-pasarela/${encodeURIComponent(proveedor)}`,
            payload
        )
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
