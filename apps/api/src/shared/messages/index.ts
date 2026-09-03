import { MAX_CHILDREN_PER_FAMILY } from "@monedin/contracts";

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
/**
 * Textos de rol, compartidos por los modulos que distinguen adulto de nino.
 *
 * Se declaran una vez y los reutilizan las secciones que los necesitan:
 * `children` y `tasks` dicen exactamente lo mismo cuando el perfil activo no es
 * el que la operacion pide, y dos copias del mismo texto se despegan a la
 * primera reescritura.
 */
const rolRequerido = {
  adulto: "Necesitas el perfil de un adulto para hacer esto.",
  nino: "Esto solo lo puede hacer un perfil de niño.",
} as const;

/**
 * Una subida que no se pudo confirmar, compartido por los cuatro modulos que
 * guardan imagenes.
 *
 * Es el MISMO texto para las tres causas —la foto no llego a subirse, la
 * referencia es de otro recurso, o esta mal formada— por la misma razon que un
 * hijo ajeno y uno inexistente dan el mismo 404: distinguirlas le diria a quien
 * prueba cual de sus intentos iba por buen camino. Para quien subio de buena fe,
 * las tres se arreglan igual: volver a intentarlo.
 */
const subidaInvalida = "Esa foto no se pudo confirmar. Vuelve a subirla.";

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
    /** La operación es la de un niño sobre su propio perfil. */
    childSessionRequired: "Esto solo lo puede hacer un perfil de niño sobre el suyo.",
    /** La foto que el padre confirma como avatar no es suya, o no se subió. */
    invalidAvatarUpload: subidaInvalida,
  },

  /**
   * El historial de monedas. Solo lectura, así que solo hay dos errores: no es
   * tuyo, o no eres quien puede pedirlo.
   */
  coins: {
    notFound: "No encontramos ese perfil.",
    forbidden: "No puedes ver este historial.",
  },

  children: {
    /**
     * Hijo inexistente, de otra familia, o dado de baja.
     *
     * Es el MISMO mensaje para los tres casos a propósito: distinguirlos
     * confirmaría a un padre que el perfil de otra familia existe. Ver la
     * decisión 4 del design de `add-children`.
     */
    notFound: "No encontramos ese perfil.",
    /** Tope de hijos activos alcanzado. */
    maxReached:
      `Esta cuenta ya tiene el máximo de ${MAX_CHILDREN_PER_FAMILY} perfiles. ` +
      "Da de baja alguno para crear otro.",
    /** La operación es de gestión y necesita el perfil del adulto. */
    parentRoleRequired: rolRequerido.adulto,
    /** La operación es la vista propia de un niño. */
    childRoleRequired: rolRequerido.nino,
    /** La foto que se confirma como avatar no es de este perfil, o no se subió. */
    invalidAvatarUpload: subidaInvalida,
  },

  tasks: {
    /**
     * Tarea inexistente, de otra familia, o de un hermano.
     *
     * Es el MISMO mensaje para los tres casos, por la misma razón que en
     * `children`: distinguirlos confirmaría que esa tarea existe.
     */
    notFound: "No encontramos esa tarea.",
    /**
     * Se intentó editar o borrar una tarea que ya no está pendiente.
     *
     * Una tarea que el niño marcó merece una respuesta —aprobarla o
     * rechazarla—, y una aprobada ya movió monedas: el historial no se
     * reescribe.
     */
    notEditable:
      "Esa tarea ya no está pendiente, así que no se puede cambiar ni borrar. " +
      "Si ya la hicieron, apruébala o recházala.",
    /**
     * La transición no encontró el estado del que decía partir.
     *
     * Casi siempre es que alguien se adelantó desde otro dispositivo, o que la
     * pantalla lleva un rato abierta.
     */
    transitionConflict:
      "Esa tarea ya no está en el estado que esperabas. Vuelve a cargar la lista para verla como está ahora.",
    /** Repartir, aprobar y rechazar son cosa del adulto. */
    parentRoleRequired: rolRequerido.adulto,
    /** Marcar una tarea como hecha la hace el niño al que le tocó. */
    childRoleRequired: rolRequerido.nino,
    /** La evidencia adjunta no es de esta tarea, o no llegó a subirse. */
    invalidEvidenceUpload: subidaInvalida,
  },

  rewards: {
    /**
     * Premio inexistente, de otra familia, no ofrecido a este niño, o ya
     * retirado.
     *
     * Es el MISMO mensaje para todos los casos, por la misma razón que en
     * `children` y en `tasks`: distinguirlos confirmaría que ese premio existe.
     */
    notFound: "No encontramos ese premio.",
    /** Publicar, editar, reemplazar ofertas y retirar son cosa del adulto. */
    parentRoleRequired: rolRequerido.adulto,
    /** El escaparate propio lo ve un niño sobre su propio perfil. */
    childRoleRequired: rolRequerido.nino,
    /** La foto que se confirma no es de este premio, o no llegó a subirse. */
    invalidImageUpload: subidaInvalida,
  },

  redemptions: {
    /**
     * Canje inexistente, de otra familia, o de un hermano.
     *
     * Es el MISMO mensaje para los tres casos, por la misma razón que en
     * `children`, `tasks` y `rewards`: distinguirlos confirmaría que ese canje
     * existe.
     */
    notFound: "No encontramos ese canje.",
    /**
     * La transición no encontró el estado del que decía partir, o el saldo ya
     * no alcanzaba al momento de aprobar.
     *
     * Es el MISMO mensaje para los dos casos a propósito: el código HTTP —409—
     * es el contrato, no el texto. Ver la decisión 3 del design de
     * `add-redemptions`.
     */
    transitionConflict:
      "Ese canje ya no se puede resolver así. Vuelve a cargar la lista para verlo como está ahora.",
    /** El saldo no alcanza el precio del premio al momento de solicitarlo. */
    insufficientBalance: "No te alcanzan las monedas para este premio.",
    /** Ya existe una solicitud pendiente del mismo premio. */
    duplicatePending: "Ya tienes una solicitud pendiente para este premio.",
    /** Aprobar y rechazar son cosa del adulto. */
    parentRoleRequired: rolRequerido.adulto,
    /** Solicitar un canje lo hace el niño sobre su propio perfil. */
    childRoleRequired: rolRequerido.nino,
  },

  health: {
    /** Etiqueta del servicio en la respuesta de salud. */
    serviceName: "monedin-api",
  },
} as const;

export type Messages = typeof messages;
