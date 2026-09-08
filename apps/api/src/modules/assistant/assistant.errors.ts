import { ServiceUnavailableError } from "../../shared/errors/domain-errors.js";
import { messages } from "../../shared/messages/index.js";

/**
 * Monedin no pudo responder.
 *
 * UNO solo para los cuatro motivos —no llego a tiempo, cuota agotada, el
 * proveedor devolvio un 5xx, o el cuerpo era ilegible—, por la misma razon por
 * la que un canje da un mensaje para dos causas distintas: el remedio de quien
 * pregunta es identico en los cuatro, esperar y volver a intentarlo.
 * Distinguirlos en la respuesta seria informacion que nadie puede usar. Se
 * distinguen en el log, que es donde si sirven.
 *
 * Y es 503 y no 500 a proposito. Ver la cabecera de `ServiceUnavailableError`.
 */
export class AssistantUnavailableError extends ServiceUnavailableError {
  constructor() {
    super(messages.assistant.unavailable);
  }
}
