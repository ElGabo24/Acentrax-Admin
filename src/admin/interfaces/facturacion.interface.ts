export type AmbienteFacturacion = 'SANDBOX' | 'PRODUCCION'

export interface ConsumoTimbresEmpresa {
    empresaId: number
    nombre: string
    timbres: number
    /** Tope de su plan; null = ilimitado. */
    limite: number | null
    costoEstimado: number
}

export interface ConsumoTimbres {
    /** `YYYY-MM`, mes natural en hora de México. */
    periodo: string
    empresas: ConsumoTimbresEmpresa[]
    empresasConConsumo: number
    pagina: number
    tamano: number
    totalTimbres: number
    costoPorTimbre: number
    costoEstimadoTotal: number
}

export interface ProveedorFacturacion {
    codigo: string
    activo: boolean
    esDefault: boolean
    ambiente: AmbienteFacturacion
    /** Pesos por timbre, estimado. */
    costoTimbre: number
    /** Acentrax tiene las credenciales del proveedor. */
    configurado: boolean
}

/** Al menos uno de los dos. */
export interface ActualizarProveedorPayload {
    ambiente?: AmbienteFacturacion
    costoTimbre?: number
}

export interface CostosTimbres {
    periodo: string
    proveedor: string | null
    ambiente: AmbienteFacturacion | null
    costoPorTimbre: number
    timbres: number
    costoEstimado: number
}
