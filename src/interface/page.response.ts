/** Envoltura paginada que devuelven los listados del backend (`PageResponse<T>`). */
export interface PageResponse<T> {
    contenido: T[]
    pagina: number
    tamanio: number
    totalElementos: number
    totalPaginas: number
    esUltima: boolean
}
