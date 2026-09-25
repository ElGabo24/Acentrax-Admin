import { create } from 'zustand'
import { ApiError, API_ERROR_MESSAGES } from '@/api/apiError'
import { loginAction, logoutAction, refreshTokenAction } from '../actions/auth.actions'
import type { User } from '../interfaces/user.response'

type AuthStatus = 'unauthenticated' | 'authenticated' | 'loading'

/**
 * Claves propias de este panel. Aunque corre en otro subdominio (y por eso no
 * comparte storage con el de tenants), el nombre distinto deja claro de quién
 * es cada token si algún día se sirven bajo el mismo origen.
 */
const RT_KEY = 'adm_rt'

export const getStoredRefreshToken = (): string | null =>
    localStorage.getItem(RT_KEY) ?? sessionStorage.getItem(RT_KEY)

export const storeRefreshToken = (token: string, persistent: boolean) => {
    // Se limpia el otro storage: si no, un token viejo en localStorage seguiría
    // ganándole al nuevo en `getStoredRefreshToken`.
    if (persistent) {
        localStorage.setItem(RT_KEY, token)
        sessionStorage.removeItem(RT_KEY)
    } else {
        sessionStorage.setItem(RT_KEY, token)
        localStorage.removeItem(RT_KEY)
    }
}

export const clearStoredRefreshToken = () => {
    localStorage.removeItem(RT_KEY)
    sessionStorage.removeItem(RT_KEY)
}

export const isRefreshTokenPersistent = (): boolean => !!localStorage.getItem(RT_KEY)

const MENSAJE_SIN_ACCESO = API_ERROR_MESSAGES.SIN_ACCESO_ADMIN

const SESION_VACIA = {
    status: 'unauthenticated' as AuthStatus,
    user: null,
    accessToken: null,
    refreshToken: null,
}

/** Solo `true` cuenta: un campo ausente (backend sin el cambio) no da acceso. */
const esAdmin = (user: User): boolean => user.esSuperadmin === true

type AuthState = {
    status: AuthStatus
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    /** Por qué se cerró la sesión sin que el usuario lo pidiera; lo pinta el login. */
    avisoSesion: string | null

    login: (correo: string, contrasenia: string, recuerdame: boolean) => Promise<void>
    logout: () => Promise<void>
    /** Cierra la sesión porque el servidor dijo 403 a media sesión. */
    expulsarSinAcceso: () => Promise<void>
    checkAuth: () => Promise<boolean>
    limpiarAviso: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
    ...SESION_VACIA,
    avisoSesion: null,

    limpiarAviso: () => set({ avisoSesion: null }),

    login: async (correo, contrasenia, recuerdame) => {
        set({ avisoSesion: null })
        const { user, accessToken, refreshToken } = await loginAction(correo, contrasenia)

        // Ya no se adivina con una petición de prueba: el propio login dice si
        // la cuenta es de superadmin. Si no lo es, no se guarda nada y el
        // refresh token que acaba de nacer se revoca en el servidor.
        if (!esAdmin(user)) {
            await logoutAction(refreshToken).catch(() => { })
            set({ ...SESION_VACIA })
            throw new ApiError('SIN_ACCESO_ADMIN', MENSAJE_SIN_ACCESO, null)
        }

        storeRefreshToken(refreshToken, recuerdame)
        set({ status: 'authenticated', user, accessToken, refreshToken })
    },

    logout: async () => {
        const { refreshToken } = get()
        if (refreshToken) {
            await logoutAction(refreshToken).catch(() => { })
        }
        clearStoredRefreshToken()
        set({ ...SESION_VACIA })
    },

    expulsarSinAcceso: async () => {
        // Varias peticiones en vuelo pueden recibir el mismo 403 a la vez.
        if (get().status === 'unauthenticated') return
        await get().logout()
        set({ avisoSesion: MENSAJE_SIN_ACCESO })
    },

    checkAuth: async () => {
        const storedToken = getStoredRefreshToken()
        if (!storedToken) {
            set({ ...SESION_VACIA })
            return false
        }
        // "loading" solo en la verificación inicial: en las revalidaciones en
        // segundo plano no se desmonta la UI.
        if (get().status !== 'authenticated') set({ status: 'loading' })

        try {
            const { user, accessToken, refreshToken } = await refreshTokenAction(storedToken)

            // El acceso pudo revocarse desde la última vez.
            if (!esAdmin(user)) {
                await logoutAction(refreshToken).catch(() => { })
                clearStoredRefreshToken()
                set({ ...SESION_VACIA, avisoSesion: MENSAJE_SIN_ACCESO })
                return false
            }

            storeRefreshToken(refreshToken, isRefreshTokenPersistent())
            set({ status: 'authenticated', user, accessToken, refreshToken })
            return true
        } catch (error) {
            const tokenInvalido = error instanceof ApiError && error.code === 'INVALID_TOKEN'

            // Fallo transitorio (red, 500) con sesión viva: se deja todo como
            // está y la próxima revalidación reintenta.
            if (!tokenInvalido && get().status === 'authenticated') return false

            clearStoredRefreshToken()
            set({ ...SESION_VACIA })
            return false
        }
    },
}))
