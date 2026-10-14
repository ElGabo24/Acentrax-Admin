import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { PageResponse } from '@/interface/page.response'
import type {
    Cuestionario,
    DefinicionCuestionario,
    MetricasAgente,
    NegocioConVisitas,
    ProductoDelRanking,
    ProspectosFiltros,
    PuntoDeMapa,
    RankingFiltros,
    ResumenProspectos,
    Seguimiento,
    VersionCuestionario,
} from '../../interfaces/prospectos.interface'

export const getProspectos = async (
    filtros: ProspectosFiltros,
    signal?: AbortSignal
): Promise<PageResponse<NegocioConVisitas>> => {
    try {
        const { data } = await adminApi.get<PageResponse<NegocioConVisitas>>('/admin/prospectos', {
            params: filtros,
            signal,
        })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const getProspecto = async (id: string, signal?: AbortSignal): Promise<NegocioConVisitas> => {
    try {
        const { data } = await adminApi.get<NegocioConVisitas>(`/admin/prospectos/${id}`, { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const getResumenProspectos = async (signal?: AbortSignal): Promise<ResumenProspectos> => {
    try {
        const { data } = await adminApi.get<ResumenProspectos>('/admin/prospectos/resumen', { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** Una versión concreta del cuestionario: las visitas viejas se contestaron con la que había entonces. */
export const getCuestionario = async (id: number, signal?: AbortSignal): Promise<Cuestionario> => {
    try {
        const { data } = await adminApi.get<Cuestionario>(`/admin/prospectos/cuestionarios/${id}`, { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const getVersionesCuestionario = async (signal?: AbortSignal): Promise<VersionCuestionario[]> => {
    try {
        const { data } = await adminApi.get<VersionCuestionario[]>('/admin/prospectos/cuestionarios', { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** La versión vigente: la que las apps de los agentes bajan en su próxima sincronización. */
export const getCuestionarioActivo = async (signal?: AbortSignal): Promise<Cuestionario> => {
    try {
        const { data } = await adminApi.get<Cuestionario>('/admin/prospectos/cuestionarios/activo', { signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** Publica una versión nueva (queda activa y la anterior se conserva). */
export const publicarCuestionario = async (definicion: DefinicionCuestionario): Promise<Cuestionario> => {
    try {
        const { data } = await adminApi.post<Cuestionario>('/admin/prospectos/cuestionarios', { definicion })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const activarCuestionario = async (id: number): Promise<Cuestionario> => {
    try {
        const { data } = await adminApi.put<Cuestionario>(`/admin/prospectos/cuestionarios/${id}/activo`)
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const getRanking = async (
    filtros: RankingFiltros,
    signal?: AbortSignal
): Promise<PageResponse<ProductoDelRanking>> => {
    try {
        const { data } = await adminApi.get<PageResponse<ProductoDelRanking>>('/admin/prospectos/productos/ranking', {
            params: filtros,
            signal,
        })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** `desde` y `hasta` son días (`yyyy-MM-dd`), `hasta` incluido. Sin ellos, los últimos 30 días. */
export const getMetricas = async (desde?: string, hasta?: string, signal?: AbortSignal): Promise<MetricasAgente[]> => {
    try {
        const { data } = await adminApi.get<MetricasAgente[]>('/admin/prospectos/metricas', { params: { desde, hasta }, signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const getSeguimiento = async (diasSinUso: number, diasEspera: number, signal?: AbortSignal): Promise<Seguimiento> => {
    try {
        const { data } = await adminApi.get<Seguimiento>('/admin/prospectos/seguimiento', { params: { diasSinUso, diasEspera }, signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const getMapa = async (
    filtros: Pick<ProspectosFiltros, 'agenteId' | 'estado' | 'giro'>,
    signal?: AbortSignal
): Promise<PuntoDeMapa[]> => {
    try {
        const { data } = await adminApi.get<PuntoDeMapa[]>('/admin/prospectos/mapa', { params: filtros, signal })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}
