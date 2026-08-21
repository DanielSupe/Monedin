/**
 * Catálogo de textos visibles al usuario.
 *
 * ÚNICO lugar del proyecto donde se escribe español dirigido a una persona.
 * Ningún módulo de dominio debe contener un string visible: si lo necesita, lo
 * añade aquí. Cambiar una redacción se hace en este archivo y se refleja en
 * todos los endpoints que lo usan.
 *
 * Cuando llegue un segundo idioma esto se sustituye por una librería de i18n;
 * migrar un catálogo centralizado es mecánico, extraer textos repartidos por
 * sesenta archivos no lo es. Ver decisión 10 del design.
 */
export const messages = {
  errors: {
    /** 401 — no hay sesión. */
    unauthorized: "Necesitas iniciar sesión para hacer esto.",
    /** 403 — hay sesión, pero el actor no puede tocar este recurso. */
    forbidden: "No tienes permiso para acceder a esto.",
    /** 404 — el recurso no existe. */
    notFound: "No encontramos lo que estás buscando.",
    /** 404 — la ruta no existe en la API. */
    routeNotFound: "La dirección solicitada no existe.",
    /** 409 — la operación choca con el estado actual. */
    conflict: "Esta operación no se puede completar en el estado actual.",
    /** 422 — la entrada no cumple su esquema. */
    validation: "Algunos datos no son válidos. Revisa los campos señalados.",
    /** 429 — demasiados intentos, hay un bloqueo activo. */
    tooManyAttempts:
      "Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.",
    /** 500 — fallo no previsto. Genérico a propósito. */
    internal:
      "Ocurrió un error inesperado. Vuelve a intentarlo en unos minutos. " +
      "Si el problema continúa, comparte el identificador del incidente.",
  },

  auth: {
    /**
     * Credenciales incorrectas.
     *
     * DELIBERADAMENTE ambiguo: es el mismo mensaje tanto si el correo no existe
     * como si la contraseña no coincide. Decir cuál de los dos falla le regala a
     * quien prueba la mitad del trabajo. Ver la spec `parent-authentication`.
     */
    invalidCredentials: "El correo o la contraseña no son correctos.",
    /** PIN incorrecto al entrar a un perfil de niño. */
    invalidPin: "Ese PIN no es correcto.",
    /** El perfil del niño está bloqueado por intentos fallidos. */
    childLocked:
      "Este perfil está bloqueado por varios intentos fallidos. " +
      "Puede desbloquearlo tu papá o tu mamá, o esperar unos minutos.",
    /** Correo ya registrado. */
    emailTaken: "Ese correo ya está registrado.",
    /** Se requiere sesión de padre para esta operación. */
    parentSessionRequired: "Necesitas la sesión de un adulto para hacer esto.",
  },

  health: {
    /** Etiqueta del servicio en la respuesta de salud. */
    serviceName: "monedin-api",
  },
} as const;

export type Messages = typeof messages;
