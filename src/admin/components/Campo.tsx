/** Estilo de los `input` de los diálogos del panel. */
export const inputClass =
    'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 aria-invalid:border-destructive'

/** Etiqueta + control + ayuda o error, para los formularios de los diálogos. */
export const Campo = ({
    etiqueta,
    ayuda,
    error,
    children,
    className,
}: {
    etiqueta: string
    ayuda?: string
    error?: string
    children: React.ReactNode
    className?: string
}) => (
    <label className={`space-y-1.5 text-sm font-medium ${className ?? ''}`}>
        {etiqueta}
        {children}
        {error ? (
            <span role="alert" className="block text-xs font-normal text-destructive">{error}</span>
        ) : (
            ayuda && <span className="block text-xs font-normal text-muted-foreground">{ayuda}</span>
        )}
    </label>
)
