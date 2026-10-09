export type GiroPlantilla = 'PANADERIA' | 'PIZZERIA' | 'TORTILLERIA'

/**
 * `SUGERIDA`: ningún panadero la ha validado, es un punto de partida y no un dato.
 * `VERIFICADA`: una persona declaró que los números son reales.
 */
export type EstadoPlantilla = 'SUGERIDA' | 'VERIFICADA'

export type FuentePlantilla = 'PROVEEDOR' | 'AVPN' | 'GENERADA' | 'MANUAL'

export type ModoFormula = 'CANTIDAD_ABSOLUTA' | 'PORCENTAJE_PANADERO'

/** Unidades que acepta el servidor al guardar; rendimiento e ingredientes comparten el conjunto. */
export type UnidadReceta = 'KG' | 'G' | 'L' | 'ML' | 'PZA'

/** Un ingrediente genérico: `nombreGenerico` es texto, no un producto. */
export interface PlantillaIngrediente {
    nombreGenerico: string
    /** Nulo en `CANTIDAD_ABSOLUTA`. */
    porcentaje: number | null
    cantidad: number | null
    unidad: string
    /** La base del porcentaje panadero (normalmente la harina). */
    esBase: boolean
}

export interface PlantillaEtapa {
    orden: number
    nombre: string
    mermaPct: number
    minutos: number | null
}

export interface PlantillaReceta {
    id: number
    giro: GiroPlantilla
    nombre: string
    modoFormula: ModoFormula
    estado: EstadoPlantilla
    verificada: boolean
    /** Solo es nulo en las verificadas: una sugerida siempre se muestra con su aviso. */
    aviso: string | null
    fuente: FuentePlantilla
    rendimientoBase: number
    unidadRendimiento: string
    /** Peso de masa por pieza antes de hornear, en gramos. */
    pesoPiezaG: number | null
    mermaSugeridaPct: number
    /** Vacíos en el listado; llenos en el detalle. */
    ingredientes: PlantillaIngrediente[]
    etapas: PlantillaEtapa[]
}

export interface PlantillaIngredientePayload {
    nombreGenerico: string
    unidad: UnidadReceta
    /** `PORCENTAJE_PANADERO`: solo la base. `CANTIDAD_ABSOLUTA`: todos. */
    cantidad?: number | null
    /** `PORCENTAJE_PANADERO`: todos (la base, 100). `CANTIDAD_ABSOLUTA`: ninguno. */
    porcentaje?: number | null
    /** Se omite si no aplica: con `null` el servidor responde 400. */
    esBase?: boolean
}

export interface PlantillaEtapaPayload {
    orden: number
    nombre: string
    mermaPct?: number
    minutos?: number | null
}

/**
 * Cuerpo de `POST` y `PUT /admin/plantillas-receta`. El `PUT` es reemplazo
 * completo: lo que no se manda (ingredientes, etapas) se borra. `fuente`,
 * `mermaSugeridaPct` y `etapas` se OMITEN si no aplican; con `null` el servidor
 * responde 400.
 */
export interface PlantillaRecetaPayload {
    giro: GiroPlantilla
    nombre: string
    modoFormula: ModoFormula
    /** Por defecto `MANUAL`. */
    fuente?: FuentePlantilla
    rendimientoBase: number
    unidadRendimiento: UnidadReceta
    pesoPiezaG?: number | null
    /** Por defecto 0. Con etapas va en 0: la merma es una o la otra. */
    mermaSugeridaPct?: number
    ingredientes: PlantillaIngredientePayload[]
    etapas?: PlantillaEtapaPayload[]
}

/** Respuesta de `POST /admin/plantillas-receta/importar`. */
export interface ImportacionPlantillas {
    creadas: number
    /** Cambiaron sus números: se reemplazaron y volvieron a `SUGERIDA`. */
    actualizadas: number
    sinCambios: number
    /** Las que el superadmin creó, editó o eliminó: la importación ya no las toca. */
    omitidas: number
}
