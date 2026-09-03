import { z } from "zod";
import { CHILD_AGE_MAX, CHILD_AGE_MIN, NAME_MAX_LENGTH, NAME_MIN_LENGTH } from "../constants/domain.js";
import { pinSchema } from "./auth.js";
import {
  AVATAR_FORMS_MESSAGE,
  avatarKeySchema,
  avatarValueSchema,
  hasAtMostOneAvatarForm,
} from "./avatar.js";
import { paginationQuerySchema, pageOf } from "./pagination.js";
import { uploadKeySchema } from "./uploads.js";

/**
 * Contratos de los perfiles de hijo, compartidos por la API y el front.
 *
 * Todos los esquemas de entrada son `.strict()`: un campo desconocido es un 422
 * y no algo que se ignora en silencio. Es lo que hace VERIFICABLE que el padre
 * dueño sale de la sesión y nunca de la petición, y lo que convierte «el saldo
 * no se edita» en algo que falla en vez de en algo que simplemente no ocurre.
 */

/** Nombre del hijo. Sin unicidad: dos hermanos pueden llamarse igual. */
export const childNameSchema = z
  .string()
  .trim()
  .min(NAME_MIN_LENGTH, "El nombre es demasiado corto.")
  .max(NAME_MAX_LENGTH, "El nombre es demasiado largo.");

/** Edad, opcional. El rango lo garantiza además un CHECK en el motor. */
export const childAgeSchema = z
  .number({ invalid_type_error: "La edad tiene que ser un número." })
  .int("La edad tiene que ser un número entero.")
  .min(CHILD_AGE_MIN, `Monedín es para niños de ${CHILD_AGE_MIN} a ${CHILD_AGE_MAX} años.`)
  .max(CHILD_AGE_MAX, `Monedín es para niños de ${CHILD_AGE_MIN} a ${CHILD_AGE_MAX} años.`);

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/**
 * Alta de un hijo.
 *
 * NO acepta `coins`, y no es un olvido. El alta es una ruta de SOLO CUENTA: no
 * exige haber entrado a ningún perfil, así que cualquiera con el dispositivo
 * puede llamarla. Eso es tolerable únicamente porque un perfil recién creado no
 * tiene poderes ni monedas. El día que alguien añada `coins` aquí, esta ruta se
 * convierte en una impresora de monedas.
 *
 * Tampoco acepta `parentId`: el padre dueño sale SIEMPRE de la sesión. Al ser
 * `.strict()`, mandarlo es 422 y no un campo ignorado.
 */
export const createChildSchema = z
  .object({
    name: childNameSchema,
    pin: pinSchema,
    age: childAgeSchema.optional(),
    avatar: avatarKeySchema.optional(),
  })
  .strict();

export type CreateChildInput = z.infer<typeof createChildSchema>;

/**
 * Edición de un hijo por su padre. Todo opcional, pero al menos un campo.
 *
 * `age` admite `null` explícito para poder BORRAR la edad, que es distinto de
 * no enviar el campo.
 */
export const updateChildSchema = z
  .object({
    name: childNameSchema.optional(),
    age: childAgeSchema.nullable().optional(),
    avatar: avatarKeySchema.optional(),
    /** La foto ya subida que se confirma como avatar. Excluyente con `avatar`. */
    avatarUploadKey: uploadKeySchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No hay nada que cambiar.",
  })
  .refine(hasAtMostOneAvatarForm, { message: AVATAR_FORMS_MESSAGE });

export type UpdateChildInput = z.infer<typeof updateChildSchema>;

/**
 * Lo único que un niño puede cambiar de su propio perfil: su avatar, en
 * cualquiera de sus dos formas.
 *
 * Su nombre y su edad los lleva su padre. Su PIN se cambia por la vía de `auth`,
 * porque tocar una credencial revoca sesiones y esa tabla es de aquel módulo.
 *
 * Los dos campos son opcionales por separado pero hay que mandar EXACTAMENTE
 * uno: sin ninguno no hay nada que cambiar, y con los dos no se sabe cuál gana.
 */
export const updateOwnChildSchema = z
  .object({
    avatar: avatarKeySchema.optional(),
    avatarUploadKey: uploadKeySchema.optional(),
  })
  .strict()
  .refine((value) => value.avatar !== undefined || value.avatarUploadKey !== undefined, {
    message: "No hay nada que cambiar.",
  })
  .refine(hasAtMostOneAvatarForm, { message: AVATAR_FORMS_MESSAGE });

export type UpdateOwnChildInput = z.infer<typeof updateOwnChildSchema>;

/** Identificador de hijo en la ruta. Validado, no leído a mano. */
export const childParamsSchema = z.object({
  childId: z.string().min(1, "Falta el identificador del hijo."),
});

export type ChildParams = z.infer<typeof childParamsSchema>;

/** Query del listado. Hoy solo pagina; los filtros llegarán con las tareas. */
export const listChildrenQuerySchema = paginationQuerySchema;

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

/**
 * Un hijo tal como lo ve su padre.
 *
 * El saldo SÍ aparece aquí, a diferencia de la rejilla: la rejilla es una
 * pantalla previa a identificarse y esta es la de gestión de un padre ya
 * acreditado.
 *
 * `avatar` no es nullable: sale siempre resuelto al de por defecto, para que el
 * front no tenga que tratar el caso vacío en cada pantalla.
 */
export const childSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: avatarValueSchema,
  age: z.number().int().nullable(),
  coins: z.number().int(),
  locked: z.boolean(),
  createdAt: z.string().datetime(),
});

export type Child = z.infer<typeof childSchema>;

export const childrenPageSchema = pageOf(childSchema);
export type ChildrenPage = z.infer<typeof childrenPageSchema>;

/** El perfil propio de un niño. Sin `locked`: si está dentro, no lo está. */
export const ownChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: avatarValueSchema,
  age: z.number().int().nullable(),
  coins: z.number().int(),
});

export type OwnChild = z.infer<typeof ownChildSchema>;
