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

/** Rol familiar del usuario. Discrimina que puede ver y hacer. */
export const FAMILY_ROLES = ["PARENT", "CHILD"] as const;
export type FamilyRole = (typeof FAMILY_ROLES)[number];

/** Edad del nino. Monedin esta disenado para 6 a 11 anos. */
export const CHILD_AGE_MIN = 6;
export const CHILD_AGE_MAX = 11;

/** Nombre de usuario del nino. El nino no tiene email. */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

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
