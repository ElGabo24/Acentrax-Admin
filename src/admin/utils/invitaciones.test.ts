import { describe, expect, it } from 'vitest'
import { invitacionesPorInteres } from './prospectos'

const inv = (nombre: string, ultimaAperturaEn: string | null) => ({ nombre, ultimaAperturaEn })

describe('invitacionesPorInteres', () => {
    it('pone primero las que el dueño abrió, la apertura más reciente arriba', () => {
        const orden = invitacionesPorInteres([
            inv('sin abrir A', null),
            inv('abierta ayer', '2026-11-01T10:00:00Z'),
            inv('sin abrir B', null),
            inv('abierta hoy', '2026-11-02T10:00:00Z'),
        ])

        expect(orden.map((i) => i.nombre)).toEqual(['abierta hoy', 'abierta ayer', 'sin abrir A', 'sin abrir B'])
    })

    it('conserva el orden de llegada cuando nadie abrió nada y no toca la lista original', () => {
        const original = [inv('uno', null), inv('dos', null), inv('tres', null)]

        expect(invitacionesPorInteres(original).map((i) => i.nombre)).toEqual(['uno', 'dos', 'tres'])
        expect(original.map((i) => i.nombre)).toEqual(['uno', 'dos', 'tres'])
    })
})
