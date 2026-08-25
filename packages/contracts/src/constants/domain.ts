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

/**
 * Ciclo de vida de una tarea.
 *
 * NO existe un estado de rechazo: rechazar devuelve la tarea a PENDING para que
 * el nino la reintente. Un valor de enum que ningun flujo produce es una
 * invitacion a que alguien lo use mal.
 *
 * Duplica los valores del enum `TaskStatus` del esquema de Prisma, y no hay
 * forma de evitarlo: el cliente generado vive dentro de `apps/api` y el front
 * no puede importarlo. Lo que si se evita es que cada capa escriba su propia
 * lista. Es el mismo caso que FAMILY_ROLES.
 */
export const TASK_STATUSES = ["PENDING", "COMPLETED", "APPROVED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * Filtro del catálogo de premios. NO es una columna: el motor guarda
 * `Reward.isActive` como booleano, y este par es solo cómo se pide el filtro
 * en la query. Un estado y no un booleano porque puede crecer —un premio
 * agotado, uno programado— sin tener que renombrarse. Ver la decisión 6 del
 * design de `add-rewards`.
 */
export const REWARD_STATUSES = ["ACTIVE", "RETIRED"] as const;
export type RewardStatus = (typeof REWARD_STATUSES)[number];

/**
 * Hijos activos que caben en una familia.
 *
 * Es un limite de POLITICA, no un invariante de integridad: excederlo no
 * corrompe nada, asi que lo impone el servicio y no el motor. Un tope de filas
 * por padre no se expresa con un CHECK (es un recuento entre filas) y exigiria
 * un disparador. Ver la decision 7 del design de `add-children`.
 *
 * Diez es deliberadamente generoso: el numero existe para acotar el desorden
 * que puede crear quien tenga el dispositivo, porque el alta no pide PIN de
 * adulto. No opina sobre cuantos hijos puede tener una familia.
 *
 * Los hijos dados de baja NO cuentan.
 */
export const MAX_CHILDREN_PER_FAMILY = 10;

// ---------------------------------------------------------------------------
// Autenticacion
// ---------------------------------------------------------------------------

/**
 * Longitud del PIN del nino. Exacta, no un rango: cuatro digitos es lo que un
 * nino de 6 anos recuerda y teclea sin frustrarse.
 *
 * Lo que convierte cuatro digitos en una frontera NO es su longitud, son los
 * limites de intentos de mas abajo. Si alguien los relaja, el PIN deja de
 * proteger nada.
 */
export const PIN_LENGTH = 4;

/**
 * Minimo de la contrasena del padre.
 *
 * Se fija una longitud y no reglas de composicion (mayusculas, simbolos):
 * las reglas de composicion producen contrasenas peores y mas dificiles de
 * recordar, y la longitud es lo que de verdad aporta entropia.
 */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Bloqueo por intentos fallidos.
 *
 * Los numeros difieren por quien se equivoca. Un adulto teclea mal su
 * contrasena unas pocas veces; un nino de seis anos falla su PIN sin querer con
 * facilidad, asi que su bloqueo es mas corto para no convertir un despiste en
 * un berrinche. Y su padre puede desbloquearlo al momento.
 */
export const PARENT_MAX_FAILED_ATTEMPTS = 10;
export const PARENT_LOCKOUT_MINUTES = 15;
export const CHILD_MAX_FAILED_ATTEMPTS = 5;
export const CHILD_LOCKOUT_MINUTES = 5;

/**
 * Bloqueo del PIN de adulto, con los mismos numeros que su contrasena: es un
 * adulto tecleando, no un nino de seis anos. Se cuenta APARTE del de la
 * contrasena, para que bloquear uno no bloquee el otro.
 */
export const PARENT_PIN_MAX_FAILED_ATTEMPTS = 10;
export const PARENT_PIN_LOCKOUT_MINUTES = 15;

/**
 * Duracion de las sesiones.
 *
 * La del padre es larga porque el dispositivo es familiar y volver a teclear la
 * contrasena cada dia es justo lo que hace que la gente la apunte en un papel.
 * La del nino es corta y ademas nunca sobrevive a la de su padre.
 */
export const PARENT_SESSION_DAYS = 30;
export const CHILD_SESSION_HOURS = 12;

/**
 * Nombres de las cookies.
 *
 * `ACCOUNT_SESSION_COOKIE` acredita que el dispositivo pertenece a una cuenta.
 * NO concede poderes por si sola.
 * `PROFILE_SESSION_COOKIE` dice que perfil esta activo: el del padre o el de un
 * hijo. Es la que da el actor.
 *
 * Ver la decision 1 del design de add-profile-selection.
 */
export const ACCOUNT_SESSION_COOKIE = "monedin_session";
export const PROFILE_SESSION_COOKIE = "monedin_profile";

/** Paginacion por defecto de los listados de la API. */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
