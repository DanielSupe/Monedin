/**
 * «Cuántos hay», compuesto donde se usa.
 *
 * Existe para que ninguna cadena del catálogo lleve la cifra dentro. La regla es
 * de `close-style-debt` y la comprueba un test: un número dentro de un texto es
 * un número de negocio disfrazado, y es el que más se pudre porque al código lo
 * protege un esquema y al texto no lo protege nada.
 *
 * Las tres pantallas del niño cuentan algo, así que el ayudante evita la tercera
 * copia de la misma condición — que es como una de las tres acaba diciendo «1
 * premios».
 */
export function contar(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}
