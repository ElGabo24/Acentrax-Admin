import { useCuestionario } from '../queries/prospectos.queries'
import { textoDeRespuesta } from '../utils/prospectos'

interface Props {
    cuestionarioId: number
    respuestas: Record<string, unknown>
}

/**
 * Las respuestas de una visita con el texto de cada pregunta, en el orden del cuestionario con el que se
 * contestaron (la versión puede ser anterior a la vigente). Si la definición no llega, se muestran los ids:
 * mejor eso que esconder lo que el negocio dijo.
 */
export const RespuestasVisita = ({ cuestionarioId, respuestas }: Props) => {
    const { data, isLoading, isError } = useCuestionario(cuestionarioId)

    if (isLoading) return <p className="text-xs text-muted-foreground">Cargando respuestas…</p>

    if (isError || !data) {
        return (
            <dl className="space-y-1 text-sm">
                {Object.entries(respuestas).map(([id, valor]) => (
                    <div key={id}>
                        <dt className="font-mono text-xs text-muted-foreground">{id}</dt>
                        <dd>{JSON.stringify(valor)}</dd>
                    </div>
                ))}
            </dl>
        )
    }

    const conocidas = new Set(data.definicion.secciones.flatMap((s) => s.preguntas.map((p) => p.id)))
    // Una clave que la definición no trae (no debería) se enseña igual, al final.
    const sueltas = Object.entries(respuestas).filter(([id]) => !conocidas.has(id))

    return (
        <div className="space-y-3">
            {data.definicion.secciones.map((seccion) => {
                const filas = seccion.preguntas
                    .map((p) => ({ pregunta: p, texto: textoDeRespuesta(p, respuestas[p.id]) }))
                    .filter((f) => f.texto !== null)
                if (filas.length === 0) return null
                return (
                    <section key={seccion.id}>
                        <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{seccion.titulo}</h4>
                        <dl className="mt-1 space-y-1.5">
                            {filas.map(({ pregunta, texto }) => (
                                <div key={pregunta.id} className="text-sm">
                                    <dt className="text-muted-foreground">{pregunta.texto}</dt>
                                    <dd className="font-medium">{texto}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                )
            })}
            {sueltas.length > 0 && (
                <dl className="space-y-1 text-sm">
                    {sueltas.map(([id, valor]) => (
                        <div key={id}>
                            <dt className="font-mono text-xs text-muted-foreground">{id}</dt>
                            <dd>{JSON.stringify(valor)}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    )
}
