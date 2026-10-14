import type { Negocio, EstadoProspecto, PreguntaCuestionario, ResultadoVisita, Visita } from '../interfaces/prospectos.interface'

export const ESTADO_PROSPECTO_LABEL: Record<EstadoProspecto, string> = {
    NUEVO: 'Nuevo',
    VISITADO: 'Visitado',
    INTERESADO: 'Interesado',
    SEGUIMIENTO: 'Seguimiento',
    NO_INTERESADO: 'No interesado',
    ALTA_BORRADOR: 'Alta en proceso',
    CONVERTIDO: 'Cliente',
}

/** En el orden del embudo: de lo que apenas se registró a lo que ya es cliente. */
export const ESTADOS_PROSPECTO: EstadoProspecto[] = [
    'NUEVO',
    'VISITADO',
    'SEGUIMIENTO',
    'INTERESADO',
    'ALTA_BORRADOR',
    'CONVERTIDO',
    'NO_INTERESADO',
]

export const RESULTADO_VISITA_LABEL: Record<ResultadoVisita, string> = {
    INTERESADO: 'Le interesó',
    QUIZAS: 'Quizás',
    NO_INTERESADO: 'No le interesó',
    NO_ESTABA: 'No estaba',
}

export const GIRO_NEGOCIO_LABEL: Record<string, string> = {
    TIENDITA: 'Tiendita',
    ABARROTES: 'Abarrotes',
    PANADERIA: 'Panadería',
    TORTILLERIA: 'Tortillería',
    PIZZERIA: 'Pizzería',
    CARNICERIA: 'Carnicería',
    FRUTERIA: 'Frutería',
    PAPELERIA: 'Papelería',
    FARMACIA: 'Farmacia',
    OTRO: 'Otro',
}

/** El giro es texto libre en la base: uno que la lista no conoce se muestra tal cual, capitalizado. */
export const giroLabel = (giro: string): string =>
    GIRO_NEGOCIO_LABEL[giro] ?? giro.charAt(0).toUpperCase() + giro.slice(1).toLowerCase()

/** Los motivos de rechazo de la versión 1 del cuestionario; el detalle usa la definición del servidor si la tiene. */
export const MOTIVO_NO_LABEL: Record<string, string> = {
    PRECIO: 'Le parece caro',
    YA_USA_OTRO: 'Ya usa otro sistema',
    NO_USA_TECNOLOGIA: 'No usa celular ni computadora',
    DESCONFIA: 'Desconfía o no lo entiende',
    NO_LE_HACE_FALTA: 'No le hace falta',
    NO_DECIDE: 'No es quien decide',
    MALA_SENAL: 'No tiene buena señal en el local',
    OTRO: 'Otro',
}

export const motivoNoLabel = (motivo: string): string => MOTIVO_NO_LABEL[motivo] ?? motivo

/** Abre el punto en Google Maps. Sin ubicación capturada (el GPS puede fallar), `null`. */
export const enlaceDeMapa = (negocio: Pick<Negocio, 'latitud' | 'longitud'>): string | null =>
    negocio.latitud !== null && negocio.longitud !== null
        ? `https://www.google.com/maps/search/?api=1&query=${negocio.latitud},${negocio.longitud}`
        : null

/** La visita más reciente (el servidor ya las manda de la más nueva a la más vieja, pero no se depende de ello). */
export const ultimaVisita = (visitas: Visita[]): Visita | null =>
    visitas.reduce<Visita | null>((reciente, v) => (!reciente || v.fecha > reciente.fecha ? v : reciente), null)

/** Mínimo que acepta el servidor para la contraseña de un agente. */
export const MIN_CONTRASENIA_AGENTE = 8

/**
 * Una contraseña para dársela al agente: 12 caracteres sin los que se confunden al leerlos
 * (0/O, 1/l/I). Sale de `crypto`, no de `Math.random`.
 */
export const generarContrasenia = (largo = 12): string => {
    const alfabeto = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const azar = crypto.getRandomValues(new Uint32Array(largo))
    return Array.from(azar, (n) => alfabeto[n % alfabeto.length]).join('')
}

/** Una respuesta como texto: la opción con su texto, no con su id. `null` si no se contestó. */
export const textoDeRespuesta = (pregunta: PreguntaCuestionario, valor: unknown): string | null => {
    if (valor === null || valor === undefined || valor === '') return null
    const textoOpcion = (id: unknown) => pregunta.opciones?.find((o) => o.id === id)?.texto ?? String(id)

    if (Array.isArray(valor)) return valor.length === 0 ? null : valor.map(textoOpcion).join(', ')
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
    if (pregunta.tipo === 'OPCION' || pregunta.tipo === 'MULTIPLE') return textoOpcion(valor)
    return String(valor)
}

/**
 * Un teléfono de México como enlace de WhatsApp (`wa.me`). Con 10 dígitos se le antepone la lada del país; un número que
 * ya trae la suya (11 a 15 dígitos) se respeta. Sin dígitos suficientes, `null`.
 */
export const enlaceDeWhatsApp = (telefono: string | null): string | null => {
    const digitos = (telefono ?? '').replace(/\D/g, '')
    if (digitos.length < 10 || digitos.length > 15) return null
    return `https://wa.me/${digitos.length === 10 ? `52${digitos}` : digitos}`
}
