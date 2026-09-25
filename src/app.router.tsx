import { createBrowserRouter, Navigate } from 'react-router'
import { AdminRoute, NotAuthenticatedRoute } from './components/routes/ProtectedRoutes'
import { LoginPage } from './auth/pages/LoginPage'
import { AdminLayout } from './admin/layouts/AdminLayout'
import { EmpresasPage } from './admin/pages/EmpresasPage'
import { FinanzasPage } from './admin/pages/FinanzasPage'
import { PagosPage } from './admin/pages/PagosPage'
import { PlanesPage } from './admin/pages/PlanesPage'
import { EmpresaDetallePage } from './admin/pages/EmpresaDetallePage'

export const appRouter = createBrowserRouter([
    {
        element: <NotAuthenticatedRoute />,
        children: [{ path: '/login', element: <LoginPage /> }],
    },
    {
        element: <AdminRoute />,
        children: [
            {
                element: <AdminLayout />,
                children: [
                    { path: '/', element: <EmpresasPage /> },
                    { path: '/empresas/:id', element: <EmpresaDetallePage /> },
                    { path: '/planes', element: <PlanesPage /> },
                    { path: '/pagos', element: <PagosPage /> },
                    { path: '/finanzas', element: <FinanzasPage /> },
                ],
            },
        ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
])
