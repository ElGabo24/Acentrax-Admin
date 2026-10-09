export interface AdminPaqueteMensajes {
    id: number
    /** Definitivo: se fija al crear y no se puede cambiar. */
    codigo: string
    nombre: string
    mensajes: number
    /** Sin IVA. */
    precio: number
    moneda: string
    orden: number
    activo: boolean
    /** Compras ya pagadas de este paquete. */
    comprasPagadas: number
    updatedAt: string
}

/** Cuerpo de `POST` y `PUT /admin/paquetes-mensajes`. El `codigo` sólo viaja al crear. */
export interface PaqueteMensajesPayload {
    codigo?: string
    nombre: string
    mensajes: number
    precio: number
    moneda: string
    orden: number
    activo: boolean
}

export type TipoMovimientoSaldo = 'COMPRA' | 'CONSUMO' | 'AJUSTE'

export interface MovimientoSaldo {
    id: number
    tipo: TipoMovimientoSaldo
    delta: number
    saldoDespues: number
    motivo: string | null
    fecha: string
}

/** `GET /admin/empresas/{id}/saldo-mensajes` y respuesta de los ajustes. */
export interface SaldoMensajesEmpresa {
    empresaId: number
    saldo: number
    movimientos: MovimientoSaldo[]
}

export interface AjusteSaldoPayload {
    /** Entero distinto de cero; negativo descuenta. */
    delta: number
    motivo: string
}
