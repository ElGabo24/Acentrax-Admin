import { create } from 'zustand'

export type Tema = 'light' | 'dark'

/** Misma clave que el script de `index.html`, que aplica el tema antes del primer pintado. */
const KEY = 'adm_theme'
const CONSULTA_OSCURO = '(prefers-color-scheme: dark)'

/** Lo que la persona eligió, o `null` si nunca eligió (entonces se sigue al sistema). */
const leerEleccion = (): Tema | null => {
    try {
        const valor = localStorage.getItem(KEY)
        return valor === 'light' || valor === 'dark' ? valor : null
    } catch {
        return null
    }
}

const delSistema = (): Tema => (window.matchMedia(CONSULTA_OSCURO).matches ? 'dark' : 'light')

const aplicar = (tema: Tema) => document.documentElement.classList.toggle('dark', tema === 'dark')

interface ThemeState {
    tema: Tema
    alternar: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
    const inicial = leerEleccion() ?? delSistema()
    aplicar(inicial)

    // Mientras no haya elegido, el panel acompaña al sistema (p. ej. el cambio automático de noche).
    window.matchMedia(CONSULTA_OSCURO).addEventListener('change', (evento) => {
        if (leerEleccion() !== null) return
        const tema: Tema = evento.matches ? 'dark' : 'light'
        aplicar(tema)
        set({ tema })
    })

    return {
        tema: inicial,
        alternar: () => {
            const siguiente: Tema = get().tema === 'dark' ? 'light' : 'dark'
            try {
                localStorage.setItem(KEY, siguiente)
            } catch {
                // Sin almacenamiento (modo privado): vale mientras la pestaña siga abierta.
            }
            aplicar(siguiente)
            set({ tema: siguiente })
        },
    }
})
