import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { AdminVersionApp, VersionAppPayload } from '../../interfaces/versionApp.interface'

export const getVersiones = async (signal?: AbortSignal): Promise<AdminVersionApp[]> => {
    try {
        const { data } = await adminApi.get<AdminVersionApp[]>('/admin/versiones-app', { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const crearVersion = async (payload: VersionAppPayload): Promise<AdminVersionApp> => {
    try {
        const { data } = await adminApi.post<AdminVersionApp>('/admin/versiones-app', payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const editarVersion = async (id: number, payload: VersionAppPayload): Promise<AdminVersionApp> => {
    try {
        const { data } = await adminApi.put<AdminVersionApp>(`/admin/versiones-app/${id}`, payload)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** Sólo borradores: el servidor rechaza borrar una versión publicada. */
export const eliminarVersion = async (id: number): Promise<void> => {
    try {
        await adminApi.delete(`/admin/versiones-app/${id}`)
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** Sube una imagen (cabecera del aviso o ícono de una mejora) y devuelve su URL pública. */
export const subirImagenVersion = async (archivo: File, tipo: 'CABECERA' | 'ICONO'): Promise<string> => {
    try {
        const form = new FormData()
        form.append('archivo', archivo)
        form.append('tipo', tipo)
        const { data } = await adminApi.post<{ url: string }>('/admin/versiones-app/imagen', form)
        return data.url
    } catch (error) {
        throw normalizeApiError(error)
    }
}
