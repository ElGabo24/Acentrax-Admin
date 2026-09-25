export type EstadoPago = 'PENDIENTE' | 'PAGADO' | 'EXPIRADO' | 'FALLIDO' | 'REEMBOLSADO'

export interface AdminPago {
    id: number
    folio: string
    empresaId: number
    empresa: string
    planCodigo: string | null
    monto: number
    moneda: string
    metodo: string | null
    estado: EstadoPago
    proveedor: string | null
    referenciaExterna: string | null
    periodoInicio: string | null
    periodoFin: string | null
    pagadoAt: string | null
    createdAt: string
}

/** Filtros de `GET /admin/pagos`. `desde` y `hasta` son instantes ISO, inclusivos. */
export interface PagosFiltros {
    empresaId?: number
    proveedor?: string
    estado?: EstadoPago
    desde?: string
    hasta?: string
}
