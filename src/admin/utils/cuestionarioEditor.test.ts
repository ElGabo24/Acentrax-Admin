import { describe, expect, it } from 'vitest'
import type { DefinicionCuestionario } from '../interfaces/prospectos.interface'
import {
    aClave,
    aDefinicion,
    desdeDefinicion,
    mover,
    nuevaClave,
    problemaDe,
    type CuestionarioEditable,
} from './cuestionarioEditor'

const base: DefinicionCuestionario = {
    secciones: [
        {
            id: 'negocio',
            titulo: 'El negocio',
            preguntas: [
                {
                    id: 'empleados',
                    texto: '¿Cuántas personas trabajan?',
                    tipo: 'OPCION',
                    opciones: [
                        { id: '1', texto: 'Solo el dueño' },
                        { id: '2_3', texto: '2 a 3' },
                    ],
                },
                { id: 'local', texto: '¿Tiene más de un local?', tipo: 'SI_NO' },
            ],
        },
    ],
    motivosNo: [{ id: 'PRECIO', texto: 'Le parece caro' }],
}

describe('aClave', () => {
    it('quita acentos y signos y usa guion bajo', () => {
        expect(aClave('¿Cuántos clientes atiende al día?')).toBe('cuantos_clientes_atiende_al_dia')
    })

    it('respeta el máximo de 40 caracteres sin dejar un guion colgando', () => {
        const clave = aClave('una pregunta muy muy larga que no cabe en la clave del servidor de verdad')
        expect(clave.length).toBeLessThanOrEqual(40)
        expect(clave.endsWith('_')).toBe(false)
    })

    it('un texto sin letras ni números no se queda sin clave', () => {
        expect(aClave('¿¿¿???')).toBe('item')
    })

    it('puede salir en mayúsculas (motivos de no)', () => {
        expect(aClave('No le hace falta', true)).toBe('NO_LE_HACE_FALTA')
    })
})

describe('ida y vuelta', () => {
    it('sin tocar nada devuelve exactamente lo publicado', () => {
        expect(aDefinicion(desdeDefinicion(base))).toEqual(base)
    })

    it('los ids ya publicados no cambian aunque cambie el texto', () => {
        const e = desdeDefinicion(base)
        e.secciones[0].preguntas[0].texto = '¿Cuánta gente trabaja aquí?'
        e.secciones[0].titulo = 'Sobre el negocio'

        const d = aDefinicion(e)

        expect(d.secciones[0].id).toBe('negocio')
        expect(d.secciones[0].preguntas[0].id).toBe('empleados')
        expect(d.secciones[0].preguntas[0].texto).toBe('¿Cuánta gente trabaja aquí?')
    })

    it('lo nuevo saca su id del texto', () => {
        const e = desdeDefinicion(base)
        e.secciones[0].preguntas.push({ clave: nuevaClave(), texto: '¿Acepta tarjeta?', tipo: 'SI_NO', opciones: [] })
        e.motivosNo.push({ clave: nuevaClave(), texto: 'No tiene tiempo' })

        const d = aDefinicion(e)

        expect(d.secciones[0].preguntas[2].id).toBe('acepta_tarjeta')
        expect(d.motivosNo[1].id).toBe('NO_TIENE_TIEMPO')
    })

    it('un id nuevo nunca pisa uno existente ni uno de otra pregunta nueva', () => {
        const e = desdeDefinicion(base)
        const nueva = (texto: string) => ({ clave: nuevaClave(), texto, tipo: 'SI_NO' as const, opciones: [] })
        e.secciones[0].preguntas.push(nueva('Local'), nueva('Local'), nueva('¿Local?'))

        const ids = aDefinicion(e).secciones[0].preguntas.map((p) => p.id)

        expect(ids).toEqual(['empleados', 'local', 'local_2', 'local_3', 'local_4'])
    })

    it('las opciones nuevas no repiten ids dentro de su pregunta', () => {
        const e = desdeDefinicion(base)
        const pregunta = e.secciones[0].preguntas[0]
        pregunta.opciones.push({ clave: nuevaClave(), texto: '2 a 3' }, { clave: nuevaClave(), texto: '2 a 3' })

        const ids = aDefinicion(e).secciones[0].preguntas[0].opciones!.map((o) => o.id)

        expect(ids).toEqual(['1', '2_3', '2_a_3', '2_a_3_2'])
    })

    it('al cambiar el tipo a uno sin opciones se descartan', () => {
        const e = desdeDefinicion(base)
        e.secciones[0].preguntas[0].tipo = 'TEXTO'

        expect(aDefinicion(e).secciones[0].preguntas[0]).toEqual({ id: 'empleados', texto: '¿Cuántas personas trabajan?', tipo: 'TEXTO' })
    })

    it('recorta los textos', () => {
        const e = desdeDefinicion(base)
        e.motivosNo[0].texto = '  Le parece caro  '

        expect(aDefinicion(e).motivosNo[0].texto).toBe('Le parece caro')
    })
})

describe('problemaDe', () => {
    const editable = (): CuestionarioEditable => desdeDefinicion(base)

    it('un cuestionario completo no tiene problemas', () => {
        expect(problemaDe(editable())).toBeNull()
    })

    it('dice qué falta y dónde', () => {
        const sinTitulo = editable()
        sinTitulo.secciones[0].titulo = '  '
        expect(problemaDe(sinTitulo)).toBe('Escribe el título de la sección 1.')

        const sinOpciones = editable()
        sinOpciones.secciones[0].preguntas[0].opciones = [sinOpciones.secciones[0].preguntas[0].opciones[0]]
        expect(problemaDe(sinOpciones)).toContain('al menos 2 opciones')

        const sinMotivos = editable()
        sinMotivos.motivosNo = []
        expect(problemaDe(sinMotivos)).toContain('motivo')

        const sinPreguntas = editable()
        sinPreguntas.secciones[0].preguntas = []
        expect(problemaDe(sinPreguntas)).toContain('al menos una pregunta')
    })

    it('una pregunta de sí o no no pide opciones', () => {
        const e = editable()
        e.secciones[0].preguntas[1].opciones = []

        expect(problemaDe(e)).toBeNull()
    })
})

describe('mover', () => {
    it('sube y baja un elemento', () => {
        expect(mover(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
        expect(mover(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b'])
    })

    it('en los extremos no hace nada', () => {
        const lista = ['a', 'b']
        expect(mover(lista, 0, -1)).toBe(lista)
        expect(mover(lista, 1, 1)).toBe(lista)
    })
})
