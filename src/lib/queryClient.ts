import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/apiError'

// Toda acción lanza `ApiError` (ver `normalizeApiError`): con esto `error` llega
// tipado así en cada consulta y mutación, sin castear en las pantallas.
declare module '@tanstack/react-query' {
    interface Register {
        defaultError: ApiError
    }
}

/** Reintentos tras el primer fallo: 3 intentos en total. */
const REINTENTOS = 2

/**
 * Un 4xx es una respuesta, no una falla: repetirlo no cambia nada y solo demora
 * el mensaje (un 404 tardaba ~7 s en salir con los 3 reintentos por defecto).
 * Se reintenta lo que sí puede arreglarse solo: red caída y 5xx.
 */
const reintentar = (fallos: number, error: Error): boolean => {
    const status = error instanceof ApiError ? error.status : null
    if (status !== null && status >= 400 && status < 500) return false
    return fallos < REINTENTOS
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // El panel lo usa una sola persona y lo que cambia lo cambia ella,
            // con mutaciones que ya invalidan. Evita repedir todo al saltar de
            // una pantalla a otra; quien necesite menos o más lo fija en su query.
            staleTime: 30_000,
            retry: reintentar,
        },
    },
})
