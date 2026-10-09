import { Building2, ChefHat, CreditCard, LogOut, MessageSquare, Package, TrendingUp, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/custom/Logo'
import { ThemeToggle } from '@/components/custom/ThemeToggle'
import { useAuthStore } from '@/auth/store/useAuthStore'

const SECCIONES: { to: string; etiqueta: string; icono: LucideIcon }[] = [
    { to: '/', etiqueta: 'Empresas', icono: Building2 },
    { to: '/planes', etiqueta: 'Planes', icono: Package },
    { to: '/paquetes-mensajes', etiqueta: 'Mensajes', icono: MessageSquare },
    { to: '/recetas', etiqueta: 'Recetas', icono: ChefHat },
    { to: '/pagos', etiqueta: 'Pagos', icono: CreditCard },
    { to: '/finanzas', etiqueta: 'Finanzas', icono: TrendingUp },
]

export const AdminLayout = () => {
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)

    return (
        <div className="min-h-svh md:pl-60">
            {/* Escritorio: barra lateral fija. */}
            <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-card md:flex">
                <div className="flex items-center gap-3 px-5 py-5">
                    <Logo size={36} />
                    <div>
                        <p className="text-[0.7rem] font-medium tracking-widest text-muted-foreground uppercase">Acentrax</p>
                        <p className="text-base leading-tight font-semibold tracking-tight">Administración</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 px-3" aria-label="Secciones">
                    {SECCIONES.map(({ to, etiqueta, icono: Icono }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                                    isActive && 'bg-secondary text-secondary-foreground hover:bg-secondary'
                                )
                            }
                        >
                            <Icono className="size-[18px]" />
                            {etiqueta}
                        </NavLink>
                    ))}
                </nav>

                <div className="space-y-2 border-t p-3">
                    <p className="truncate px-2 text-xs text-muted-foreground" title={user?.correo}>{user?.correo}</p>
                    <ThemeToggle conEtiqueta />
                    <Button variant="ghost" className="w-full justify-start" onClick={() => void logout()}>
                        <LogOut /> Cerrar sesión
                    </Button>
                </div>
            </aside>

            {/* Móvil: barra superior + navegación inferior. */}
            <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b bg-card px-4 md:hidden">
                <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                    <Logo size={24} />
                    Acentrax · Administración
                </span>
                <div className="flex items-center">
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" aria-label="Cerrar sesión" onClick={() => void logout()}>
                        <LogOut />
                    </Button>
                </div>
            </header>

            <main className="w-full p-4 pb-24 md:p-8 md:pb-8">
                <Outlet />
            </main>

            <nav
                className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-card md:hidden"
                aria-label="Secciones"
            >
                {SECCIONES.map(({ to, etiqueta, icono: Icono }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            cn(
                                'flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium text-muted-foreground',
                                isActive && 'text-secondary-foreground'
                            )
                        }
                    >
                        <Icono className="size-5" />
                        {etiqueta}
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}
