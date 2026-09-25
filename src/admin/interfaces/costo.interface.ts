export type CategoriaCosto = 'INFRAESTRUCTURA' | 'HERRAMIENTAS' | 'DOMINIO' | 'OTRO'
export type FrecuenciaCosto = 'MENSUAL' | 'ANUAL'

export interface CostoOperativo {
    id: number
    concepto: string
    categoria: CategoriaCosto
    monto: number
    moneda: string
    tipoCambio: number | null
    montoMxn: number
    recurrente: boolean
    frecuencia: FrecuenciaCosto | null
    /** `yyyy-MM-dd`: la fecha del gasto, o el inicio si es recurrente. */
    fecha: string
    /** Nulo = sigue aplicando. */
    fechaFin: string | null
    /** Sin `fechaFin`, o con un fin futuro. */
    vigente: boolean
    notas: string | null
    creadoPor: string
    createdAt: string
    updatedAt: string
}

/** Cuerpo de `POST` y `PUT /admin/costos-operativos`. */
export interface CostoPayload {
    concepto: string
    categoria: CategoriaCosto
    monto: number
    moneda: string
    tipoCambio: number | null
    recurrente: boolean
    frecuencia: FrecuenciaCosto | null
    fecha: string
    fechaFin: string | null
    notas: string | null
}

/** Cuerpo de `POST /admin/costos-operativos/{id}/renovar`. */
export interface RenovarCostoPayload {
    montoNuevo: number
    monedaNueva?: string
    tipoCambioNuevo?: number
    /** Siempre el día 1 de un mes: el reporte cuenta meses completos. */
    fechaEfectiva: string
}

export interface RenovarCostoResponse {
    anterior: CostoOperativo
    nuevo: CostoOperativo
}
