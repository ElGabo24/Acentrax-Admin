import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import type { PropsWithChildren } from 'react'
import { appRouter } from './app.router'
import { FullScreenLoading } from './components/custom/FullScreenLoading'
import { useAuthStore } from './auth/store/useAuthStore'

const queryClient = new QueryClient()

// La caché es de quien está en sesión: al salir o cambiar de cuenta se tira
// todo salvo la consulta de sesión, que es la que monta la app.
useAuthStore.subscribe((estado, anterior) => {
    if (estado.user?.id === anterior.user?.id) return
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
})

const CheckAuthProvider = ({ children }: PropsWithChildren) => {
    const checkAuth = useAuthStore((s) => s.checkAuth)

    const { isLoading } = useQuery({
        queryKey: ['auth'],
        queryFn: checkAuth,
        retry: false,
        refetchInterval: 1000 * 60 * 15,
        refetchOnWindowFocus: true,
    })

    if (isLoading) return <FullScreenLoading />
    return children
}

export const AdminApp = () => (
    <QueryClientProvider client={queryClient}>
        <Toaster />
        <CheckAuthProvider>
            <RouterProvider router={appRouter} />
        </CheckAuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
)
