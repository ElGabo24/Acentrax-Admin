/** Cómo se llama cada interruptor en pantalla; la clave es el contrato con el servidor. */
const NOMBRES: Record<string, string> = {
    DESCUBRE_WHATSAPP: 'Descubre y WhatsApp',
}

export const nombreDeFlag = (clave: string) => NOMBRES[clave] ?? clave
