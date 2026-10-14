import type { PuntoDeMapa } from '../interfaces/prospectos.interface'
import { aFechaIso, fechaDia } from './formato'

/**
 * En qué lugar del camino está un negocio, para pintarlo en el mapa. Es una sola categoría por negocio (la primera que
 * cumpla, en este orden de importancia), no el estado crudo: lo que se quiere ver en el mapa es «a dónde me toca ir».
 */
export type CategoriaMapa = 'CONTRATADO' | 'EN_ALTA' | 'POR_VISITAR' | 'AGENDADO' | 'INTERESADO' | 'NO_INTERESADO'

export const CATEGORIAS_MAPA: { id: CategoriaMapa; etiqueta: string; color: string; ayuda: string }[] = [
    { id: 'POR_VISITAR', etiqueta: 'Por visitar', color: '#f97316', ayuda: 'Sin visitar todavía, no había nadie, o ya tocaba volver.' },
    { id: 'AGENDADO', etiqueta: 'Visita agendada', color: '#14b8a6', ayuda: 'Dijo «quizás» y ya hay fecha para volver.' },
    { id: 'INTERESADO', etiqueta: 'Interesados', color: '#3b82f6', ayuda: 'Les interesa; todavía no arman su alta.' },
    { id: 'EN_ALTA', etiqueta: 'En alta', color: '#8b5cf6', ayuda: 'Tienen productos cargados o una invitación enviada.' },
    { id: 'CONTRATADO', etiqueta: 'Contratados', color: '#16a34a', ayuda: 'Ya son clientes: el dueño aceptó su invitación.' },
    { id: 'NO_INTERESADO', etiqueta: 'No les interesó', color: '#dc2626', ayuda: 'Dijeron que no.' },
]

export const colorDeCategoria = (categoria: CategoriaMapa): string => CATEGORIAS_MAPA.find((c) => c.id === categoria)?.color ?? '#64748b'

/** Días de calendario (en la hora del navegador) de `fecha` a `hoy`: 0 = hoy, positivo = ya pasó, negativo = falta. */
const diasDesde = (fecha: string, hoy: Date): number => {
    const [a, m, d] = aFechaIso(new Date(fecha)).split('-').map(Number)
    const [ha, hm, hd] = aFechaIso(hoy).split('-').map(Number)
    return Math.round((Date.UTC(ha, hm - 1, hd) - Date.UTC(a, m - 1, d)) / 86_400_000)
}

export const categoriaDePunto = (p: Pick<PuntoDeMapa, 'estado' | 'proximaVisita'>, hoy: Date = new Date()): CategoriaMapa => {
    switch (p.estado) {
        case 'CONVERTIDO':
            return 'CONTRATADO'
        case 'ALTA_BORRADOR':
            return 'EN_ALTA'
        case 'NO_INTERESADO':
            return 'NO_INTERESADO'
        case 'NUEVO':
        case 'VISITADO':
            return 'POR_VISITAR'
        case 'INTERESADO':
        case 'SEGUIMIENTO': {
            // La fecha para volver manda: si ya llegó (o se pasó), toca ir; si falta, está agendado o simplemente interesado.
            if (p.proximaVisita && diasDesde(p.proximaVisita, hoy) >= 0) return 'POR_VISITAR'
            if (p.estado === 'SEGUIMIENTO') return p.proximaVisita ? 'AGENDADO' : 'POR_VISITAR'
            return 'INTERESADO'
        }
    }
}

/** Por qué toca ir a un negocio de la categoría «Por visitar», en una frase. */
export const razonPorVisitar = (p: Pick<PuntoDeMapa, 'estado' | 'proximaVisita' | 'ultimaVisita'>, hoy: Date = new Date()): string => {
    if (p.proximaVisita) {
        const atraso = diasDesde(p.proximaVisita, hoy)
        if (atraso === 0) return 'Tocaba volver hoy'
        if (atraso > 0) return `Tocaba volver el ${fechaDia(aFechaIso(new Date(p.proximaVisita)))} (hace ${atraso} ${atraso === 1 ? 'día' : 'días'})`
    }
    if (!p.ultimaVisita) return 'Registrado, sin visitar todavía'
    if (p.estado === 'VISITADO') return 'No había nadie: hay que volver'
    return 'Dijo «quizás» y no dejó fecha para volver'
}

export interface ConteoMapa {
    porCategoria: Record<CategoriaMapa, number>
    /** Con al menos una visita. */
    visitados: number
    total: number
}

export const contarMapa = (puntos: PuntoDeMapa[], hoy: Date = new Date()): ConteoMapa => {
    const porCategoria = Object.fromEntries(CATEGORIAS_MAPA.map((c) => [c.id, 0])) as Record<CategoriaMapa, number>
    let visitados = 0
    for (const p of puntos) {
        porCategoria[categoriaDePunto(p, hoy)]++
        if (p.ultimaVisita) visitados++
    }
    return { porCategoria, visitados, total: puntos.length }
}
