import type {
  AiCompletion,
  AiCompletionRequest,
  AiFailureReason,
  AiProvider,
} from "../../src/shared/ai/provider.js";
import { AiProviderError } from "../../src/shared/ai/provider.js";

/**
 * El doble del proveedor de IA, y el único que la batería usa.
 *
 * Se instala en el `beforeAll` GLOBAL de `setup.ts`, no test a test, para que
 * NINGÚN test pueda llamar a Google por descuido — ni siquiera uno escrito
 * mañana por quien no leyó esto.
 *
 * Es lo contrario de lo que se hace con el almacén, y la diferencia está
 * razonada: allí se va contra MinIO real porque lo que hay que probar son
 * propiedades del PROVEEDOR —que una firma rechaza otro tipo, que una URL
 * caduca—, y un doble diría que sí a todo. Aquí lo que hay que probar es qué
 * mandamos y qué hacemos con lo que vuelve, que es propiedad de NUESTRO código;
 * y como la respuesta de un modelo no es determinista, un proveedor real ni
 * siquiera podría sostener una aserción.
 */
export interface EspiaIA extends AiProvider {
  /** Todo lo que se le pidió, en orden. */
  peticiones(): AiCompletionRequest[];
  /** La última petición. Lanza si no hubo ninguna, para que el test no pase en falso. */
  ultima(): AiCompletionRequest;
  /** Lo que responderá a partir de ahora. */
  responder(text: string): void;
  /** Que a partir de ahora falle, con el motivo indicado. */
  fallar(reason: AiFailureReason, status?: number): void;
  /** Vuelve al estado inicial: sin peticiones y respondiendo lo de por defecto. */
  reiniciar(): void;
}

const RESPUESTA_POR_DEFECTO = "Respuesta de prueba de Monedín.";

class ProveedorEspia implements EspiaIA {
  #peticiones: AiCompletionRequest[] = [];
  #texto = RESPUESTA_POR_DEFECTO;
  #fallo: { reason: AiFailureReason; status?: number } | undefined;

  complete(request: AiCompletionRequest): Promise<AiCompletion> {
    this.#peticiones.push(request);

    const fallo = this.#fallo;
    if (fallo !== undefined) {
      return Promise.reject(new AiProviderError(fallo.reason, fallo.status));
    }

    return Promise.resolve({ text: this.#texto });
  }

  peticiones(): AiCompletionRequest[] {
    return this.#peticiones;
  }

  ultima(): AiCompletionRequest {
    const ultima = this.#peticiones.at(-1);
    if (ultima === undefined) {
      // Devolver algo vacío dejaría pasar un test que cree estar mirando el
      // prompt y en realidad no mira nada.
      throw new Error("No se le pidió nada al proveedor de IA");
    }
    return ultima;
  }

  responder(text: string): void {
    this.#texto = text;
    this.#fallo = undefined;
  }

  fallar(reason: AiFailureReason, status?: number): void {
    this.#fallo = status === undefined ? { reason } : { reason, status };
  }

  reiniciar(): void {
    this.#peticiones = [];
    this.#texto = RESPUESTA_POR_DEFECTO;
    this.#fallo = undefined;
  }
}

let espia: EspiaIA | undefined;

/** El espía, uno por proceso, igual que `testPrisma()`. */
export function espiaIA(): EspiaIA {
  espia ??= new ProveedorEspia();
  return espia;
}

/**
 * TODO el texto que se le entregó al modelo, en una sola cadena.
 *
 * Se mira el prompt ENTERO —instrucción, hilo y pregunta— y no los campos que
 * el test se acuerde de mirar. Es el mismo argumento que `valoresNumericos` en
 * `tests/support/rewards.ts`: una comprobación de fuga que solo inspecciona
 * parte de lo enviado deja de valer en cuanto alguien añade un campo.
 */
export function textoEntregado(request: AiCompletionRequest): string {
  return [request.system, ...request.history.map((turno) => turno.text), request.question].join(
    "\n",
  );
}
