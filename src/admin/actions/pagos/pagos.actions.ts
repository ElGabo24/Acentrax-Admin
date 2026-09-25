import { adminApi } from '@/api/AdminApi'
import { normalizeApiError } from '@/api/apiError'
import type { PageResponse } from '@/interface/page.response'
import type { AdminPago, PagosFiltros } from '../../interfaces/pago.interface'

/** Máximo que acepta el backend por página. */
export const TAMANIO_MAXIMO = 100

export const getPagos = async (
    filtros: PagosFiltros,
    pagina: number,
    tamanio = TAMANIO_MAXIMO
): Promise<PageResponse<AdminPago>> => {
    try {
        const { data } = await adminApi.get<PageResponse<AdminPago>>('/admin/pagos', {
            params: { ...filtros, pagina, tamanio },
        })
        return data
    } catch (error) {
        throw normalizeApiError(error)
    }
}

/** Tope de páginas al exportar: 100 páginas son 10 000 pagos; más sería un filtro olvidado. */
const MAX_PAGINAS_EXPORTACION = 100

/**
 * Todos los pagos que cumplen los filtros, recorriendo las páginas. No hay
 * endpoint de exportación: el CSV se arma en el cliente con lo mismo que ve la
 * tabla.
 */
export const getTodosLosPagos = async (filtros: PagosFiltros): Promise<AdminPago[]> => {
    const pagos: AdminPago[] = []
    for (let pagina = 0; pagina < MAX_PAGINAS_EXPORTACION; pagina++) {
        const respuesta = await getPagos(filtros, pagina)
        pagos.push(...respuesta.contenido)
        if (respuesta.esUltima) return pagos
    }
    throw new Error('Demasiados pagos para exportar de una vez. Acota el rango de fechas.')
}
