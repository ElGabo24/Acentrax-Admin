import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'

export const authKeys = {
    session: ['auth'] as const,
}

/**
 * Verifica la sesión al arrancar y la revalida cada 15 minutos o al volver a la
 * pestaña. Sin reintentos: si falla se muestra el login, no se insiste.
 */
export const useVerificarSesion = () => {
    const checkAuth = useAuthStore((s) => s.checkAuth)

    return useQuery({
        queryKey: authKeys.session,
        queryFn: checkAuth,
        retry: false,
        refetchInterval: 1000 * 60 * 15,
        refetchOnWindowFocus: true,
    })
}
