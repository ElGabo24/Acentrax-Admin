import { isAxiosError } from "axios";

/**
 * Códigos que devuelve el backend y que este panel sabe leer, más los propios
 * del cliente. Uno que no esté aquí cae al mensaje del servidor, o al de su
 * status HTTP si no trae cuerpo.
 */
export type ApiErrorCode =
    // --- Sesión ---
    | "INVALID_CREDENTIALS"
    | "INVALID_TOKEN"
    | "EMAIL_NOT_VERIFIED"
    | "USER_NOT_FOUND"
    | "UNAUTHORIZED"
    | "RATE_LIMIT_EXCEEDED"
    | "VALIDATION_ERROR"
    | "PERMISO_DENEGADO"
    // --- Empresas y suscripción ---
    | "EMPRESA_NOT_FOUND"
    | "SUSCRIPCION_NOT_FOUND"
    | "PLAN_NOT_FOUND"
    | "RAZON_REQUERIDA"
    | "SIN_CAMBIOS"
    | "ESTADO_INVALIDO"
    | "EXTENSION_INVALIDA"
    | "EXTENSION_NO_APLICA"
    | "SUSCRIPCION_SIN_VIGENCIA"
    // --- Planes ---
    | "PLAN_CODIGO_DUPLICADO"
    | "CODIGO_INVALIDO"
    | "CODIGO_INMUTABLE"
    | "MODULO_INVALIDO"
    | "LIMITE_INVALIDO"
    | "PRECIO_INVALIDO"
    | "MONEDA_INVALIDA"
    // --- Métricas y finanzas ---
    | "RANGO_INVALIDO"
    | "AGRUPACION_INVALIDA"
    // --- Costos operativos ---
    | "COSTO_NOT_FOUND"
    | "COSTO_YA_CERRADO"
    | "COSTO_NO_RECURRENTE"
    | "CONCEPTO_INVALIDO"
    | "CATEGORIA_INVALIDA"
    | "MONTO_INVALIDO"
    | "TIPO_CAMBIO_REQUERIDO"
    | "FRECUENCIA_INVALIDA"
    | "FECHA_INVALIDA"
    // --- Comisiones de pasarela ---
    | "PROVEEDOR_INVALIDO"
    | "PORCENTAJE_INVALIDO"
    | "FIJO_INVALIDO"
    // --- Propios del cliente ---
    | "SIN_ACCESO_ADMIN"
    | "NETWORK_ERROR"
    | "UNKNOWN_ERROR";

export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
    INVALID_CREDENTIALS: "Correo y/o contraseña no válidos.",
    INVALID_TOKEN: "Tu sesión ya no es válida. Inicia sesión nuevamente.",
    EMAIL_NOT_VERIFIED: "Debes verificar tu correo antes de iniciar sesión.",
    USER_NOT_FOUND: "No encontramos una cuenta con estos datos.",
    UNAUTHORIZED: "Tu sesión expiró. Inicia sesión nuevamente.",
    RATE_LIMIT_EXCEEDED: "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
    VALIDATION_ERROR: "Revisa los datos ingresados.",
    PERMISO_DENEGADO: "Esta cuenta no tiene acceso de administrador",
    EMPRESA_NOT_FOUND: "Esa empresa ya no existe.",
    SUSCRIPCION_NOT_FOUND: "Esa empresa no tiene suscripción.",
    PLAN_NOT_FOUND: "Ese plan no existe.",
    RAZON_REQUERIDA: "Escribe la razón del cambio.",
    SIN_CAMBIOS: "No hay nada que cambiar: los valores son los mismos.",
    ESTADO_INVALIDO: "Ese estado no es válido.",
    EXTENSION_INVALIDA: "Los días a extender deben ser un número positivo.",
    EXTENSION_NO_APLICA: "Extender días no aplica al estado actual de esta empresa.",
    SUSCRIPCION_SIN_VIGENCIA:
        "Con ese estado la suscripción quedaría sin vigencia. Indica cuántos días extender.",
    PLAN_CODIGO_DUPLICADO: "Ya existe un plan con ese código.",
    CODIGO_INVALIDO: "El código del plan no es válido.",
    CODIGO_INMUTABLE: "El código de un plan no se puede cambiar.",
    MODULO_INVALIDO: "Uno de los módulos seleccionados no existe.",
    LIMITE_INVALIDO: "Uno de los límites no es válido.",
    PRECIO_INVALIDO: "Uno de los precios no es válido.",
    MONEDA_INVALIDA: "Esa moneda no existe. Usa un código de tres letras como MXN o USD.",
    RANGO_INVALIDO: "El rango de fechas no es válido.",
    AGRUPACION_INVALIDA: "Esa agrupación no es válida.",
    COSTO_NOT_FOUND: "Ese gasto ya no existe.",
    COSTO_YA_CERRADO: "Ese gasto ya no está vigente: alguien más lo actualizó.",
    COSTO_NO_RECURRENTE: "Solo los gastos recurrentes se actualizan con un monto nuevo.",
    CONCEPTO_INVALIDO: "Escribe el concepto del gasto.",
    CATEGORIA_INVALIDA: "Esa categoría no es válida.",
    MONTO_INVALIDO: "El monto debe ser mayor que cero.",
    TIPO_CAMBIO_REQUERIDO: "Si la moneda no es MXN, captura el tipo de cambio.",
    FRECUENCIA_INVALIDA: "Un gasto recurrente necesita una frecuencia válida.",
    FECHA_INVALIDA: "La fecha no es válida.",
    PROVEEDOR_INVALIDO: "Ese proveedor de pago no es válido.",
    PORCENTAJE_INVALIDO: "El porcentaje no es válido.",
    FIJO_INVALIDO: "El cargo fijo no es válido.",
    SIN_ACCESO_ADMIN: "Esta cuenta no tiene acceso de administrador",
    NETWORK_ERROR: "No se pudo conectar con el servidor. Verifica tu conexión.",
    UNKNOWN_ERROR: "Ocurrió un error inesperado. Intenta de nuevo.",
};

/** Códigos cuyo `message` del servidor es más útil que el genérico de arriba. */
const CODIGOS_CON_MENSAJE_DEL_SERVIDOR = new Set<ApiErrorCode>([
    "SIN_CAMBIOS",
    "EXTENSION_NO_APLICA",
    "SUSCRIPCION_SIN_VIGENCIA",
    "FECHA_INVALIDA",
    "MODULO_INVALIDO",
    "LIMITE_INVALIDO",
    "PRECIO_INVALIDO",
]);

interface BackendErrorBody {
    code?: string;
    message?: string;
    errors?: string[];
}

const isKnownCode = (code: string | undefined): code is ApiErrorCode =>
    !!code && code in API_ERROR_MESSAGES;

const codeFromStatus = (status: number): ApiErrorCode => {
    switch (status) {
        case 401:
            return "UNAUTHORIZED";
        case 403:
            return "PERMISO_DENEGADO";
        case 429:
            return "RATE_LIMIT_EXCEEDED";
        default:
            return "UNKNOWN_ERROR";
    }
};

export class ApiError extends Error {
    readonly code: ApiErrorCode;
    /** HTTP status, o `null` si no hubo respuesta (red/timeout) o el error es del cliente. */
    readonly status: number | null;
    readonly fieldErrors: string[];
    /** El interceptor ya le avisó al usuario; la pantalla no debe sacar un segundo aviso. */
    yaNotificado = false;

    constructor(
        code: ApiErrorCode,
        message: string,
        status: number | null = null,
        fieldErrors: string[] = []
    ) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}

/** Convierte cualquier error (axios, red, desconocido) en un `ApiError`. Nunca lanza. */
export const normalizeApiError = (error: unknown): ApiError => {
    if (error instanceof ApiError) return error;

    if (isAxiosError(error)) {
        if (!error.response) {
            return new ApiError("NETWORK_ERROR", API_ERROR_MESSAGES.NETWORK_ERROR);
        }

        const status = error.response.status;
        const data = error.response.data as BackendErrorBody | undefined;
        const code: ApiErrorCode = isKnownCode(data?.code) ? data.code : codeFromStatus(status);
        const fieldErrors = Array.isArray(data?.errors) ? data.errors : [];

        const message =
            code === "VALIDATION_ERROR" && fieldErrors.length > 0
                ? fieldErrors.join(" ")
                : CODIGOS_CON_MENSAJE_DEL_SERVIDOR.has(code) && data?.message
                    ? data.message
                    : API_ERROR_MESSAGES[code];

        return new ApiError(code, message, status, fieldErrors);
    }

    return new ApiError("UNKNOWN_ERROR", API_ERROR_MESSAGES.UNKNOWN_ERROR);
};

/** Texto a mostrar ante un error, o `null` si el interceptor ya avisó. */
export const mensajeDeError = (error: unknown, fallback: string): string | null => {
    if (error instanceof ApiError) return error.yaNotificado ? null : error.message;
    return fallback;
};
