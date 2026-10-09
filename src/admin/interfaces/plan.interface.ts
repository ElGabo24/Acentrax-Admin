export interface AdminPlan {
    id: number
    codigo: string
    nombre: string
    descripcion: string | null
    precioMensual: number
    precioAnual: number
    moneda: string
    maxUsuarios: number | null
    maxProductos: number | null
    maxUbicaciones: number | null
    maxDispositivos: number | null
    maxMensajesMes: number | null
    modulos: string[]
    stripePriceMensual: string | null
    stripePriceAnual: string | null
    cobrable: boolean
    orden: number
    activo: boolean
    visible: boolean
    /** Empresas que están hoy en este plan. */
    empresas: number
    updatedAt: string
}

/** Un módulo asignable a un plan, tal como lo publica `GET /admin/planes/modulos`. */
export interface ModuloPlan {
    valor: string
    etiqueta: string
}

/** Cuerpo de `POST` y `PUT /admin/planes`. Siempre completo: el `PUT` reemplaza. */
export interface PlanPayload {
    codigo: string
    nombre: string
    descripcion: string | null
    precioMensual: number
    precioAnual: number
    moneda: string
    maxUsuarios: number | null
    maxProductos: number | null
    maxUbicaciones: number | null
    maxDispositivos: number | null
    maxMensajesMes: number | null
    modulos: string[]
    stripePriceMensual: string | null
    stripePriceAnual: string | null
    orden: number
    activo: boolean
    visible: boolean
}
