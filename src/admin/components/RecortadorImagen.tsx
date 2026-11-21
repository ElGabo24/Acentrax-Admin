import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

interface Props {
    archivo: File
    /** Medidas exactas del resultado, en píxeles. */
    ancho: number
    alto: number
    /** `true` conserva transparencia (PNG); `false` guarda JPG. */
    transparente: boolean
    onCancelar: () => void
    onListo: (recorte: File) => void
}

type Esquina = 'nw' | 'ne' | 'sw' | 'se'
type Gesto = { tipo: 'mover' | Esquina; px: number; py: number; caja: Caja }
interface Caja { x: number; y: number; w: number }

const MINIMO = 48
const ALTURA_MAX = 380

const esquinas: { id: Esquina; clase: string; cursor: string }[] = [
    { id: 'nw', clase: '-left-2 -top-2', cursor: 'nwse-resize' },
    { id: 'ne', clase: '-right-2 -top-2', cursor: 'nesw-resize' },
    { id: 'sw', clase: '-left-2 -bottom-2', cursor: 'nesw-resize' },
    { id: 'se', clase: '-right-2 -bottom-2', cursor: 'nwse-resize' },
]

/**
 * Se ve la imagen completa con un marco de la proporción pedida: se mueve arrastrándolo y se
 * agranda o achica desde las esquinas. Lo que queda dentro se guarda con las medidas exactas.
 */
export const RecortadorImagen = ({ archivo, ancho, alto, transparente, onCancelar, onListo }: Props) => {
    const proporcion = ancho / alto
    const contenedor = useRef<HTMLDivElement>(null)
    const gesto = useRef<Gesto | null>(null)
    const [url, setUrl] = useState('')
    const [img, setImg] = useState<HTMLImageElement | null>(null)
    const [anchoDisp, setAnchoDisp] = useState(0)
    const [caja, setCaja] = useState<Caja | null>(null)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        const u = URL.createObjectURL(archivo)
        setUrl(u)
        const i = new Image()
        i.onload = () => setImg(i)
        i.src = u
        return () => URL.revokeObjectURL(u)
    }, [archivo])

    useLayoutEffect(() => {
        const el = contenedor.current
        if (!el) return
        const medir = () => setAnchoDisp(el.clientWidth)
        medir()
        const ro = new ResizeObserver(medir)
        ro.observe(el)
        return () => ro.disconnect()
    }, [img])

    // Imagen mostrada completa, sin pasar del ancho disponible ni de la altura máxima.
    const s = img && anchoDisp ? Math.min(anchoDisp / img.naturalWidth, ALTURA_MAX / img.naturalHeight) : 0
    const W = img ? img.naturalWidth * s : 0
    const H = img ? img.naturalHeight * s : 0

    // Marco inicial: el más grande que cabe, centrado. Se rehace si cambia la escala de pantalla.
    const escalaPrevia = useRef(0)
    useEffect(() => {
        if (!s || !img) return
        if (!caja) {
            const w = Math.min(W, H * proporcion)
            setCaja({ x: (W - w) / 2, y: (H - w / proporcion) / 2, w })
        } else if (escalaPrevia.current && escalaPrevia.current !== s) {
            const r = s / escalaPrevia.current
            setCaja({ x: caja.x * r, y: caja.y * r, w: caja.w * r })
        }
        escalaPrevia.current = s
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [s, img])

    const punto = (e: React.PointerEvent) => {
        const r = (e.currentTarget.closest('[data-lienzo]') as HTMLElement).getBoundingClientRect()
        return { x: e.clientX - r.left, y: e.clientY - r.top }
    }

    const iniciar = (e: React.PointerEvent, tipo: Gesto['tipo']) => {
        if (!caja) return
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        const p = punto(e)
        gesto.current = { tipo, px: p.x, py: p.y, caja }
    }

    const mover = (e: React.PointerEvent) => {
        const g = gesto.current
        if (!g) return
        const p = punto(e)
        const c = g.caja
        const h = c.w / proporcion
        if (g.tipo === 'mover') {
            setCaja({
                w: c.w,
                x: Math.min(W - c.w, Math.max(0, c.x + p.x - g.px)),
                y: Math.min(H - h, Math.max(0, c.y + p.y - g.py)),
            })
            return
        }
        // La esquina opuesta queda fija; la proporción se conserva.
        const derecha = g.tipo.includes('e')
        const abajo = g.tipo.includes('s')
        const ax = derecha ? c.x : c.x + c.w
        const ay = abajo ? c.y : c.y + h
        const maxW = Math.min(derecha ? W - ax : ax, (abajo ? H - ay : ay) * proporcion)
        const w = Math.min(maxW, Math.max(MINIMO, Math.abs(p.x - ax), Math.abs(p.y - ay) * proporcion))
        setCaja({ w, x: derecha ? ax : ax - w, y: abajo ? ay : ay - w / proporcion })
    }

    const guardar = () => {
        if (!img || !caja) return
        setGuardando(true)
        const lienzo = document.createElement('canvas')
        lienzo.width = ancho
        lienzo.height = alto
        const ctx = lienzo.getContext('2d')!
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, caja.x / s, caja.y / s, caja.w / s, caja.w / proporcion / s, 0, 0, ancho, alto)
        const tipo = transparente ? 'image/png' : 'image/jpeg'
        lienzo.toBlob(
            (blob) => {
                setGuardando(false)
                if (!blob) return
                const nombre = archivo.name.replace(/\.[^.]+$/, '') + (transparente ? '.png' : '.jpg')
                onListo(new File([blob], nombre, { type: tipo }))
            },
            tipo,
            0.92
        )
    }

    return (
        <Dialog open onOpenChange={(abierto) => !abierto && onCancelar()}>
            <DialogContent className="max-w-2xl">
                <div>
                    <DialogTitle>Recortar imagen</DialogTitle>
                    <DialogDescription>
                        Mueve el marco y cambia su tamaño desde las esquinas. Se guarda a {ancho}×{alto} px.
                    </DialogDescription>
                </div>
                <div ref={contenedor} className="flex w-full justify-center">
                    {img && s > 0 && (
                        <div
                            data-lienzo
                            className="relative touch-none select-none overflow-hidden rounded-md bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px]"
                            style={{ width: W, height: H }}
                        >
                            <img src={url} alt="" draggable={false} className="pointer-events-none size-full" />
                            {caja && (
                                <div
                                    className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                                    style={{ left: caja.x, top: caja.y, width: caja.w, height: caja.w / proporcion, cursor: 'move' }}
                                    onPointerDown={(e) => iniciar(e, 'mover')}
                                    onPointerMove={mover}
                                    onPointerUp={() => (gesto.current = null)}
                                    onPointerCancel={() => (gesto.current = null)}
                                >
                                    {esquinas.map((q) => (
                                        <span
                                            key={q.id}
                                            className={`absolute size-4 rounded-sm border-2 border-white bg-primary ${q.clase}`}
                                            style={{ cursor: q.cursor }}
                                            onPointerDown={(e) => iniciar(e, q.id)}
                                            onPointerMove={mover}
                                            onPointerUp={() => (gesto.current = null)}
                                            onPointerCancel={() => (gesto.current = null)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
                    <Button type="button" disabled={!img || !caja || guardando} onClick={guardar}>Usar recorte</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
