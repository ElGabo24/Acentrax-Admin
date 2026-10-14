import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'

const PESTANAS: { to: string; etiqueta: string; fin?: boolean }[] = [
    { to: '/prospectos', etiqueta: 'Negocios', fin: true },
    { to: '/prospectos/mapa', etiqueta: 'Mapa' },
    { to: '/prospectos/seguimiento', etiqueta: 'Seguimiento' },
    { to: '/prospectos/productos', etiqueta: 'Productos' },
    { to: '/prospectos/cuestionario', etiqueta: 'Cuestionario' },
    { to: '/prospectos/agentes', etiqueta: 'Agentes' },
]

/** Todo lo de Acentrax Prospectos en una sola sección del menú, con sus pestañas. */
export const ProspectosLayout = () => (
    <div className="space-y-6">
        <nav className="-mx-1 flex gap-1 overflow-x-auto border-b px-1" aria-label="Prospectos">
            {PESTANAS.map(({ to, etiqueta, fin }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={fin}
                    className={({ isActive }) =>
                        cn(
                            '-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                            isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                        )
                    }
                >
                    {etiqueta}
                </NavLink>
            ))}
        </nav>
        <Outlet />
    </div>
)
