export type PlataformaApp = 'ANDROID' | 'IOS'

export interface MejoraVersion {
    titulo: string
    descripcion?: string | null
    /** URL de la imagen del ícono. */
    icono?: string | null
}

export interface AdminVersionApp {
    id: number
    app: string
    plataforma: PlataformaApp
    version: string
    obligatoria: boolean
    titulo: string
    subtitulo: string | null
    imagen: string | null
    urlTienda: string | null
    mejoras: MejoraVersion[]
    publicada: boolean
    publicadaAt: string | null
    updatedAt: string
}

/** Cuerpo de `POST` y `PUT /admin/versiones-app`. `app`, `plataforma` y `version` sólo viajan al crear. */
export interface VersionAppPayload {
    app?: string
    plataforma?: PlataformaApp
    version?: string
    obligatoria: boolean
    titulo: string
    subtitulo: string | null
    imagen: string | null
    urlTienda: string | null
    mejoras: MejoraVersion[]
    publicada: boolean
}
