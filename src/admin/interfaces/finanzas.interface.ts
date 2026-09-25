export interface FinanzasMes {
    /** `yyyy-MM`. */
    mes: string
    ingresoBruto: number
    comisionEstimada: number
    gastosOperativos: number
    utilidadNeta: number
    pagos: number
    /** La cifra de ese mes está por debajo de la realidad (falta una tarifa, o un pago en otra moneda). */
    estimacionIncompleta: boolean
}

export interface FinanzasTotales {
    ingresoBruto: number
    comisionEstimada: number
    gastosOperativos: number
    utilidadNeta: number
    pagos: number
}

export interface Finanzas {
    desde: string
    hasta: string
    agrupar: string
    meses: FinanzasMes[]
    totales: FinanzasTotales
    estimacionIncompleta: boolean
    advertencia: string
}
