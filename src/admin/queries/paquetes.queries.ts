import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    ajustarSaldoMensajes,
    crearPaquete,
    editarPaquete,
    getPaquetes,
    getSaldoMensajes,
} from '../actions/paquetes/paquetes.actions'
import type {
    AdminPaqueteMensajes,
    AjusteSaldoPayload,
    PaqueteMensajesPayload,
    SaldoMensajesEmpresa,
} from '../interfaces/paqueteMensajes.interface'
import { invalidar, STALE_CATALOGO, type OpcionesMutacion } from './shared'

export const paquetesKeys = {
    all: ['admin', 'paquetes-mensajes'] as const,
    list: () => [...paquetesKeys.all, 'list'] as const,
}

export const saldoMensajesKeys = {
    all: ['admin', 'saldo-mensajes'] as const,
    detail: (empresaId: number) => [...saldoMensajesKeys.all, empresaId] as const,
}

export const paquetesQueryOptions = () =>
    queryOptions({
        queryKey: paquetesKeys.list(),
        queryFn: ({ signal }) => getPaquetes(signal),
        staleTime: STALE_CATALOGO,
    })

export const saldoMensajesQueryOptions = (empresaId: number) =>
    queryOptions({
        queryKey: saldoMensajesKeys.detail(empresaId),
        queryFn: ({ signal }) => getSaldoMensajes(empresaId, signal),
    })

export const usePaquetes = () => useQuery(paquetesQueryOptions())

export const useSaldoMensajes = (empresaId: number) => useQuery(saldoMensajesQueryOptions(empresaId))

/** Crea el paquete, o lo edita si se pasa uno: el formulario es el mismo. */
export const useGuardarPaquete = (
    paquete: AdminPaqueteMensajes | null,
    opciones?: OpcionesMutacion<AdminPaqueteMensajes, PaqueteMensajesPayload>
) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: (payload: PaqueteMensajesPayload) =>
            paquete ? editarPaquete(paquete.id, payload) : crearPaquete(payload),
        onSuccess: async (...args) => {
            await invalidar(queryClient, paquetesKeys.list())
            return opciones?.onSuccess?.(...args)
        },
    })
}

export const useAjustarSaldoMensajes = (
    empresaId: number,
    opciones?: OpcionesMutacion<SaldoMensajesEmpresa, AjusteSaldoPayload>
) => {
    const queryClient = useQueryClient()

    return useMutation({
        ...opciones,
        mutationFn: (payload: AjusteSaldoPayload) => ajustarSaldoMensajes(empresaId, payload),
        onSuccess: (...args) => {
            const [saldo] = args
            // El servidor devuelve el saldo y los movimientos ya con el ajuste: no hace falta repedirlos.
            queryClient.setQueryData(saldoMensajesKeys.detail(empresaId), saldo)
            return opciones?.onSuccess?.(...args)
        },
    })
}
