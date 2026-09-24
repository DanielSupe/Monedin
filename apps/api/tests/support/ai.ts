import type {
  AiCompletion,
  AiCompletionRequest,
  AiFailureReason,
  AiProvider,
} from "../../src/shared/ai/provider.js";
import { AiProviderError } from "../../src/shared/ai/provider.js";

export interface EspiaIA extends AiProvider {
  peticiones(): AiCompletionRequest[];

  ultima(): AiCompletionRequest;

  responder(text: string): void;

  fallar(reason: AiFailureReason, status?: number): void;

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

export function espiaIA(): EspiaIA {
  espia ??= new ProveedorEspia();
  return espia;
}

export function textoEntregado(request: AiCompletionRequest): string {
  return [request.system, ...request.history.map((turno) => turno.text), request.question].join(
    "\n",
  );
}
