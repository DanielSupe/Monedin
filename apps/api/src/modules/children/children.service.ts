import {
  MAX_CHILDREN_PER_FAMILY,
  type AvatarValue,
  type Child,
  type CreateChildInput,
  type ImageContentType,
  type OwnChild,
  type Page,
  type PaginationQuery,
  type UpdateChildInput,
  type UpdateOwnChildInput,
  type UploadUrl,
} from "@monedin/contracts";
import { randomUUID } from "node:crypto";
import type { Actor } from "../../shared/actor.js";
import { resolveAvatarForResponse } from "../../shared/avatar/resolve-avatar.js";
import { hashCredential } from "../../shared/crypto/credentials.js";
import { toPage, toSkipTake } from "../../shared/pagination.js";
import {
  extensionForContentType,
  getStorageProvider,
  isConfirmableUpload,
} from "../../shared/storage/index.js";
import * as authRepository from "../auth/auth.repository.js";
import {
  ChildNotFoundError,
  ChildRoleRequiredError,
  InvalidAvatarUploadError,
  MaxChildrenReachedError,
  ParentRoleRequiredError,
} from "./children.errors.js";
import * as repository from "./children.repository.js";
import type { ChildRow } from "./children.repository.js";

/**
 * Reglas de negocio Y autorización de los perfiles de hijo.
 *
 * `requireParent` y `requireChild` filtran el rol antes de llegar aquí, pero
 * son filtros GRUESOS: que alguien sea padre no dice si el hijo es suyo. Eso se
 * comprueba en cada método, y por eso el actor es un parámetro obligatorio.
 */

// ---------------------------------------------------------------------------
// Alta
// ---------------------------------------------------------------------------

/**
 * Crea un hijo dentro de la cuenta.
 *
 * ÚNICO método del módulo que no recibe el actor primero, y no es una
 * preferencia: la ruta es de SOLO CUENTA, así que cuando se llama puede no
 * haber actor todavía. El precedente es `auth.service.listProfiles`, que recibe
 * el identificador de la cuenta por la misma razón. El tipo es la señal: leer
 * `string` en vez de `Actor` avisa de que aquí todavía no hay nadie.
 *
 * `actingAs` es quién está operando, si es que ya hay alguien. Hace falta
 * porque `requireAccount` no distingue entre «cuenta sin perfil» y «cuenta con
 * perfil de niño», y la spec de `profile-selection` exige rechazar lo segundo.
 */
export async function createChild(
  accountUserId: string,
  actingAs: Actor | undefined,
  input: CreateChildInput,
): Promise<Child> {
  if (actingAs?.familyRole === "CHILD") {
    throw new ParentRoleRequiredError();
  }

  // El tope se cuenta sobre ACTIVOS, para que dar de baja libere hueco.
  //
  // Contar y crear no son atómicos entre sí: bajo Read Committed, dos altas
  // simultáneas en el último hueco pueden colarse las dos. Se acepta a
  // conciencia. Es un límite de POLÍTICA, no un invariante: pasar de 10 a 11 no
  // descuadra ningún saldo ni corrompe nada. Cerrarlo exigiría nivel
  // Serializable y mapear P2034, que hoy saldría como 500. Ver la decisión 7
  // del design de `add-children`.
  if ((await repository.countActiveChildren(accountUserId)) >= MAX_CHILDREN_PER_FAMILY) {
    throw new MaxChildrenReachedError();
  }

  const row = await repository.createChild({
    parentId: accountUserId,
    name: input.name,
    pinHash: await hashCredential(input.pin),
    ...(input.age === undefined ? {} : { age: input.age }),
    ...(input.avatar === undefined ? {} : { avatar: input.avatar }),
  });

  return toChild(row);
}

// ---------------------------------------------------------------------------
// Gestión del padre
// ---------------------------------------------------------------------------

export async function listChildren(
  actor: Actor,
  query: PaginationQuery,
): Promise<Page<Child>> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const result = await repository.findChildrenPage(actor.userId, toSkipTake(query));

  return toPage(query, {
    items: await Promise.all(result.items.map(toChild)),
    total: result.total,
  });
}

export async function getChild(actor: Actor, childId: string): Promise<Child> {
  return toChild(await ownedChild(actor, childId));
}

export async function updateChild(
  actor: Actor,
  childId: string,
  input: UpdateChildInput,
): Promise<Child> {
  const found = await ownedChild(actor, childId);

  const { avatarUploadKey, ...rest } = input;

  // Confirmar la foto es guardar su clave en el mismo campo que guardaría una
  // del catálogo: son dos formas del mismo dato, no dos columnas.
  const avatar =
    avatarUploadKey === undefined
      ? {}
      : { avatar: await confirmedAvatarKey(found.id, avatarUploadKey) };

  return toChild(await repository.updateChild(found.id, { ...rest, ...avatar }));
}

/** Una URL para subir la foto de un hijo de este padre. */
export async function requestAvatarUploadUrl(
  actor: Actor,
  childId: string,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  const found = await ownedChild(actor, childId);

  return createAvatarUploadUrl(found.id, contentType);
}

export async function deactivateChild(actor: Actor, childId: string): Promise<void> {
  const found = await ownedChild(actor, childId);

  // Cero filas significa que alguien ganó la carrera y ya lo dio de baja. Se
  // responde 404 y no 409 a propósito: la regla del 409 es para transiciones
  // CON efecto secundario, y una baja no acredita ni descuenta nada. Quien
  // pierde pregunta por un hijo que ya no existe, que es el caso 404 de
  // siempre. Ver la decisión 8 del design.
  if ((await repository.deactivateChild(found.id)) !== 1) {
    throw new ChildNotFoundError();
  }

  // Echarlo del dispositivo donde estuviera dentro. La tabla de sesiones es de
  // `auth`, así que se pasa por su repositorio en vez de tocarla desde aquí.
  await authRepository.revokeSessionsOfChildProfile(found.id);
}

// ---------------------------------------------------------------------------
// Vista propia del niño
// ---------------------------------------------------------------------------

export async function getOwnChild(actor: Actor): Promise<OwnChild> {
  return toOwnChild(await ownProfile(actor));
}

export async function updateOwnAvatar(
  actor: Actor,
  input: UpdateOwnChildInput,
): Promise<OwnChild> {
  const found = await ownProfile(actor);

  // El contrato ya garantiza que viene exactamente uno de los dos.
  const avatar =
    input.avatarUploadKey === undefined
      ? input.avatar
      : await confirmedAvatarKey(found.id, input.avatarUploadKey);

  return toOwnChild(await repository.updateChild(found.id, { avatar }));
}

/** Una URL para que el niño suba su propia foto. */
export async function requestOwnAvatarUploadUrl(
  actor: Actor,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  const found = await ownProfile(actor);

  return createAvatarUploadUrl(found.id, contentType);
}

/**
 * La clave la decide el servidor y lleva el perfil dueño dentro. Quien sube no
 * la elige: la recibe aquí y la devuelve igual al confirmar.
 */
async function createAvatarUploadUrl(
  childId: string,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  const key = `${avatarPrefix(childId)}${randomUUID()}.${extensionForContentType(contentType)}`;

  const { uploadUrl, expiresAt } = await getStorageProvider().createUploadUrl({ key, contentType });

  return { uploadUrl, key, expiresAt: expiresAt.toISOString() };
}

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

/**
 * El hijo indicado, si es de este padre y sigue activo.
 *
 * Los tres casos —no existe, es de otra familia, está dado de baja— lanzan el
 * MISMO error. Distinguirlos con un 403 confirmaría que ese perfil existe.
 */
async function ownedChild(actor: Actor, childId: string): Promise<ChildRow> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const found = await repository.findChildById(childId);
  if (found === null || found.deletedAt !== null || found.parentId !== actor.userId) {
    throw new ChildNotFoundError();
  }

  return found;
}

/**
 * El perfil del propio niño que llama.
 *
 * El identificador sale del ACTOR y nunca de la petición. Es lo que hace cierto
 * por construcción que un niño no vea a sus hermanos: no hay ningún parámetro
 * que pudiera apuntar a otro perfil, así que no hay nada que se pueda olvidar
 * de comprobar.
 */
async function ownProfile(actor: Actor): Promise<ChildRow> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

  const found = await repository.findChildById(actor.childProfileId);
  if (found === null || found.deletedAt !== null) {
    throw new ChildNotFoundError();
  }

  return found;
}

/**
 * El avatar sale siempre resuelto: una clave del catálogo tal cual, o una URL
 * firmada si es una foto propia. El front no ve nunca la clave del almacén ni
 * tiene que tratar el caso vacío.
 *
 * Esto es lo que vuelve asíncronos a los dos serializadores de abajo, y a todo
 * lo que los llama. Ver la decisión 5 del design de `add-file-storage`.
 */
function avatarOf(row: ChildRow): Promise<AvatarValue> {
  return resolveAvatarForResponse(getStorageProvider(), row.avatar);
}

async function toChild(row: ChildRow): Promise<Child> {
  return {
    id: row.id,
    name: row.name,
    avatar: await avatarOf(row),
    age: row.age,
    coins: row.coins,
    locked: row.lockedUntil !== null && row.lockedUntil.getTime() > Date.now(),
    createdAt: row.createdAt.toISOString(),
  };
}

/** Sin `locked`: si el niño está dentro, su perfil no lo está. */
async function toOwnChild(row: ChildRow): Promise<OwnChild> {
  return {
    id: row.id,
    name: row.name,
    avatar: await avatarOf(row),
    age: row.age,
    coins: row.coins,
  };
}

/**
 * La foto que se confirma tiene que ser de ESTE perfil y estar subida de verdad.
 *
 * El prefijo es la política de este módulo: qué significa que un avatar sea de
 * un hijo. Las dos comprobaciones las hace `isConfirmableUpload`, juntas,
 * porque olvidar cualquiera de las dos es un agujero. Ver la decisión 3 del
 * design.
 */
async function confirmedAvatarKey(childId: string, key: string): Promise<string> {
  if (!(await isConfirmableUpload(getStorageProvider(), key, avatarPrefix(childId)))) {
    throw new InvalidAvatarUploadError();
  }

  return key;
}

function avatarPrefix(childId: string): string {
  return `avatars/children/${childId}/`;
}
