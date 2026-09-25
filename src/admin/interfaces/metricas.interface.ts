import type { EstadoSuscripcion } from './empresa.interface'

export interface ConversionPruebaAPago {
    desde: string
    hasta: string
    pasaronPorPrueba: number
    convirtieron: number
    /** Porcentaje (66.7), no fracción. */
    tasa: number
}

export interface AdminMetricas {
    empresasPorEstado: Record<EstadoSuscripcion, number>
    pruebasPorVencerEstaSemana: number
    ingresoMesActual: number
    /** Puede traer varias monedas; `ingresoMesActual` es solo la de MXN. */
    ingresoMesActualPorMoneda: Record<string, number>
    conversionPruebaAPago: ConversionPruebaAPago
}
