import type { AdminAgente } from '../interfaces/prospectos.interface'

export const nombreDe = (a: Pick<AdminAgente, 'nombre' | 'apellidos'>): string => `${a.nombre} ${a.apellidos}`.trim()

/** Los demás agentes del equipo de `agente` (sin contarlo a él); vacío si trabaja solo. */
export const companerosDe = (agente: AdminAgente, agentes: AdminAgente[]): AdminAgente[] =>
    agente.equipoId === null ? [] : agentes.filter((a) => a.equipoId === agente.equipoId && a.userId !== agente.userId)
