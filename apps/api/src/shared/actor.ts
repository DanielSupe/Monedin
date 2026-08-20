/**
 * Quién está haciendo la petición.
 *
 * El controlador lo construye a partir de la sesión y lo pasa como PRIMER
 * argumento a todo método de servicio: `service.method(actor, dto)`.
 *
 * Esta firma es lo que hace cumplible la regla de que la autorización se valida
 * en la capa de negocio: si el actor es el primer parámetro obligatorio, no se
 * puede escribir un servicio que ignore quién llama sin que se note al leer la
 * firma. Ver la decisión 3 del design de `setup-foundations`.
 *
 * Es una **unión discriminada**, no un objeto con campos opcionales, porque el
 * niño no tiene fila en `User` y por tanto no tiene identificador de usuario.
 * Con campos opcionales se podía construir un actor de niño sin su perfil y
 * compilaba; así no. Ver la decisión 2 del design de `add-data-model`.
 *
 * La sesión real llega en `add-authentication`; aquí solo se fija el contrato.
 */
export type Actor = ParentActor | ChildActor;

/** Un padre. Es un `User`, y opera sobre todo lo que cuelga de él. */
export interface ParentActor {
  familyRole: "PARENT";
  /** Identificador del `User`. */
  userId: string;
}

/**
 * Un niño. NO es un `User`: es un `ChildProfile` dentro de la cuenta de su
 * padre.
 */
export interface ChildActor {
  familyRole: "CHILD";
  /** Identificador de su `ChildProfile`. */
  childProfileId: string;
  /**
   * Identificador del `User` de su padre.
   *
   * Viaja en el actor porque casi toda consulta de un niño necesita saber de qué
   * familia es, y llevarlo aquí evita una consulta previa en cada servicio.
   */
  parentId: string;
}

/** Estrecha el actor a un padre. */
export function isParent(actor: Actor): actor is ParentActor {
  return actor.familyRole === "PARENT";
}

/** Estrecha el actor a un niño. */
export function isChild(actor: Actor): actor is ChildActor {
  return actor.familyRole === "CHILD";
}

/**
 * Identificador del padre dueño de los datos sobre los que opera el actor.
 *
 * Para un padre es su propio identificador; para un niño, el de su padre. Es el
 * valor con el que un servicio filtra para no cruzar familias.
 */
export function owningParentId(actor: Actor): string {
  return actor.familyRole === "PARENT" ? actor.userId : actor.parentId;
}
