import type {
    DefinicionCuestionario,
    OpcionPregunta,
    PreguntaCuestionario,
    SeccionCuestionario,
    TipoPregunta,
} from '../interfaces/prospectos.interface'

/**
 * El cuestionario como se edita en pantalla.
 *
 * Las **claves (`id`) de lo que ya estaba publicado no se tocan nunca**: las respuestas de los agentes se guardan por
 * id de pregunta, y cambiarlo rompería la comparación con lo contestado antes. Lo que se agrega nuevo no tiene id
 * hasta publicar; entonces se saca del texto (`aDefinicion`). Cambiar el texto de una pregunta que ya existe sí es libre.
 */
export interface OpcionEditable {
    /** Identidad dentro del editor (para las listas de React); no viaja al servidor. */
    clave: string
    /** El id ya publicado, o `undefined` si es nuevo. */
    id?: string
    texto: string
}

export interface PreguntaEditable {
    clave: string
    id?: string
    texto: string
    tipo: TipoPregunta
    opciones: OpcionEditable[]
}

export interface SeccionEditable {
    clave: string
    id?: string
    titulo: string
    preguntas: PreguntaEditable[]
}

export interface CuestionarioEditable {
    secciones: SeccionEditable[]
    motivosNo: OpcionEditable[]
}

export const TIPOS_PREGUNTA: { valor: TipoPregunta; etiqueta: string }[] = [
    { valor: 'OPCION', etiqueta: 'Elegir una opción' },
    { valor: 'MULTIPLE', etiqueta: 'Elegir varias' },
    { valor: 'SI_NO', etiqueta: 'Sí o no' },
    { valor: 'TEXTO', etiqueta: 'Texto libre' },
    { valor: 'NUMERO', etiqueta: 'Número' },
]

export const llevaOpciones = (tipo: TipoPregunta): boolean => tipo === 'OPCION' || tipo === 'MULTIPLE'

let contador = 0
export const nuevaClave = (): string => `k${++contador}`

/** «¿Cuántos clientes atiende al día?» → `cuantos_clientes_atiende_al_dia`. Sin acentos, en minúsculas, máximo 40. */
export const aClave = (texto: string, mayusculas = false): string => {
    const base = texto
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40)
        .replace(/_+$/g, '')
    const clave = base || 'item'
    return mayusculas ? clave.toUpperCase() : clave
}

/** Devuelve una clave que no esté en `usadas` (agrega `_2`, `_3`…) y la anota. */
const unica = (clave: string, usadas: Set<string>): string => {
    let candidata = clave
    let n = 2
    while (usadas.has(candidata)) {
        const sufijo = `_${n++}`
        candidata = clave.slice(0, 40 - sufijo.length) + sufijo
    }
    usadas.add(candidata)
    return candidata
}

export const desdeDefinicion = (def: DefinicionCuestionario): CuestionarioEditable => ({
    secciones: def.secciones.map((s) => ({
        clave: nuevaClave(),
        id: s.id,
        titulo: s.titulo,
        preguntas: s.preguntas.map((p) => ({
            clave: nuevaClave(),
            id: p.id,
            texto: p.texto,
            tipo: p.tipo,
            opciones: (p.opciones ?? []).map((o) => ({ clave: nuevaClave(), id: o.id, texto: o.texto })),
        })),
    })),
    motivosNo: def.motivosNo.map((m) => ({ clave: nuevaClave(), id: m.id, texto: m.texto })),
})

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

const lista = (v: unknown, donde: string): unknown[] => {
    if (!Array.isArray(v)) throw new Error(`${donde}: falta la lista.`)
    return v
}

const textoDe = (v: Record<string, unknown>, campo: string, donde: string): string => {
    const valor = v[campo]
    if (typeof valor !== 'string') throw new Error(`${donde}: falta «${campo}».`)
    return valor
}

/** El `id` si viene; si no, queda sin id y se saca del texto al publicar, como lo nuevo que se agrega a mano. */
const idDe = (v: Record<string, unknown>): string | undefined => (typeof v.id === 'string' && v.id.trim() ? v.id.trim() : undefined)

const opcionesDe = (v: unknown, donde: string): OpcionEditable[] =>
    lista(v, donde).map((o, k) => {
        if (!esObjeto(o)) throw new Error(`${donde}, opción ${k + 1}: no es un objeto.`)
        return { clave: nuevaClave(), id: idDe(o), texto: textoDe(o, 'texto', `${donde}, opción ${k + 1}`) }
    })

/**
 * Lee un cuestionario escrito a mano en JSON, para revisarlo en el editor antes de publicarlo. Acepta la definición
 * sola o envuelta como el cuerpo del POST (`{ "definicion": … }`). Solo revisa la forma: el servidor vuelve a
 * validar todo al publicar. Lanza un `Error` con lo que no se entendió.
 */
export const importarDefinicion = (json: string): CuestionarioEditable => {
    let leido: unknown
    try {
        leido = JSON.parse(json)
    } catch {
        throw new Error('El archivo no es un JSON válido.')
    }
    const def = esObjeto(leido) && esObjeto(leido.definicion) ? leido.definicion : leido
    if (!esObjeto(def)) throw new Error('El JSON debe ser un objeto con «secciones» y «motivosNo».')

    const tipos = new Set<string>(TIPOS_PREGUNTA.map((t) => t.valor))
    const secciones = lista(def.secciones, 'Secciones').map((s, i): SeccionEditable => {
        const donde = `Sección ${i + 1}`
        if (!esObjeto(s)) throw new Error(`${donde}: no es un objeto.`)
        return {
            clave: nuevaClave(),
            id: idDe(s),
            titulo: textoDe(s, 'titulo', donde),
            preguntas: lista(s.preguntas, `${donde}, preguntas`).map((p, j): PreguntaEditable => {
                const dondeP = `${donde}, pregunta ${j + 1}`
                if (!esObjeto(p)) throw new Error(`${dondeP}: no es un objeto.`)
                const tipo = textoDe(p, 'tipo', dondeP)
                if (!tipos.has(tipo)) throw new Error(`${dondeP}: el tipo «${tipo}» no existe.`)
                return {
                    clave: nuevaClave(),
                    id: idDe(p),
                    texto: textoDe(p, 'texto', dondeP),
                    tipo: tipo as TipoPregunta,
                    opciones: llevaOpciones(tipo as TipoPregunta) ? opcionesDe(p.opciones, `${dondeP}, opciones`) : [],
                }
            }),
        }
    })
    return { secciones, motivosNo: opcionesDe(def.motivosNo, 'Motivos de «no»') }
}

/**
 * Lo que se manda al servidor: ids conservados y ids nuevos sacados del texto, sin repetirse. Las preguntas y
 * secciones comparten espacio de ids con lo ya publicado (un id nuevo nunca pisa uno existente, aunque esté en otra sección).
 */
export const aDefinicion = (editable: CuestionarioEditable): DefinicionCuestionario => {
    const idsSecciones = new Set(editable.secciones.flatMap((s) => (s.id ? [s.id] : [])))
    const idsPreguntas = new Set(editable.secciones.flatMap((s) => s.preguntas.flatMap((p) => (p.id ? [p.id] : []))))

    const opciones = (lista: OpcionEditable[], mayusculas = false): OpcionPregunta[] => {
        const usadas = new Set(lista.flatMap((o) => (o.id ? [o.id] : [])))
        return lista.map((o) => ({
            id: o.id ?? unica(aClave(o.texto, mayusculas), usadas),
            texto: o.texto.trim(),
        }))
    }

    const secciones: SeccionCuestionario[] = editable.secciones.map((s) => ({
        id: s.id ?? unica(aClave(s.titulo), idsSecciones),
        titulo: s.titulo.trim(),
        preguntas: s.preguntas.map((p): PreguntaCuestionario => {
            const base: PreguntaCuestionario = {
                id: p.id ?? unica(aClave(p.texto), idsPreguntas),
                texto: p.texto.trim(),
                tipo: p.tipo,
            }
            return llevaOpciones(p.tipo) ? { ...base, opciones: opciones(p.opciones) } : base
        }),
    }))

    return { secciones, motivosNo: opciones(editable.motivosNo, true) }
}

/** Lo que falta corregir antes de publicar (el servidor vuelve a validar todo); `null` si está bien. */
export const problemaDe = (editable: CuestionarioEditable): string | null => {
    if (editable.secciones.length === 0) return 'Agrega al menos una sección.'
    for (const [i, s] of editable.secciones.entries()) {
        if (!s.titulo.trim()) return `Escribe el título de la sección ${i + 1}.`
        if (s.preguntas.length === 0) return `La sección «${s.titulo.trim()}» necesita al menos una pregunta.`
        for (const [j, p] of s.preguntas.entries()) {
            const donde = `Sección «${s.titulo.trim()}», pregunta ${j + 1}`
            if (!p.texto.trim()) return `${donde}: escribe la pregunta.`
            if (llevaOpciones(p.tipo)) {
                if (p.opciones.length < 2) return `${donde}: agrega al menos 2 opciones.`
                if (p.opciones.some((o) => !o.texto.trim())) return `${donde}: hay una opción vacía.`
            }
        }
    }
    if (editable.motivosNo.length === 0) return 'Agrega al menos un motivo por el que un negocio dice que no.'
    if (editable.motivosNo.some((m) => !m.texto.trim())) return 'Hay un motivo de «no» vacío.'
    return null
}

/** Mueve el elemento `desde` una posición (`-1` arriba, `1` abajo). Si no se puede, devuelve la misma lista. */
export const mover = <T>(lista: T[], desde: number, paso: -1 | 1): T[] => {
    const hasta = desde + paso
    if (hasta < 0 || hasta >= lista.length) return lista
    const copia = [...lista]
    ;[copia[desde], copia[hasta]] = [copia[hasta], copia[desde]]
    return copia
}
