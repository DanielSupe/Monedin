/**
 * Constantes de dominio de Monedin.
 *
 * Este archivo es la UNICA fuente de verdad de rangos y limites. La API los usa
 * para validar la entrada y el front para validar formularios antes de enviar.
 * Si un limite cambia, cambia aqui y en ningun otro sitio.
 *
 * Regla: nunca duplicar uno de estos numeros en un modulo. Ver CLAUDE.md.
 */

/** Prefijo bajo el que se sirve toda la API. Front y back lo comparten. */
export const API_PREFIX = "/api/v1";

/**
 * Rol familiar. Discrimina que puede ver y hacer quien llama.
 *
 * NO es una columna de la base de datos: solo los padres son `User` y el nino
 * vive como `ChildProfile`, asi que una columna de rol valdria siempre PARENT.
 * Es un tipo de dominio, y lo que discrimina es el actor. Ver la decision 2 del
 * design de `add-data-model`.
 */
export const FAMILY_ROLES = ["PARENT", "CHILD"] as const;
export type FamilyRole = (typeof FAMILY_ROLES)[number];

/** Edad del nino. Monedin esta disenado para 6 a 11 anos. */
export const CHILD_AGE_MIN = 6;
export const CHILD_AGE_MAX = 11;

/**
 * PIN de acceso del nino.
 *
 * El nino no tiene correo ni nombre de usuario: entra eligiendo su perfil dentro
 * de la cuenta del padre y tecleando este PIN. Se declara como rango y no como
 * longitud exacta porque el numero definitivo se cierra en `add-authentication`,
 * y dentro de este rango cabe sin romper nada.
 */
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

/** Nombre visible de una persona. */
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 60;

/** Titulo de una tarea o de un premio. */
export const TITLE_MIN_LENGTH = 2;
export const TITLE_MAX_LENGTH = 100;

/** Descripcion opcional de una tarea o de un premio. */
export const DESCRIPTION_MAX_LENGTH = 500;

/**
 * Monedas que vale una tarea o cuesta un premio.
 *
 * El minimo es 1, no 0: una tarea que no vale nada no es una tarea, y un premio
 * gratis no ensena nada sobre el valor de las cosas.
 */
export const COINS_MIN = 1;
export const COINS_MAX = 9999;

/** El saldo de un nino nunca es negativo. */
export const COINS_BALANCE_MIN = 0;

/** Paginacion por defecto de los listados de la API. */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
