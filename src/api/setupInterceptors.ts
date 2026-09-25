import { adminApi } from './AdminApi'
import { ApiError, normalizeApiError } from './apiError'
import {
    useAuthStore,
    getStoredRefreshToken,
    storeRefreshToken,
    clearStoredRefreshToken,
    isRefreshTokenPersistent,
} from '../auth/store/useAuthStore'
import { refreshTokenAction } from '../auth/actions/auth.actions'

const esRutaDeAuth = (url: string | undefined) => !!url?.startsWith('/auth/')

export const setupInterceptors = () => {
    adminApi.interceptors.request.use((config) => {
        const { accessToken } = useAuthStore.getState()
        if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
        return config
    })

    let isRefreshing = false
    let failedQueue: Array<{
        resolve: (token: string) => void
        reject: (err: unknown) => void
    }> = []

    const processQueue = (error: unknown, token: string | null) => {
        failedQueue.forEach(({ resolve, reject }) =>
            error ? reject(error) : resolve(token!)
        )
        failedQueue = []
    }

    adminApi.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config
            const apiError = normalizeApiError(error)

            // En este panel todo /admin/** exige superadmin, así que un 403 es
            // siempre "ya no tienes acceso": el acceso pudo revocarse con el
            // token todavía vigente. Se cierra la sesión sin más detalle.
            if (apiError.code === 'PERMISO_DENEGADO' && !esRutaDeAuth(originalRequest?.url)) {
                apiError.yaNotificado = true
                void useAuthStore.getState().expulsarSinAcceso()
                return Promise.reject(apiError)
            }

            if (
                error.response?.status !== 401 ||
                originalRequest._retry ||
                esRutaDeAuth(originalRequest.url)
            ) {
                return Promise.reject(apiError)
            }

            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then((newToken) => {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return adminApi(originalRequest)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            const storedToken = getStoredRefreshToken()

            if (!storedToken) {
                isRefreshing = false
                useAuthStore.setState({ status: 'unauthenticated', user: null, accessToken: null, refreshToken: null })
                return Promise.reject(apiError)
            }

            try {
                const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } =
                    await refreshTokenAction(storedToken)

                storeRefreshToken(newRefreshToken, isRefreshTokenPersistent())
                useAuthStore.setState({
                    status: 'authenticated',
                    user,
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                })

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                processQueue(null, newAccessToken)
                return adminApi(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)

                // Solo se cierra sesión si el refresh token en sí es inválido;
                // un fallo transitorio deja el token para reintentar.
                if (refreshError instanceof ApiError && refreshError.code === 'INVALID_TOKEN') {
                    clearStoredRefreshToken()
                    useAuthStore.setState({ status: 'unauthenticated', user: null, accessToken: null, refreshToken: null })
                }

                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }
    )
}
