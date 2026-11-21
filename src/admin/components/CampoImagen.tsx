import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mensajeDeError } from '@/api/apiError'
import { subirImagenVersion } from '../actions/versiones/versiones.actions'
import { RecortadorImagen } from './RecortadorImagen'

const MAX_MB = 10

interface Props {
    /** URL actual, o vacío. */
    valor: string
    onChange: (url: string) => void
    tipo: 'CABECERA' | 'ICONO'
    /** `compacto` para el ícono de una mejora. */
    compacto?: boolean
    error?: string
}

/** Elige una imagen del equipo, la sube y guarda su URL. Se ve la miniatura y se puede quitar o cambiar. */
export const CampoImagen = ({ valor, onChange, tipo, compacto, error }: Props) => {
    const input = useRef<HTMLInputElement>(null)
    const [subiendo, setSubiendo] = useState(false)
    const [fallo, setFallo] = useState<string | null>(null)

    const [pendiente, setPendiente] = useState<File | null>(null)

    /** Valida el archivo y abre el recortador; la subida ocurre al confirmar el recorte. */
    const elegir = (archivo: File | undefined) => {
        if (input.current) input.current.value = ''
        if (!archivo) return
        if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) return setFallo('Usa una imagen JPG, PNG o WebP.')
        if (archivo.size > MAX_MB * 1024 * 1024) return setFallo(`La imagen pesa más de ${MAX_MB} MB.`)
        setFallo(null)
        setPendiente(archivo)
    }

    const subir = async (archivo: File) => {
        setPendiente(null)
        setSubiendo(true)
        try {
            onChange(await subirImagenVersion(archivo, tipo))
        } catch (e) {
            setFallo(mensajeDeError(e, 'No se pudo subir la imagen.'))
        } finally {
            setSubiendo(false)
        }
    }

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    disabled={subiendo}
                    onClick={() => input.current?.click()}
                    className={cn(
                        'group relative grid shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40 text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:opacity-60',
                        compacto ? 'size-14' : 'h-24 w-40'
                    )}
                    aria-label={valor ? 'Cambiar imagen' : 'Subir imagen'}
                >
                    {valor ? (
                        <img src={valor} alt="" className={cn('size-full', compacto ? 'object-contain p-1' : 'object-cover')} />
                    ) : (
                        <ImagePlus className="size-6" />
                    )}
                    {subiendo && (
                        <span className="absolute inset-0 grid place-items-center bg-background/70">
                            <Loader2 className="size-5 animate-spin" />
                        </span>
                    )}
                </button>
                <div className="space-y-1 text-xs">
                    <button type="button" disabled={subiendo} onClick={() => input.current?.click()} className="font-medium text-primary hover:underline">
                        {valor ? 'Cambiar' : 'Subir imagen'}
                    </button>
                    {valor && !subiendo && (
                        <button type="button" onClick={() => onChange('')} className="ml-3 inline-flex items-center gap-1 text-muted-foreground hover:text-destructive">
                            <X className="size-3" /> Quitar
                        </button>
                    )}
                    <p className="text-muted-foreground">
                        {tipo === 'CABECERA' ? 'Horizontal, de preferencia 900×500.' : 'Cuadrada, de preferencia 256×256, PNG con fondo transparente.'} JPG, PNG o WebP.
                    </p>
                </div>
            </div>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => elegir(e.target.files?.[0])} />
            {pendiente && (
                <RecortadorImagen
                    archivo={pendiente}
                    ancho={tipo === 'CABECERA' ? 900 : 256}
                    alto={tipo === 'CABECERA' ? 500 : 256}
                    transparente={tipo === 'ICONO'}
                    onCancelar={() => setPendiente(null)}
                    onListo={(r) => void subir(r)}
                />
            )}
            {(fallo ?? error) && <p role="alert" className="text-xs text-destructive">{fallo ?? error}</p>}
        </div>
    )
}
