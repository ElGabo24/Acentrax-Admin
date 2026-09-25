interface Props {
    titulo: string
    descripcion?: string
    /** Acción principal de la página (botón). */
    accion?: React.ReactNode
}

export const PageHeader = ({ titulo, descripcion, accion }: Props) => (
    <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
            <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
            {descripcion && <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p>}
        </div>
        {accion}
    </div>
)
