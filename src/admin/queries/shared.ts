import type { DefaultError, QueryClient, QueryKey, UseMutationOptions } from '@tanstack/react-query'

/** Catálogos que casi nunca cambian (planes, paquetes, tarifas): se repiden poco. */
export const STALE_CATALOGO = 5 * 60_000

/**
 * Lo que una pantalla puede añadir a una mutación: el aviso, cerrar el diálogo…
 * La caché ya la cuida el hook; esto corre después, con ella al día.
 */
export type OpcionesMutacion<TData, TVariables, TError = DefaultError> = Pick<
    UseMutationOptions<TData, TError, TVariables>,
    'onSuccess' | 'onError' | 'onSettled'
>

/**
 * Marca como obsoletas varias consultas a la vez. Las que están en pantalla se
 * recargan; el resto se pide al volver a montarse. Devolver la promesa deja la
 * mutación en «pendiente» hasta que terminan: el diálogo se cierra con la lista
 * ya al día, sin un parpadeo con datos viejos.
 */
export const invalidar = (queryClient: QueryClient, ...claves: QueryKey[]) =>
    Promise.all(claves.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
