import type { EstadoProspecto } from '../interfaces/prospectos.interface'
import { ESTADO_PROSPECTO_LABEL } from '../utils/prospectos'
import { Pildora } from './EstadoBadge'

const COLOR: Record<EstadoProspecto, string> = {
    NUEVO: 'bg-muted text-muted-foreground',
    VISITADO: 'bg-muted text-muted-foreground',
    SEGUIMIENTO: 'bg-warning/15 text-warning',
    INTERESADO: 'bg-secondary text-secondary-foreground',
    ALTA_BORRADOR: 'bg-secondary text-secondary-foreground',
    CONVERTIDO: 'bg-success/15 text-success',
    NO_INTERESADO: 'bg-destructive/15 text-destructive',
}

export const ProspectoEstadoBadge = ({ estado }: { estado: EstadoProspecto }) => (
    <Pildora className={COLOR[estado]}>{ESTADO_PROSPECTO_LABEL[estado]}</Pildora>
)
