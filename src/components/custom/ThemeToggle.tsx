import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/lib/useThemeStore'

interface Props {
    /** Botón ancho con texto (barra lateral) en vez de solo el icono. */
    conEtiqueta?: boolean
    className?: string
}

/** Alterna entre modo claro y oscuro. Muestra el icono del modo al que se va a pasar. */
export const ThemeToggle = ({ conEtiqueta = false, className }: Props) => {
    const oscuro = useThemeStore((s) => s.tema === 'dark')
    const alternar = useThemeStore((s) => s.alternar)
    const Icono = oscuro ? Sun : Moon

    if (conEtiqueta) {
        return (
            <Button variant="ghost" className={cn('w-full justify-start', className)} onClick={alternar}>
                <Icono /> {oscuro ? 'Modo claro' : 'Modo oscuro'}
            </Button>
        )
    }

    const accion = oscuro ? 'Activar modo claro' : 'Activar modo oscuro'
    return (
        <Button variant="ghost" size="icon" className={className} aria-label={accion} title={accion} onClick={alternar}>
            <Icono />
        </Button>
    )
}
