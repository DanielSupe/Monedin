/**
 * Cómo escribe este producto una fecha, decidido en UN sitio.
 *
 * Lo escribían cuatro pantallas, de tres maneras: dos llamaban a
 * `toLocaleDateString()` a secas —que da `21/9/2026`—, una pedía día y mes
 * abreviado, y las maquetas escriben «7 de septiembre». El formato de una fecha
 * visible es una decisión del producto, igual que el tamaño de un título o el
 * mínimo de una contraseña, así que vive donde viven esas.
 *
 * Y LO MÁS CARO ERA LO QUE NO SE VEÍA: las cuatro pasaban la configuración
 * regional del DISPOSITIVO. Un producto entero en español imprime `9/21/2026` en
 * un teléfono en inglés, y quien desarrolla no lo descubre nunca porque el suyo
 * está en español. Aquí se DECLARA.
 */

/**
 * El idioma con el que el producto escribe sus fechas.
 *
 * Declarado y no heredado, por lo de arriba. El día que llegue un segundo
 * idioma este valor sale del mismo sitio del que salga el catálogo de textos, y
 * es lo único que hay que cambiar.
 */
const IDIOMA = "es-ES";

/**
 * NINGUNA de las dos lleva AÑO, y es a propósito.
 *
 * Todo lo que este producto fecha ocurrió o va a ocurrir en días: una tarea
 * repartida el lunes, un canje pedido anteayer, una fecha límite de esta semana.
 * El año no distingue nada y sí ocupa la columna que hace que una tabla quepa en
 * la escala del niño.
 */

/** Para una línea de texto: «8 de septiembre». Es como lo escriben las maquetas. */
export function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString(IDIOMA, { day: "numeric", month: "long" });
}

/**
 * Para una CELDA: «8 sept».
 *
 * Son dos formas porque son dos papeles, no por gusto: el historial de canjes
 * del niño son cuatro columnas en 390px, y ahí «8 de septiembre» empuja a las
 * otras tres. En una línea de texto, en cambio, el mes abreviado con un punto se
 * lee como una abreviatura y no como una fecha.
 */
export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString(IDIOMA, { day: "numeric", month: "short" });
}

/**
 * El día de HOY, con su nombre: «miércoles, 8 de septiembre».
 *
 * Es la única de las tres que no fecha un dato sino que sitúa a quien mira, y
 * por eso lleva el día de la semana: a un niño «miércoles» le dice más que «8».
 *
 * NO afirma nada sobre las tareas. La maqueta escribía encima «hoy te esperan 2
 * tareas» y eso sí habría sido falso —el modelo no tiene jornada, así que una
 * tarea repartida hace un mes sigue pendiente hoy—; poner la fecha no dice que
 * lo de debajo sea de hoy, dice qué día es.
 */
export function hoyConDia(): string {
  return new Date().toLocaleDateString(IDIOMA, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
