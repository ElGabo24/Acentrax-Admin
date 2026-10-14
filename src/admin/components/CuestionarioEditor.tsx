import { useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { mensajeDeError } from '@/api/apiError'
import type { DefinicionCuestionario, TipoPregunta } from '../interfaces/prospectos.interface'
import { usePublicarCuestionario } from '../queries/prospectos.queries'
import {
    aDefinicion,
    desdeDefinicion,
    llevaOpciones,
    mover,
    nuevaClave,
    problemaDe,
    TIPOS_PREGUNTA,
    type CuestionarioEditable,
    type OpcionEditable,
    type PreguntaEditable,
    type SeccionEditable,
} from '../utils/cuestionarioEditor'

const input = 'field w-full'

interface Props {
    /** La versión vigente: de aquí parte la nueva. */
    inicial: DefinicionCuestionario
    onCancelar: () => void
    onPublicado: () => void
}

/** Un botón de icono para subir, bajar o quitar un elemento de una lista. */
const Accion = ({ etiqueta, onClick, disabled, children }: { etiqueta: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={etiqueta} title={etiqueta} disabled={disabled} onClick={onClick}>
        {children}
    </Button>
)

/**
 * Edita el cuestionario que aplican los agentes. Publicar crea una versión nueva y la deja vigente: la app la baja sola
 * en la siguiente sincronización, sin actualizar nada en los teléfonos. Las versiones anteriores se conservan.
 */
export const CuestionarioEditor = ({ inicial, onCancelar, onPublicado }: Props) => {
    const [editable, setEditable] = useState<CuestionarioEditable>(() => desdeDefinicion(inicial))

    const problema = problemaDe(editable)
    const publicar = usePublicarCuestionario({
        onSuccess: (c) => {
            toast.success(`Versión ${c.version} publicada. Las apps la toman en su próxima sincronización.`)
            onPublicado()
        },
    })

    const error = publicar.error ? mensajeDeError(publicar.error, 'No se pudo publicar el cuestionario.') : null

    const cambiarSeccion = (indice: number, cambio: (s: SeccionEditable) => SeccionEditable) =>
        setEditable((e) => ({ ...e, secciones: e.secciones.map((s, i) => (i === indice ? cambio(s) : s)) }))

    const cambiarPregunta = (si: number, pi: number, cambio: (p: PreguntaEditable) => PreguntaEditable) =>
        cambiarSeccion(si, (s) => ({ ...s, preguntas: s.preguntas.map((p, i) => (i === pi ? cambio(p) : p)) }))

    const nuevaPregunta = (): PreguntaEditable => ({ clave: nuevaClave(), texto: '', tipo: 'SI_NO', opciones: [] })

    const cambiarTipo = (tipo: TipoPregunta, p: PreguntaEditable): PreguntaEditable => ({
        ...p,
        tipo,
        // Al pasar a una de opciones se arranca con dos vacías para que se vea qué falta; al salir se conservan por si se arrepiente.
        opciones: llevaOpciones(tipo) && p.opciones.length === 0
            ? [{ clave: nuevaClave(), texto: '' }, { clave: nuevaClave(), texto: '' }]
            : p.opciones,
    })

    return (
        <div className="space-y-5">
            {editable.secciones.map((seccion, si) => (
                <section key={seccion.clave} className="surface space-y-3 p-4">
                    <div className="flex items-center gap-2">
                        <input
                            className={cn(input, 'font-semibold')}
                            placeholder="Título de la sección (por ejemplo, «Cómo trabaja hoy»)"
                            value={seccion.titulo}
                            onChange={(e) => cambiarSeccion(si, (s) => ({ ...s, titulo: e.target.value }))}
                        />
                        <Accion etiqueta="Subir sección" disabled={si === 0} onClick={() => setEditable((e) => ({ ...e, secciones: mover(e.secciones, si, -1) }))}>
                            <ArrowUp />
                        </Accion>
                        <Accion etiqueta="Bajar sección" disabled={si === editable.secciones.length - 1} onClick={() => setEditable((e) => ({ ...e, secciones: mover(e.secciones, si, 1) }))}>
                            <ArrowDown />
                        </Accion>
                        <Accion etiqueta="Quitar sección" onClick={() => setEditable((e) => ({ ...e, secciones: e.secciones.filter((_, i) => i !== si) }))}>
                            <Trash2 />
                        </Accion>
                    </div>

                    {seccion.preguntas.map((pregunta, pi) => (
                        <div key={pregunta.clave} className="space-y-2 rounded-lg border p-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    className={cn(input, 'min-w-56 flex-1')}
                                    placeholder="La pregunta"
                                    value={pregunta.texto}
                                    onChange={(e) => cambiarPregunta(si, pi, (p) => ({ ...p, texto: e.target.value }))}
                                />
                                <select
                                    className="field"
                                    aria-label="Tipo de respuesta"
                                    value={pregunta.tipo}
                                    onChange={(e) => cambiarPregunta(si, pi, (p) => cambiarTipo(e.target.value as TipoPregunta, p))}
                                >
                                    {TIPOS_PREGUNTA.map((t) => (
                                        <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                                    ))}
                                </select>
                                <Accion etiqueta="Subir pregunta" disabled={pi === 0} onClick={() => cambiarSeccion(si, (s) => ({ ...s, preguntas: mover(s.preguntas, pi, -1) }))}>
                                    <ArrowUp />
                                </Accion>
                                <Accion etiqueta="Bajar pregunta" disabled={pi === seccion.preguntas.length - 1} onClick={() => cambiarSeccion(si, (s) => ({ ...s, preguntas: mover(s.preguntas, pi, 1) }))}>
                                    <ArrowDown />
                                </Accion>
                                <Accion etiqueta="Quitar pregunta" onClick={() => cambiarSeccion(si, (s) => ({ ...s, preguntas: s.preguntas.filter((_, i) => i !== pi) }))}>
                                    <Trash2 />
                                </Accion>
                            </div>
                            {pregunta.id && (
                                <p className="text-xs text-muted-foreground">
                                    Clave <span className="font-mono">{pregunta.id}</span>: no cambia, así las respuestas de antes se siguen comparando con las nuevas.
                                </p>
                            )}

                            {llevaOpciones(pregunta.tipo) && (
                                <ListaDeOpciones
                                    titulo="Opciones"
                                    opciones={pregunta.opciones}
                                    onChange={(opciones) => cambiarPregunta(si, pi, (p) => ({ ...p, opciones }))}
                                />
                            )}
                        </div>
                    ))}

                    <Button type="button" variant="outline" size="sm" onClick={() => cambiarSeccion(si, (s) => ({ ...s, preguntas: [...s.preguntas, nuevaPregunta()] }))}>
                        <Plus /> Agregar pregunta
                    </Button>
                </section>
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={() =>
                    setEditable((e) => ({ ...e, secciones: [...e.secciones, { clave: nuevaClave(), titulo: '', preguntas: [nuevaPregunta()] }] }))
                }
            >
                <Plus /> Agregar sección
            </Button>

            <section className="surface space-y-2 p-4">
                <ListaDeOpciones
                    titulo="Motivos por los que un negocio dice que no"
                    ayuda="Es la lista que el agente elige cuando el resultado de la visita es «No le interesa»."
                    opciones={editable.motivosNo}
                    onChange={(motivosNo) => setEditable((e) => ({ ...e, motivosNo }))}
                    agregar="Agregar motivo"
                />
            </section>

            {(error ?? problema) && (
                <p role="alert" className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
                    {error ?? problema}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
                <Button type="button" disabled={problema !== null || publicar.isPending} onClick={() => publicar.mutate(aDefinicion(editable))}>
                    {publicar.isPending && <Loader2 className="animate-spin" />}
                    Publicar nueva versión
                </Button>
            </div>
        </div>
    )
}

const ListaDeOpciones = ({
    titulo,
    ayuda,
    opciones,
    onChange,
    agregar = 'Agregar opción',
}: {
    titulo: string
    ayuda?: string
    opciones: OpcionEditable[]
    onChange: (opciones: OpcionEditable[]) => void
    agregar?: string
}) => (
    <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
        {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
        {opciones.map((o, i) => (
            <div key={o.clave} className="flex items-center gap-1">
                <input
                    className={input}
                    placeholder={`Opción ${i + 1}`}
                    aria-label={`${titulo}, opción ${i + 1}`}
                    value={o.texto}
                    onChange={(e) => onChange(opciones.map((x, k) => (k === i ? { ...x, texto: e.target.value } : x)))}
                />
                <Accion etiqueta="Subir" disabled={i === 0} onClick={() => onChange(mover(opciones, i, -1))}><ArrowUp /></Accion>
                <Accion etiqueta="Bajar" disabled={i === opciones.length - 1} onClick={() => onChange(mover(opciones, i, 1))}><ArrowDown /></Accion>
                <Accion etiqueta="Quitar" onClick={() => onChange(opciones.filter((_, k) => k !== i))}><Trash2 /></Accion>
            </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...opciones, { clave: nuevaClave(), texto: '' }])}>
            <Plus /> {agregar}
        </Button>
    </div>
)
