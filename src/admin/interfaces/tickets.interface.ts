/** Una empresa en la pantalla «Tickets»: su consumo de escaneos con IA este mes (`AdminTicketsEmpresaDto`). */
export interface TicketsEmpresa {
    empresaId: number
    nombre: string
    planCodigo: string | null
    planNombre: string | null
    usados: number
    /** Lo que incluye el plan. Null = ilimitado. */
    incluidosPlan: number | null
    /** Escaneos extra de ESTE mes (no pasan al siguiente). */
    bono: number
    /** Null = ilimitado. */
    restantes: number | null
}

/** `delta` > 0 regala escaneos este mes; < 0 corrige un regalo (no puede quitar más de lo regalado). */
export interface AjusteTicketsPayload {
    delta: number
    motivo: string
}
