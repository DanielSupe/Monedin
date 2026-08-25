import { messages } from "../../shared/messages/index.js";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "../../shared/errors/domain-errors.js";

/**
 * Errores de dominio del módulo `auth`.
 *
 * Todos extienden los de `shared/errors`, así que heredan su estado HTTP sin
 * escribir una línea de mapeo. Lo único que aportan es un mensaje concreto del
 * catálogo.
 */

/**
 * Credenciales incorrectas.
 *
 * Un ÚNICO error tanto si el correo no existe como si la contraseña no
 * coincide. Tener dos sería regalarle a quien prueba la mitad del trabajo.
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super(messages.auth.invalidCredentials);
  }
}

/** PIN incorrecto al entrar a un perfil de niño. */
export class InvalidPinError extends UnauthorizedError {
  constructor() {
    super(messages.auth.invalidPin);
  }
}

/** El correo ya está registrado. */
export class EmailAlreadyRegisteredError extends ConflictError {
  constructor() {
    super(messages.auth.emailTaken);
  }
}

/** La operación necesita una sesión de padre y no la hay. */
export class ParentSessionRequiredError extends ForbiddenError {
  constructor() {
    super(messages.auth.parentSessionRequired);
  }
}

/**
 * La operación es la de un niño sobre su propio perfil.
 *
 * Existe para que cambiar el PIN propio y reponer el de un hijo sean rutas
 * distintas: la primera exige conocer el actual, la segunda no. Si un padre
 * pudiera entrar por la del niño, la vía de rescate tendría dos puertas y solo
 * una comprobaría el PIN anterior.
 */
export class ChildSessionRequiredError extends ForbiddenError {
  constructor() {
    super(messages.auth.childSessionRequired);
  }
}
