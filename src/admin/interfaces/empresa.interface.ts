export type EstadoSuscripcion = 'PRUEBA' | 'ACTIVA' | 'GRACIA' | 'SOLO_LECTURA' | 'CANCELADA'

export type OrdenEmpresas = 'nombre' | 'vencimiento' | 'actividad'

export interface AdminEmpresaResumen {
    id: number
    nombre: string
    /** Nulo si la empresa todavía no tiene suscripción. */
    planCodigo: string | null
    planNombre: string | null
    estado: EstadoSuscripcion | null
    /** Nulo cuando el estado no tiene fecha de fin (solo lectura, cancelada). */
    diasRestantes: number | null
    usuarios: number
    ultimaActividad: string | null
}

export interface AdminSuscripcion {
    id: number
    estado: EstadoSuscripcion
    planId: number
    planCodigo: string
    planNombre: string
    periodo: string | null
    metodoPago: string | null
    renovacionAutomatica: boolean
    proveedor: string | null
    inicioPrueba: string | null
    finPrueba: string | null
    inicioPeriodo: string | null
    finPeriodo: string | null
    finGracia: string | null
    vigenciaHasta: string | null
    diasRestantes: number | null
    canceladaAt: string | null
}

export interface AdminUsoPlan {
    recurso: string
    uso: number
    /** Nulo = ilimitado. */
    limite: number | null
    excedido: boolean
}

export interface AdminPagoEmpresa {
    id: number
    folio: string
    monto: number
    moneda: string
    metodo: string | null
    estado: string
    proveedor: string | null
    periodoInicio: string | null
    periodoFin: string | null
    pagadoAt: string | null
    createdAt: string
}

export interface AdminEmpresaDetalle {
    id: number
    nombre: string
    correo: string | null
    telefono: string | null
    suscripcion: AdminSuscripcion | null
    uso: AdminUsoPlan[]
    pagos: AdminPagoEmpresa[]
    ultimaActividad: string | null
}

export interface EmpresasFiltros {
    estado?: EstadoSuscripcion
    plan?: string
    busqueda?: string
    orden: OrdenEmpresas
    pagina: number
    tamanio: number
}

/** Cuerpo de `PUT /admin/empresas/{id}/suscripcion`: la razón es obligatoria y al menos un cambio. */
export interface CambioSuscripcion {
    razon: string
    planId?: number
    estado?: EstadoSuscripcion
    extenderDias?: number
}
