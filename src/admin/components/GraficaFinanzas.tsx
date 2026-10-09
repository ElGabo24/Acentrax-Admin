import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { FinanzasMes } from '../interfaces/finanzas.interface'
import { dinero, dineroCompacto, mesCorto, mesLabel } from '../utils/formato'

/** Alto del área de barras; más alto donde la tarjeta tiene espacio de sobra. */
const ALTO = 'h-60 xl:h-72'

/** Paso «redondo» (1, 2 o 5 × 10ⁿ) para que el eje caiga en 0, 250, 500… y no en 0, 237, 474. */
const pasoRedondo = (rango: number, marcas: number): number => {
    const bruto = rango / marcas
    const potencia = 10 ** Math.floor(Math.log10(bruto))
    const f = bruto / potencia
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * potencia
}

/** Techo, piso y marcas del eje. El cero siempre entra: las barras crecen desde ahí. */
const crearEje = (valores: number[]) => {
    const max = Math.max(0, ...valores)
    const min = Math.min(0, ...valores)
    if (max === 0 && min === 0) return { techo: 100, piso: 0, marcas: [0, 50, 100], vacio: true }

    const paso = pasoRedondo(max - min, 4)
    const techo = Math.ceil(max / paso) * paso
    const piso = Math.floor(min / paso) * paso
    const marcas: number[] = []
    for (let v = piso; v <= techo + paso / 2; v += paso) marcas.push(Math.round(v * 100) / 100)
    return { techo, piso, marcas, vacio: false }
}

const dineroMxn = (monto: number) => dinero(monto, 'MXN', 0)

/** Cifras completas ($1,000) mientras quepan; en miles de miles, compactas. */
const etiquetaEje = (monto: number) => (Math.abs(monto) >= 100_000 ? dineroCompacto(monto) : dineroMxn(monto))

interface BarraProps {
    valor: number
    /** Posición del cero, en % desde arriba. */
    cero: number
    /** Alto de un 1 de valor, en %. */
    porUnidad: number
    className: string
    /** Retraso de la animación de entrada, para que las columnas entren en cascada. */
    retraso: number
}

/**
 * Crece desde la línea del cero: hacia arriba si es positiva, hacia abajo si es pérdida.
 * Un cero no dibuja nada: ya está la línea del eje, y una raya de color se leería como dato.
 */
const Barra = ({ valor, cero, porUnidad, className, retraso }: BarraProps) => {
    const positiva = valor >= 0
    return (
        <span className="relative h-full w-[min(40%,1.5rem)]">
            {valor !== 0 && (
                <span
                    className={cn(
                        'barra-crece absolute inset-x-0 min-h-0.5',
                        positiva ? 'origin-bottom rounded-t-[4px]' : 'origin-top rounded-b-[4px]',
                        className
                    )}
                    style={{
                        height: `${Math.abs(valor) * porUnidad}%`,
                        animationDelay: `${retraso}ms`,
                        ...(positiva ? { bottom: `${100 - cero}%` } : { top: `${cero}%` }),
                    }}
                />
            )}
        </span>
    )
}

/** Una línea del tooltip: marca de color corta, nombre y cifra (la cifra manda). */
const FilaTooltip = ({ color, etiqueta, valor }: { color: string; etiqueta: string; valor: string }) => (
    <div className="flex items-center justify-between gap-3">
        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden className={cn('h-0.5 w-3 rounded-full', color)} /> {etiqueta}
        </dt>
        <dd className="text-sm font-semibold tabular-nums">{valor}</dd>
    </div>
)

interface Props {
    meses: FinanzasMes[]
    /** `yyyy-MM` del mes elegido; se resalta su columna. */
    seleccionado: string
    onSeleccionar: (mes: string) => void
    /** `yyyy-MM` del mes que aún no termina; el tooltip lo avisa. */
    mesEnCurso?: string
}

/**
 * Ingreso bruto contra utilidad neta, mes por mes. Cada columna es un botón: elige
 * el mes del resumen, y al pasar el puntero o enfocarla muestra sus cifras (con lo que
 * explica la diferencia entre las dos barras: comisión y gastos). Las cifras exactas
 * de todos los meses están también en la tabla de al lado.
 */
export const GraficaFinanzas = ({ meses, seleccionado, onSeleccionar, mesEnCurso }: Props) => {
    const [activo, setActivo] = useState<number | null>(null)

    if (meses.length === 0) return null

    const { techo, piso, marcas, vacio } = crearEje(meses.flatMap((m) => [m.ingresoBruto, m.utilidadNeta]))
    const span = techo - piso
    const y = (valor: number) => ((techo - valor) / span) * 100
    const cero = y(0)
    const porUnidad = 100 / span
    const hayPerdida = meses.some((m) => m.utilidadNeta < 0)
    const mesActivo = activo !== null ? meses[activo] : null
    // Con más de 6 meses, en pantalla estrecha no caben todas las etiquetas. Siempre se ven las «anclas»
    // (la primera, enero que lleva el año, la última y el mes elegido); del resto, una sí y otra no, y
    // ninguna pegada a un ancla.
    const apretado = meses.length > 6
    const iElegido = meses.findIndex((m) => m.mes === seleccionado)
    const esAncla = (i: number) =>
        i >= 0 && i < meses.length && (i === 0 || i === meses.length - 1 || i === iElegido || meses[i].mes.endsWith('-01'))
    const sobra = (i: number) =>
        apretado && !esAncla(i) && ((meses.length - 1 - i) % 2 === 1 || esAncla(i - 1) || esAncla(i + 1))

    // Flechas, inicio y fin recorren los meses: con 12 columnas, Tab solo sería una parada por cada mes.
    const moverFoco = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        const columna = e.currentTarget
        const destino =
            e.key === 'ArrowRight' ? columna.nextElementSibling
            : e.key === 'ArrowLeft' ? columna.previousElementSibling
            : e.key === 'Home' ? columna.parentElement?.firstElementChild
            : e.key === 'End' ? columna.parentElement?.lastElementChild
            : null
        if (destino instanceof HTMLElement) {
            e.preventDefault()
            destino.focus()
        }
    }

    return (
        <figure className="space-y-3">
            <div role="group" aria-label="Ingreso bruto y utilidad neta por mes. Elige un mes para ver su resumen.">
                <div className="flex pt-2">
                    {/* Eje vertical: solo las marcas que sirven de referencia. */}
                    <div className={cn('relative w-14 shrink-0', ALTO)} aria-hidden>
                        {marcas.map((marca) => (
                            <span
                                key={marca}
                                className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground tabular-nums"
                                style={{ top: `${y(marca)}%` }}
                            >
                                {etiquetaEje(marca)}
                            </span>
                        ))}
                    </div>

                    <div className={cn('relative flex-1', ALTO)}>
                        {/* Rejilla: hairlines sólidos y recesivos; el cero un poco más firme. */}
                        {marcas.map((marca) => (
                            <span
                                key={marca}
                                aria-hidden
                                className={cn('absolute inset-x-0 border-t', marca === 0 ? 'border-foreground/25' : 'border-border')}
                                style={{ top: `${y(marca)}%` }}
                            />
                        ))}

                        <div className="absolute inset-0 flex">
                            {meses.map((m, i) => (
                                <button
                                    key={m.mes}
                                    type="button"
                                    aria-pressed={m.mes === seleccionado}
                                    aria-label={`${mesLabel(m.mes)}: ingreso ${dineroMxn(m.ingresoBruto)}, utilidad ${dineroMxn(m.utilidadNeta)}`}
                                    onClick={() => onSeleccionar(m.mes)}
                                    onKeyDown={moverFoco}
                                    onPointerEnter={() => setActivo(i)}
                                    onPointerLeave={() => setActivo(null)}
                                    onFocus={() => setActivo(i)}
                                    onBlur={() => setActivo(null)}
                                    className={cn(
                                        'relative h-full min-w-0 flex-1 cursor-pointer rounded-md outline-none transition-colors',
                                        'focus-visible:ring-3 focus-visible:ring-ring/50',
                                        m.mes === seleccionado ? 'bg-muted' : 'hover:bg-muted/60'
                                    )}
                                >
                                    {/* Al mirar una columna, las demás bajan de tono: el ojo se queda en la que importa.
                                        Una separación de 2 px entre las dos barras: el aire separa, no un borde. */}
                                    <span
                                        className={cn(
                                            'absolute inset-0 flex justify-center gap-0.5 transition-opacity duration-150',
                                            activo !== null && activo !== i && 'opacity-40'
                                        )}
                                        aria-hidden
                                    >
                                        <Barra valor={m.ingresoBruto} cero={cero} porUnidad={porUnidad} retraso={i * 40} className="bg-chart-1" />
                                        <Barra
                                            valor={m.utilidadNeta}
                                            cero={cero}
                                            porUnidad={porUnidad}
                                            retraso={i * 40}
                                            className={m.utilidadNeta >= 0 ? 'bg-chart-2' : 'bg-destructive'}
                                        />
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Después de las columnas: así la banda del mes elegido no tapa el texto. */}
                        {vacio && (
                            <p className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] -translate-y-full pb-2 text-center text-sm text-muted-foreground">
                                Sin ingresos ni gastos en este rango.
                            </p>
                        )}

                        {mesActivo && (
                            <div
                                aria-hidden
                                className="pointer-events-none absolute top-1 z-10 w-52 rounded-lg border bg-card p-3 shadow-md"
                                // Centrado sobre su columna, sin salirse del área de la gráfica.
                                style={{ left: `clamp(0px, calc(${((activo! + 0.5) / meses.length) * 100}% - 6.5rem), calc(100% - 13rem))` }}
                            >
                                <p className="text-xs text-muted-foreground capitalize">
                                    {mesLabel(mesActivo.mes)}
                                    {mesActivo.mes === mesEnCurso && <span className="normal-case"> · en curso</span>}
                                </p>
                                <dl className="mt-1.5 space-y-1">
                                    <FilaTooltip color="bg-chart-1" etiqueta="Ingreso bruto" valor={dineroMxn(mesActivo.ingresoBruto)} />
                                    <FilaTooltip
                                        color={mesActivo.utilidadNeta >= 0 ? 'bg-chart-2' : 'bg-destructive'}
                                        etiqueta={mesActivo.utilidadNeta >= 0 ? 'Utilidad neta' : 'Pérdida'}
                                        valor={dineroMxn(mesActivo.utilidadNeta)}
                                    />
                                </dl>
                                {/* Lo que explica la diferencia entre las dos barras. */}
                                {(mesActivo.comisionEstimada > 0 || mesActivo.gastosOperativos > 0) && (
                                    <dl className="mt-2 space-y-0.5 border-t pt-2 text-xs text-muted-foreground">
                                        {mesActivo.comisionEstimada > 0 && (
                                            <div className="flex justify-between gap-3">
                                                <dt>Comisión (est.)</dt>
                                                <dd className="tabular-nums">−{dineroMxn(mesActivo.comisionEstimada)}</dd>
                                            </div>
                                        )}
                                        {mesActivo.gastosOperativos > 0 && (
                                            <div className="flex justify-between gap-3">
                                                <dt>Gastos</dt>
                                                <dd className="tabular-nums">−{dineroMxn(mesActivo.gastosOperativos)}</dd>
                                            </div>
                                        )}
                                    </dl>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Etiquetas del eje horizontal: el año solo donde cambia, para que no se amontonen. */}
                <div className="ml-14 flex" aria-hidden>
                    {meses.map((m, i) => {
                        const ponerAnio = i === 0 || m.mes.endsWith('-01')
                        return (
                            <span
                                key={m.mes}
                                className={cn(
                                    'min-w-0 flex-1 pt-1.5 text-center text-[11px] leading-tight capitalize',
                                    m.mes === seleccionado ? 'font-semibold text-foreground' : 'text-muted-foreground',
                                    // `invisible` y no `hidden`: así la columna conserva su ancho y no se corre el resto.
                                    sobra(i) && 'max-sm:invisible'
                                )}
                            >
                                {mesCorto(m.mes)}
                                {ponerAnio && <span className="block text-[10px] font-normal opacity-70">{m.mes.slice(0, 4)}</span>}
                            </span>
                        )
                    })}
                </div>
            </div>

            <figcaption className="flex flex-wrap gap-x-4 gap-y-1 pl-14 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-chart-1" /> Ingreso bruto</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-chart-2" /> Utilidad neta</span>
                {hayPerdida && <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-destructive" /> Pérdida</span>}
            </figcaption>
        </figure>
    )
}
