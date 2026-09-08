/**
 * Contrato del proveedor de IA.
 *
 * ÚNICA forma en que el resto del proyecto habla con un modelo de lenguaje.
 * Está aquí, y no dentro de un módulo, por el mismo argumento que
 * `StorageProvider`: para que ningún módulo de dominio sepa que existe Google.
 *
 * Lo que este archivo NO sabe, y no debe saber: qué es un hijo, una tarea o un
 * premio; quién puede preguntar qué; ni de dónde salió la instrucción de
 * sistema que recibe. Recibe un guion ya compuesto y un hilo ya acotado, igual
 * que `applyCoinMovement` recibe una transacción y no la abre. Quién puede
 * preguntar y con qué contexto lo decide el servicio del módulo, con el actor,
 * ANTES de llamar aquí.
 *
 * Es el PRIMER servicio externo del proyecto: hasta `add-family-assistant` no
 * había ni una llamada HTTP saliente en producción fuera del SDK de S3.
 */

/**
 * Quién habló en un turno, en el vocabulario del PROVEEDOR.
 *
 * `model` y no `assistant`, que es como se llama en `@monedin/contracts`. Son
 * dos vocabularios distintos a propósito: el contrato habla el idioma del
 * producto y esto habla el del proveedor. Quien traduce es el servicio, en un
 * solo sitio.
 */
export type AiRole = "user" | "model";

/** Un mensaje del hilo. */
export interface AiTurn {
  role: AiRole;
  text: string;
}

export interface AiCompletionRequest {
  /** La instrucción de sistema, YA compuesta por quien llama. */
  system: string;
  /** Los turnos previos, YA acotados por quien llama. */
  history: AiTurn[];
  /**
   * Lo que se acaba de preguntar.
   *
   * Va en su propio campo y no dentro de `system` a propósito: concatenar el
   * texto de quien pregunta dentro de la instrucción es lo que hace trivial una
   * inyección de prompt. Ver la decisión 8 del design.
   */
  question: string;
}

export interface AiCompletion {
  text: string;
}

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletion>;
}

/**
 * Por qué no se pudo responder.
 *
 * Los cuatro acaban en el mismo 503 hacia fuera, porque el remedio de quien
 * pregunta es idéntico —esperar y reintentar— y distinguirlos en la respuesta
 * sería información que nadie puede usar. Se distinguen aquí y en el log, que
 * es donde sí sirven.
 */
export type AiFailureReason = "unavailable" | "rate_limited" | "timeout" | "invalid_response";

/**
 * El proveedor no pudo responder.
 *
 * NO es un error de dominio: `shared/ai` no sabe de HTTP ni de códigos, igual
 * que `shared/storage` no sabe de negocio. Quien lo traduce es el servicio del
 * módulo.
 *
 * Lo que lleva dentro está elegido para que sea IMPRIMIBLE: un motivo y un
 * estado, y nada más. Nunca la petición, ni sus cabeceras, ni su dirección.
 *
 * Y a propósito NO lleva `cause`, aunque encadenar el error original sea lo
 * natural y ayudaría a depurar: el logger de este proyecto no enmascara nada en
 * ejecución, así que cualquier cosa que quepa dentro de este error puede acabar
 * impresa. Se pierde detalle a conciencia para que la clave no pueda viajar.
 */
export class AiProviderError extends Error {
  constructor(
    readonly reason: AiFailureReason,
    readonly status?: number,
  ) {
    super(`ai_provider_${reason}`);
    this.name = "AiProviderError";
  }
}

/**
 * Qué modelo responde.
 *
 * CONSTANTE y no configuración, por el mismo argumento que los TTL del almacén:
 * no es un parámetro que cambie entre despliegues, así que si resulta
 * equivocado lo que hay que cambiar es el número, no la forma de configurarlo.
 *
 * Y hay una razón que el almacén no tiene: un modelo distinto en desarrollo que
 * en producción significa probar respuestas que no son las que se entregan.
 *
 * La clave SÍ es configuración, porque es un secreto y difiere por entorno.
 *
 * ERA `gemini-2.5-flash`, y cambió al implementar: Google ya no lo sirve a
 * claves nuevas —responde 404 diciendo literalmente «no longer available to new
 * users»—, así que el valor planificado no llegó a funcionar ni una vez. Es
 * justamente el caso para el que esto es una constante y no una variable de
 * entorno: se corrige aquí, en un sitio, y se revisa como código.
 *
 * NO se usa un alias móvil como `gemini-flash-latest`, que sería lo cómodo: un
 * nombre que se mueve solo cambia el comportamiento del producto sin que nadie
 * toque nada, y eso es lo contrario de lo que esta constante existe para
 * garantizar. Si hay que subir de modelo, se sube a mano y se prueba.
 */
export const AI_MODEL = "gemini-3.5-flash-lite";

/**
 * Cuánto se espera antes de rendirse.
 *
 * Veinte segundos: por encima de eso, quien pregunta ya cerró la pantalla. Sin
 * un límite explícito una petición colgada retiene un manejador de Express
 * indefinidamente, y esta es la primera llamada saliente del proyecto, así que
 * no hay ninguna otra que lo esté haciendo por costumbre.
 */
export const AI_REQUEST_TIMEOUT_MS = 20_000;

/**
 * Cuánto puede responder.
 *
 * Acota lo que se paga por una respuesta y, sobre todo, lo que un niño de seis
 * años tiene que leer. Una explicación que no cabe aquí es una explicación que
 * debería estar en una pantalla, no en un chat.
 */
export const AI_MAX_OUTPUT_TOKENS = 700;

/**
 * Cuánto se le deja improvisar.
 *
 * Baja a propósito: lo que se le pide es leer unos datos y explicarlos, no
 * inventar. Con temperatura alta empieza a rellenar huecos, que es exactamente
 * lo que su guion le prohíbe.
 */
export const AI_TEMPERATURE = 0.4;
