import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/auth/store/useAuthStore'

/** Solo entra una sesión ya verificada como superadmin (ver `useAuthStore`). */
export const AdminRoute = () => {
    const status = useAuthStore((s) => s.status)
    return status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />
}

/** El login solo se ve sin sesión. */
export const NotAuthenticatedRoute = () => {
    const status = useAuthStore((s) => s.status)
    return status === 'authenticated' ? <Navigate to="/" replace /> : <Outlet />
}
