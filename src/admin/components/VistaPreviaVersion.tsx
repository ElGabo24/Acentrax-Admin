import { Download, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { AdminVersionApp } from '../interfaces/versionApp.interface'

/** Cómo verá el usuario el aviso en el teléfono. Es una maqueta: no llama a nada. */
export const VistaPreviaVersion = ({ version, onClose }: { version: AdminVersionApp | null; onClose: () => void }) => (
    <Dialog open={version !== null} onOpenChange={(abierto) => !abierto && onClose()}>
        <DialogContent className="max-w-sm">
            <DialogTitle>Vista previa</DialogTitle>
            <DialogDescription>
                {version && `${version.app} · ${version.plataforma === 'IOS' ? 'iOS' : 'Android'} · ${version.version}`}
            </DialogDescription>
            {version && (
                <div className="mx-auto w-full max-w-[19rem] overflow-hidden rounded-[2rem] border-4 border-foreground/80 bg-card shadow-lg">
                    {version.imagen ? (
                        <img src={version.imagen} alt="" className="h-36 w-full object-cover" />
                    ) : (
                        <div className="grid h-36 place-items-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                            <Sparkles className="size-10" />
                        </div>
                    )}
                    <div className="space-y-3 p-5">
                        <h3 className="text-lg leading-tight font-semibold">{version.titulo}</h3>
                        {version.subtitulo && <p className="text-sm text-muted-foreground">{version.subtitulo}</p>}
                        <ul className="space-y-2.5">
                            {version.mejoras.map((m, i) => (
                                <li key={i} className="flex gap-3">
                                    {m.icono ? (
                                        <img src={m.icono} alt="" className="size-9 shrink-0 rounded-lg object-contain" />
                                    ) : (
                                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                                            <Sparkles className="size-4" />
                                        </span>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">{m.titulo}</p>
                                        {m.descripcion && <p className="text-xs text-muted-foreground">{m.descripcion}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="space-y-1.5 pt-1">
                            <div className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground">
                                <Download className="size-4" /> Actualizar ahora
                            </div>
                            {!version.obligatoria && (
                                <div className="flex h-9 items-center justify-center text-sm text-muted-foreground">Ahora no</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DialogContent>
    </Dialog>
)
