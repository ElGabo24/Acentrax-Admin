import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/api/apiError'
import { useAuthStore } from '../store/useAuthStore'

const loginSchema = z.object({
    correo: z.email('Escribe un correo válido.'),
    contrasenia: z.string().min(1, 'Escribe tu contraseña.'),
})

const inputClass =
    'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'

export const LoginPage = () => {
    const login = useAuthStore((s) => s.login)
    const avisoSesion = useAuthStore((s) => s.avisoSesion)
    const limpiarAviso = useAuthStore((s) => s.limpiarAviso)

    const [correo, setCorreo] = useState('')
    const [contrasenia, setContrasenia] = useState('')
    const [recuerdame, setRecuerdame] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault()
        limpiarAviso()

        const validacion = loginSchema.safeParse({ correo: correo.trim(), contrasenia })
        if (!validacion.success) {
            setError(validacion.error.issues[0].message)
            return
        }

        setError(null)
        setEnviando(true)
        try {
            await login(validacion.data.correo, validacion.data.contrasenia, recuerdame)
            // La navegación la hace `NotAuthenticatedRoute` al cambiar el estado.
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Ocurrió un error inesperado. Intenta de nuevo.')
            setEnviando(false)
        }
    }

    const mensaje = error ?? avisoSesion

    return (
        <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4">
            <form onSubmit={onSubmit} noValidate className="surface w-full max-w-sm space-y-5 p-7 shadow-sm">
                <div>
                    <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                        Acentrax
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">Administración</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Inicia sesión para continuar.</p>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="correo" className="text-sm font-medium">Correo</label>
                    <input
                        id="correo"
                        type="email"
                        autoComplete="username"
                        autoFocus
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        aria-invalid={!!error}
                        className={inputClass}
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="contrasenia" className="text-sm font-medium">Contraseña</label>
                    <input
                        id="contrasenia"
                        type="password"
                        autoComplete="current-password"
                        value={contrasenia}
                        onChange={(e) => setContrasenia(e.target.value)}
                        aria-invalid={!!error}
                        className={inputClass}
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={recuerdame}
                        onChange={(e) => setRecuerdame(e.target.checked)}
                        className="size-4 accent-primary"
                    />
                    Recordar sesión en este equipo
                </label>

                {mensaje && (
                    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{mensaje}</p>
                )}

                <Button type="submit" size="lg" className="h-10 w-full" disabled={enviando}>
                    {enviando && <Loader2 className="animate-spin" />}
                    Entrar
                </Button>
            </form>
        </main>
    )
}
