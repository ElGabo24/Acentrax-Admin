import { cn } from '@/lib/utils'

interface Props {
    /** Lado en píxeles. */
    size?: number
    className?: string
}

/**
 * Icono de Acentrax. El PNG de 192 px alcanza para pantallas de alta densidad
 * hasta ~64 px. Es decorativo: el nombre siempre va escrito al lado, así que no
 * lleva `alt` y el lector de pantalla no lo repite.
 */
export const Logo = ({ size = 32, className }: Props) => (
    <img
        src="/icono-192.png"
        width={size}
        height={size}
        alt=""
        className={cn('shrink-0 rounded-[22%]', className)}
    />
)
