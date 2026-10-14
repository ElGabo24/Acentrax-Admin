export type TipoAgente = 'PROPIO' | 'DISTRIBUIDOR'

export interface AdminAgente {
    userId: string
    correo: string
    nombre: string
    apellidos: string
    telefono: string
    tipo: TipoAgente
    activo: boolean
    creadoEn: string
    desactivadoEn: string | null
}

/** Cuerpo de `POST /admin/agentes`. */
export interface AgentePayload {
    correo: string
    nombre: string
    apellidos: string
    telefono: string
    /** La inicial: la entrega el superadmin al agente. Mínimo 8 caracteres. */
    contrasenia: string
}

export type EstadoProspecto =
    | 'NUEVO'
    | 'VISITADO'
    | 'INTERESADO'
    | 'NO_INTERESADO'
    | 'SEGUIMIENTO'
    | 'ALTA_BORRADOR'
    | 'CONVERTIDO'

export type ResultadoVisita = 'INTERESADO' | 'QUIZAS' | 'NO_INTERESADO' | 'NO_ESTABA'

export interface Negocio {
    id: string
    agenteId: string
    nombreNegocio: string
    /** Texto libre en la base; la app ofrece una lista (`GiroNegocio`) y `OTRO`. */
    giro: string
    /** Solo vienen si el dueño dio su consentimiento. */
    contactoNombre: string | null
    contactoTelefono: string | null
    direccionTexto: string | null
    latitud: number | null
    longitud: number | null
    fotoFachadaUrl: string | null
    estado: EstadoProspecto
    consentimientoContacto: boolean
    /** La empresa en que se convirtió cuando su dueño aceptó la invitación; `null` mientras no es cliente. */
    empresaId: number | null
    creadoEn: string
    actualizadoEn: string
}

/** Un producto del borrador que armó el agente (sin existencias: las pone el dueño). */
export interface ProductoBorrador {
    id: string
    codigoBarras: string | null
    nombre: string
    precioVenta: number | null
    /** El código con el que se encontró en el catálogo global; sin él, lo capturó el agente a mano. */
    catalogoCodigoBarras: string | null
    origen: 'CATALOGO' | 'MANUAL'
    actualizadoEn: string
}

export interface Visita {
    id: string
    prospectoId: string
    fecha: string
    latitud: number | null
    longitud: number | null
    resultado: ResultadoVisita
    motivoNo: string | null
    comentario: string | null
    cuestionarioId: number | null
    /** `{ preguntaId: valor }`; el valor es texto, booleano, o lista de ids en las de selección múltiple. */
    respuestas: Record<string, unknown> | null
    proximaVisita: string | null
}

export interface NegocioConVisitas {
    negocio: Negocio
    visitas: Visita[]
    productos: ProductoBorrador[]
}

export interface ProspectosFiltros {
    agenteId?: string
    estado?: EstadoProspecto
    giro?: string
    pagina?: number
    tamanio?: number
}

export interface ConteoAgente {
    agenteId: string
    nombre: string
    prospectos: number
}

export interface ResumenProspectos {
    total: number
    porEstado: Record<string, number>
    porGiro: Record<string, number>
    porAgente: ConteoAgente[]
    motivosNo: Record<string, number>
}

export type TipoPregunta = 'OPCION' | 'MULTIPLE' | 'SI_NO' | 'TEXTO' | 'NUMERO'

export interface OpcionPregunta {
    id: string
    texto: string
}

export interface PreguntaCuestionario {
    id: string
    texto: string
    tipo: TipoPregunta
    opciones?: OpcionPregunta[]
}

export interface SeccionCuestionario {
    id: string
    titulo: string
    preguntas: PreguntaCuestionario[]
}

export interface DefinicionCuestionario {
    secciones: SeccionCuestionario[]
    motivosNo: OpcionPregunta[]
}

export interface Cuestionario {
    id: number
    version: number
    definicion: DefinicionCuestionario
    publicadoEn: string
}

export interface VersionCuestionario {
    id: number
    version: number
    activo: boolean
    publicadoEn: string
    preguntas: number
    /** Cuántas visitas contestaron esta versión. */
    visitas: number
}

export interface ProductoDelRanking {
    /** El código de barras, o el nombre normalizado si no lo tiene. */
    clave: string
    codigoBarras: string | null
    nombre: string
    /** En cuántos negocios distintos aparece. */
    negocios: number
    precioPromedio: number | null
    enCatalogo: boolean
    /** La foto del catálogo; `null` = sin foto, ahí hay trabajo. */
    imagenUrl: string | null
}

export interface RankingFiltros {
    q?: string
    soloSinFoto?: boolean
    pagina?: number
    tamanio?: number
}

export interface MetricasAgente {
    agenteId: string
    nombre: string
    activo: boolean
    negocios: number
    visitas: number
    interesados: number
    rechazos: number
    invitaciones: number
    clientes: number
    enAlta: number
    seguimientosVencidos: number
    ultimaVisita: string | null
}

export interface AltaEnSeguimiento {
    prospectoId: string
    nombreNegocio: string
    agente: string
    empresaId: number
    convertidoEn: string
    ultimaActividad: string | null
    diasDesdeAlta: number
    diasSinActividad: number
}

export interface InvitacionEnSeguimiento {
    prospectoId: string
    nombreNegocio: string
    agente: string
    contactoNombre: string | null
    contactoTelefono: string | null
    creadaEn: string
    expiraEn: string
    diasDesdeEnvio: number
    situacion: 'VIGENTE' | 'VENCIDA'
}

export interface Seguimiento {
    altas: AltaEnSeguimiento[]
    invitaciones: InvitacionEnSeguimiento[]
}

export interface PuntoDeMapa {
    id: string
    nombreNegocio: string
    giro: string
    estado: EstadoProspecto
    latitud: number
    longitud: number
    /** El agente que lo registró. */
    agente: string
    /** Cuándo fue la última visita; `null` si todavía no se le hace ninguna. */
    ultimaVisita: string | null
    /** La fecha para volver que dejó la última visita; `null` si no dejó. */
    proximaVisita: string | null
}
