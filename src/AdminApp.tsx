import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import type { PropsWithChildren } from 'react'
import { appRouter } from './app.router'
import { FullScreenLoading } from './components/custom/FullScreenLoading'
import { authKeys, useVerificarSesion } from './auth/queries/session.queries'
import { useAuthStore } from './auth/store/useAuthStore'
import { queryClient } from './lib/queryClient'
import { useThemeStore } from './lib/useThemeStore'

// La caché es de quien está en sesión: al salir o cambiar de cuenta se tira
// todo salvo la consulta de sesión, que es la que monta la app.
useAuthStore.subscribe((estado, anterior) => {
    if (estado.user?.id === anterior.user?.id) return
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.session[0] })
})

const AppToaster = () => {
    const tema = useThemeStore((s) => s.tema)
    return <Toaster theme={tema} />
}

const CheckAuthProvider = ({ children }: PropsWithChildren) => {
    const { isLoading } = useVerificarSesion()

    if (isLoading) return <FullScreenLoading />
    return children
}

export const AdminApp = () => (
    <QueryClientProvider client={queryClient}>
        <AppToaster />
        <CheckAuthProvider>
            <RouterProvider router={appRouter} />
        </CheckAuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
)
