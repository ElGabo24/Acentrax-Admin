import type { CategoriaCosto } from '../interfaces/costo.interface'
import type { EstadoSuscripcion } from '../interfaces/empresa.interface'
import type {
    FuentePlantilla,
    GiroPlantilla,
    ModoFormula,
    UnidadReceta,
} from '../interfaces/plantillaReceta.interface'

export const ESTADO_LABEL: Record<EstadoSuscripcion, string> = {
    PRUEBA: 'Prueba',
    ACTIVA: 'Activa',
    GRACIA: 'Gracia',
    SOLO_LECTURA: 'Solo lectura',
    CANCELADA: 'Cancelada',
}

export const ESTADOS: EstadoSuscripcion[] = ['PRUEBA', 'ACTIVA', 'GRACIA', 'SOLO_LECTURA', 'CANCELADA']

/** Estados que escriben: sin fecha de fin vigente, la tarea diaria los revierte. */
export const ESTADOS_CON_VIGENCIA: EstadoSuscripcion[] = ['PRUEBA', 'ACTIVA', 'GRACIA']

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto', style: 'narrow' })

/** "hace 2 h", "hace 3 sem". Sin dato, un guion. */
export const haceCuanto = (iso: string | null): string => {
    if (!iso) return '—'
    const segundos = (new Date(iso).getTime() - Date.now()) / 1000
    const unidades: [Intl.RelativeTimeFormatUnit, number][] = [
        ['week', 604800],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
    ]
    for (const [unidad, s] of unidades) {
        if (Math.abs(segundos) >= s) return rtf.format(Math.round(segundos / s), unidad)
    }
    return 'ahora'
}

export const fechaCorta = (iso: string | null): string =>
    iso
        ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—'

export const dinero = (monto: number, moneda = 'MXN', decimales = 2): string =>
    new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: moneda,
        minimumFractionDigits: decimales === 0 ? 0 : undefined,
        maximumFractionDigits: decimales,
    }).format(monto)

/**
 * Una fecha sin hora (`yyyy-MM-dd`, como `fecha` de un gasto). `new Date` la
 * leería como medianoche UTC y en México caería el día anterior.
 */
export const fechaDia = (fecha: string, opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string =>
    new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', opciones)

/** `2026-09` → `sep 2026`. */
export const mesLabel = (mes: string): string =>
    new Date(`${mes}-01T12:00:00`).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })

/** `2026-09` → `septiembre de 2026`. */
export const mesLargo = (mes: string): string =>
    new Date(`${mes}-01T12:00:00`).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })

/** `2026-09` → `sep`. */
export const mesCorto = (mes: string): string =>
    new Date(`${mes}-01T12:00:00`).toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')

/** `1500` → `$1.5 K`: para los ejes, donde no cabe la cifra entera. */
export const dineroCompacto = (monto: number): string =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 1 }).format(monto)

/** Fecha local como `yyyy-MM-dd`, sin pasar por UTC. */
export const aFechaIso = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const RECURSO_LABEL: Record<string, string> = {
    usuarios: 'Usuarios',
    productos: 'Productos',
    ubicaciones: 'Ubicaciones',
    dispositivos: 'Dispositivos con PIN',
    mensajes_mes: 'Mensajes del mes',
}

export const CATEGORIA_LABEL: Record<CategoriaCosto, string> = {
    INFRAESTRUCTURA: 'Infraestructura',
    HERRAMIENTAS: 'Herramientas',
    DOMINIO: 'Dominio',
    OTRO: 'Otro',
}

export const GIRO_LABEL: Record<GiroPlantilla, string> = {
    PANADERIA: 'Panadería',
    PIZZERIA: 'Pizzería',
    TORTILLERIA: 'Tortillería',
}

export const FUENTE_LABEL: Record<FuentePlantilla, string> = {
    PROVEEDOR: 'Ficha de proveedor',
    AVPN: 'Disciplinare AVPN',
    GENERADA: 'Generada',
    MANUAL: 'Manual',
}

export const MODO_FORMULA_LABEL: Record<ModoFormula, string> = {
    CANTIDAD_ABSOLUTA: 'Cantidad absoluta',
    PORCENTAJE_PANADERO: 'Porcentaje panadero',
}

export const UNIDADES: UnidadReceta[] = ['KG', 'G', 'L', 'ML', 'PZA']

export const UNIDAD_LABEL: Record<UnidadReceta, string> = {
    KG: 'Kilogramos (KG)',
    G: 'Gramos (G)',
    L: 'Litros (L)',
    ML: 'Mililitros (ML)',
    PZA: 'Piezas (PZA)',
}

/** Cantidades de receta (gramos, piezas): hasta 3 decimales, sin ceros de relleno. */
export const cantidad = (n: number): string =>
    n.toLocaleString('es-MX', { maximumFractionDigits: 3 })

export const fechaHora = (iso: string | null): string =>
    iso
        ? new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
        : '—'
