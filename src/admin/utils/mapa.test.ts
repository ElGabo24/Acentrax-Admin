import { describe, expect, it } from 'vitest'
import type { PuntoDeMapa } from '../interfaces/prospectos.interface'
import { categoriaDePunto, contarMapa, razonPorVisitar } from './mapa'

// Hoy es el 20 de octubre de 2026 al mediodía (hora del navegador).
const hoy = new Date(2026, 9, 20, 12, 0)
const dia = (d: number, h = 12) => new Date(2026, 9, d, h, 0).toISOString()

const punto = (cambios: Partial<PuntoDeMapa>): PuntoDeMapa => ({
    id: 'x', nombreNegocio: 'Lety', giro: 'ABARROTES', estado: 'NUEVO', latitud: 19.7, longitud: -100.5, agente: 'Ana',
    ultimaVisita: null, proximaVisita: null, ...cambios,
})

describe('categoriaDePunto', () => {
    it('los clientes, los que arman su alta y los que dijeron que no tienen su propia categoría', () => {
        expect(categoriaDePunto(punto({ estado: 'CONVERTIDO' }), hoy)).toBe('CONTRATADO')
        expect(categoriaDePunto(punto({ estado: 'ALTA_BORRADOR' }), hoy)).toBe('EN_ALTA')
        expect(categoriaDePunto(punto({ estado: 'NO_INTERESADO' }), hoy)).toBe('NO_INTERESADO')
    })

    it('un negocio nuevo o donde no había nadie está por visitar', () => {
        expect(categoriaDePunto(punto({ estado: 'NUEVO' }), hoy)).toBe('POR_VISITAR')
        expect(categoriaDePunto(punto({ estado: 'VISITADO', ultimaVisita: dia(10) }), hoy)).toBe('POR_VISITAR')
    })

    it('un interesado sin fecha, o con fecha que falta, sigue como interesado', () => {
        expect(categoriaDePunto(punto({ estado: 'INTERESADO' }), hoy)).toBe('INTERESADO')
        expect(categoriaDePunto(punto({ estado: 'INTERESADO', proximaVisita: dia(25) }), hoy)).toBe('INTERESADO')
    })

    it('cuando llega la fecha para volver, toca ir aunque ya estuviera interesado', () => {
        expect(categoriaDePunto(punto({ estado: 'INTERESADO', proximaVisita: dia(20, 18) }), hoy)).toBe('POR_VISITAR')
        expect(categoriaDePunto(punto({ estado: 'INTERESADO', proximaVisita: dia(15) }), hoy)).toBe('POR_VISITAR')
    })

    it('un «quizás» con fecha futura está agendado y sin fecha hay que ir a ponerla', () => {
        expect(categoriaDePunto(punto({ estado: 'SEGUIMIENTO', proximaVisita: dia(28) }), hoy)).toBe('AGENDADO')
        expect(categoriaDePunto(punto({ estado: 'SEGUIMIENTO', proximaVisita: null }), hoy)).toBe('POR_VISITAR')
        expect(categoriaDePunto(punto({ estado: 'SEGUIMIENTO', proximaVisita: dia(18) }), hoy)).toBe('POR_VISITAR')
    })

    it('«hoy» es por día de calendario y no por hora', () => {
        // Más tarde hoy: ya toca (el agente sale en la mañana).
        expect(categoriaDePunto(punto({ estado: 'INTERESADO', proximaVisita: dia(20, 23) }), new Date(2026, 9, 20, 7, 0))).toBe('POR_VISITAR')
        // Mañana temprano: todavía no.
        expect(categoriaDePunto(punto({ estado: 'INTERESADO', proximaVisita: dia(21, 0) }), new Date(2026, 9, 20, 23, 30))).toBe('INTERESADO')
    })
})

describe('razonPorVisitar', () => {
    it('dice por qué toca ir', () => {
        expect(razonPorVisitar(punto({ ultimaVisita: null }), hoy)).toBe('Registrado, sin visitar todavía')
        expect(razonPorVisitar(punto({ estado: 'VISITADO', ultimaVisita: dia(10) }), hoy)).toBe('No había nadie: hay que volver')
        expect(razonPorVisitar(punto({ estado: 'SEGUIMIENTO', ultimaVisita: dia(10) }), hoy)).toContain('no dejó fecha')
        expect(razonPorVisitar(punto({ estado: 'INTERESADO', ultimaVisita: dia(10), proximaVisita: dia(20, 18) }), hoy)).toBe('Tocaba volver hoy')
        expect(razonPorVisitar(punto({ estado: 'INTERESADO', ultimaVisita: dia(10), proximaVisita: dia(17) }), hoy)).toContain('hace 3 días')
        expect(razonPorVisitar(punto({ estado: 'INTERESADO', ultimaVisita: dia(10), proximaVisita: dia(19) }), hoy)).toContain('hace 1 día)')
    })
})

describe('contarMapa', () => {
    it('cuenta por categoría y cuántos tienen al menos una visita', () => {
        const c = contarMapa(
            [
                punto({ estado: 'NUEVO' }),
                punto({ estado: 'CONVERTIDO', ultimaVisita: dia(5) }),
                punto({ estado: 'INTERESADO', ultimaVisita: dia(5), proximaVisita: dia(15) }),
                punto({ estado: 'NO_INTERESADO', ultimaVisita: dia(2) }),
            ],
            hoy
        )

        expect(c.total).toBe(4)
        expect(c.visitados).toBe(3)
        expect(c.porCategoria).toEqual({ CONTRATADO: 1, EN_ALTA: 0, POR_VISITAR: 2, AGENDADO: 0, INTERESADO: 0, NO_INTERESADO: 1 })
    })

    it('sin puntos todo es cero', () => {
        expect(contarMapa([], hoy).visitados).toBe(0)
    })
})
