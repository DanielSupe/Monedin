/**
 * Catálogo de textos visibles del front.
 *
 * Mismo criterio que en la API: ni un string visible incrustado en un
 * componente. Ver decisión 10 del design.
 */
export const messages = {
  app: {
    title: "Monedín",
    tagline: "Educación financiera para chicos de 6 a 11 años",
  },

  health: {
    heading: "Estado del servicio",
    loading: "Consultando la API…",
    ok: "La API responde correctamente.",
    failed: "No se pudo contactar con la API.",
    service: "Servicio",
    version: "Versión",
  },

  auth: {
    /** Título de la pantalla de acceso. */
    signInTitle: "Entrar",
    signUpTitle: "Crear cuenta",
    name: "Tu nombre",
    email: "Correo",
    password: "Contraseña",
    signIn: "Entrar",
    signUp: "Crear cuenta",
    signOut: "Cerrar sesión",
    toSignUp: "¿Todavía no tienes cuenta? Créala",
    toSignIn: "¿Ya tienes cuenta? Entra",
    working: "Un momento…",

    /**
     * Credenciales incorrectas. Ambiguo a propósito, igual que en la API: no
     * dice cuál de los dos datos falla.
     */
    invalidCredentials: "El correo o la contraseña no son correctos.",
    emailTaken: "Ese correo ya está registrado.",
    invalidData: "Revisa los datos e inténtalo de nuevo.",
    /** Bloqueo. Distinto de una credencial incorrecta, y por eso otro mensaje. */
    tooManyAttempts: "Demasiados intentos. Espera unos minutos antes de volver a probar.",

    /** Selector de perfil de niño. */
    whoIsPlaying: "¿Quién eres?",
    enterAsChild: "Entrar como…",
    profileLocked: "Bloqueado",
    pinPrompt: "Escribe tu PIN",
    pinWrong: "Ese PIN no es correcto. Prueba otra vez.",
    pinLocked: "Este perfil está bloqueado. Pídele a un adulto que lo desbloquee.",
    back: "Volver",
    leaveChild: "Salir de mi perfil",
    noChildren: "Todavía no has añadido a nadie.",
  },

  errors: {
    /** La respuesta no se pudo interpretar como el cuerpo de error estándar. */
    unreadableResponse: "La respuesta del servidor no se pudo interpretar.",
    /** La respuesta correcta no cumple el contrato compartido. */
    unexpectedShape: "La respuesta del servidor no tiene la forma esperada.",
    /** No hubo respuesta: red caída o API apagada. */
    network: "No se pudo contactar con el servidor.",
  },
} as const;
