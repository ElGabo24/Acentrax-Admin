type Celda = string | number | null | undefined

/**
 * Una celda de texto que empiece con = + - @ la ejecuta Excel como fórmula. El
 * nombre de una empresa lo escribe un usuario, así que se antepone una comilla.
 * Los números pasan tal cual: un monto negativo no es una fórmula.
 */
const celda = (valor: Celda): string => {
    if (valor === null || valor === undefined) return ''
    if (typeof valor === 'number') return String(valor)
    const texto = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor
    return /[",\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto
}

/** CSV con BOM (Excel lo necesita para abrir bien los acentos) y saltos CRLF. */
export const aCsv = (encabezados: string[], filas: Celda[][]): string =>
    '﻿' + [encabezados, ...filas].map((fila) => fila.map(celda).join(',')).join('\r\n')

export const descargarCsv = (contenido: string, nombre: string) => {
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombre
    document.body.append(enlace)
    enlace.click()
    enlace.remove()
    URL.revokeObjectURL(url)
}
