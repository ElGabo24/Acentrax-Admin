import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/** Un punto ya listo para pintar: su color y lo que dice al pasarle el cursor. */
export interface PuntoPintado {
    id: string
    latitud: number
    longitud: number
    color: string
    etiqueta: string
}

interface Props {
    puntos: PuntoPintado[]
    onSeleccionar: (id: string) => void
    /**
     * El mapa solo se vuelve a encuadrar cuando esto cambia (otro filtro, datos nuevos). Prender o apagar una categoría
     * repinta los puntos pero NO mueve el mapa: quien está mirando una calle no quiere que se aleje.
     */
    encuadre: string
    alto?: string
}

/**
 * Los negocios en un mapa (Leaflet con teselas de OpenStreetMap: no necesita llave). Cada punto es un círculo; al tocarlo
 * se abre el detalle del negocio. El mapa se crea una vez y solo se repintan los puntos.
 */
export const MapaNegocios = ({ puntos, onSeleccionar, encuadre, alto = 'h-[34rem]' }: Props) => {
    const contenedor = useRef<HTMLDivElement>(null)
    const mapa = useRef<L.Map | null>(null)
    const capa = useRef<L.LayerGroup | null>(null)
    const ultimoEncuadre = useRef<string | null>(null)
    // El manejador vive en una referencia: si cambia, los círculos ya pintados no se repintan solo por eso.
    const alSeleccionar = useRef(onSeleccionar)
    useEffect(() => {
        alSeleccionar.current = onSeleccionar
    })

    useEffect(() => {
        if (!contenedor.current || mapa.current) return
        const m = L.map(contenedor.current, { scrollWheelZoom: true }).setView([23.6, -102.5], 5)
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(m)
        capa.current = L.layerGroup().addTo(m)
        mapa.current = m
        return () => {
            m.remove()
            mapa.current = null
            capa.current = null
            ultimoEncuadre.current = null
        }
    }, [])

    useEffect(() => {
        const m = mapa.current
        const grupo = capa.current
        if (!m || !grupo) return
        grupo.clearLayers()

        for (const p of puntos) {
            L.circleMarker([p.latitud, p.longitud], { radius: 8, color: '#fff', weight: 2, fillColor: p.color, fillOpacity: 0.92 })
                .bindTooltip(p.etiqueta)
                .on('click', () => alSeleccionar.current(p.id))
                .addTo(grupo)
        }

        // Se encuadra una vez por cada cambio de `encuadre` que ya tenga algo que enseñar.
        if (puntos.length > 0 && ultimoEncuadre.current !== encuadre) {
            ultimoEncuadre.current = encuadre
            m.fitBounds(L.latLngBounds(puntos.map((p) => [p.latitud, p.longitud] as [number, number])), { padding: [32, 32], maxZoom: 16 })
        }
    }, [puntos, encuadre])

    return <div ref={contenedor} className={`surface ${alto} w-full overflow-hidden`} role="application" aria-label="Mapa de negocios" />
}
