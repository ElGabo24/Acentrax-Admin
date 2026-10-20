import { createBrowserRouter, Navigate } from 'react-router'
import { AdminRoute, NotAuthenticatedRoute } from './components/routes/ProtectedRoutes'
import { LoginPage } from './auth/pages/LoginPage'
import { AdminLayout } from './admin/layouts/AdminLayout'
import { EmpresasPage } from './admin/pages/EmpresasPage'
import { FinanzasPage } from './admin/pages/FinanzasPage'
import { PagosPage } from './admin/pages/PagosPage'
import { PaquetesMensajesPage } from './admin/pages/PaquetesMensajesPage'
import { FlagsPage } from './admin/pages/FlagsPage'
import { PlanesPage } from './admin/pages/PlanesPage'
import { RecetasPage } from './admin/pages/RecetasPage'
import { EmpresaDetallePage } from './admin/pages/EmpresaDetallePage'
import { AgentesPage } from './admin/pages/AgentesPage'
import { CuestionarioPage } from './admin/pages/CuestionarioPage'
import { MapaPage } from './admin/pages/MapaPage'
import { ProductosRankingPage } from './admin/pages/ProductosRankingPage'
import { ProspectosPage } from './admin/pages/ProspectosPage'
import { SeguimientoPage } from './admin/pages/SeguimientoPage'
import { ProspectosLayout } from './admin/layouts/ProspectosLayout'

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
                    { path: '/paquetes-mensajes', element: <PaquetesMensajesPage /> },
                    { path: '/interruptores', element: <FlagsPage /> },
                    { path: '/recetas', element: <RecetasPage /> },
                    { path: '/pagos', element: <PagosPage /> },
                    { path: '/finanzas', element: <FinanzasPage /> },
                    {
                        path: '/prospectos',
                        element: <ProspectosLayout />,
                        children: [
                            { index: true, element: <ProspectosPage /> },
                            { path: 'mapa', element: <MapaPage /> },
                            { path: 'seguimiento', element: <SeguimientoPage /> },
                            { path: 'productos', element: <ProductosRankingPage /> },
                            { path: 'cuestionario', element: <CuestionarioPage /> },
                            { path: 'agentes', element: <AgentesPage /> },
                        ],
                    },
                    // Antes los agentes eran una sección aparte.
                    { path: '/agentes', element: <Navigate to="/prospectos/agentes" replace /> },
                ],
            },
        ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
])
