import { MAX_CHILDREN_PER_FAMILY } from "@monedin/contracts";

const rolRequerido = {
  adulto: "Necesitas el perfil de un adulto para hacer esto.",
  nino: "Esto solo lo puede hacer un perfil de niño.",
} as const;

const subidaInvalida = "Esa foto no se pudo confirmar. Vuelve a subirla.";

export const messages = {
  errors: {
    unauthorized: "Necesitas iniciar sesión para hacer esto.",

    forbidden: "No tienes permiso para acceder a esto.",

    notFound: "No encontramos lo que estás buscando.",

    routeNotFound: "La dirección solicitada no existe.",

    conflict: "Esta operación no se puede completar en el estado actual.",

    validation: "Algunos datos no son válidos. Revisa los campos señalados.",

    tooManyAttempts:
      "Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.",

    serviceUnavailable:
      "Este servicio no está disponible ahora mismo. Vuelve a intentarlo en un rato.",

    internal:
      "Ocurrió un error inesperado. Vuelve a intentarlo en unos minutos. " +
      "Si el problema continúa, comparte el identificador del incidente.",
  },

  auth: {
    invalidCredentials: "El correo o la contraseña no son correctos.",

    invalidPin: "Ese PIN no es correcto.",

    childLocked:
      "Este perfil está bloqueado por varios intentos fallidos. " +
      "Puede desbloquearlo tu papá o tu mamá, o esperar unos minutos.",

    emailTaken: "Ese correo ya está registrado.",

    parentSessionRequired: "Necesitas la sesión de un adulto para hacer esto.",

    childSessionRequired: "Esto solo lo puede hacer un perfil de niño sobre el suyo.",

    invalidAvatarUpload: subidaInvalida,
  },

  coins: {
    notFound: "No encontramos ese perfil.",
    forbidden: "No puedes ver este historial.",
  },

  children: {
    notFound: "No encontramos ese perfil.",

    maxReached:
      `Esta cuenta ya tiene el máximo de ${MAX_CHILDREN_PER_FAMILY} perfiles. ` +
      "Da de baja alguno para crear otro.",

    parentRoleRequired: rolRequerido.adulto,

    childRoleRequired: rolRequerido.nino,

    invalidAvatarUpload: subidaInvalida,
  },

  tasks: {
    notFound: "No encontramos esa tarea.",

    notEditable:
      "Esa tarea ya no está pendiente, así que no se puede cambiar ni borrar. " +
      "Si ya la hicieron, apruébala o recházala.",

    transitionConflict:
      "Esa tarea ya no está en el estado que esperabas. Vuelve a cargar la lista para verla como está ahora.",

    parentRoleRequired: rolRequerido.adulto,

    childRoleRequired: rolRequerido.nino,

    invalidEvidenceUpload: subidaInvalida,
  },

  rewards: {
    notFound: "No encontramos ese premio.",

    parentRoleRequired: rolRequerido.adulto,

    childRoleRequired: rolRequerido.nino,

    invalidImageUpload: subidaInvalida,
  },

  redemptions: {
    notFound: "No encontramos ese canje.",

    transitionConflict:
      "Ese canje ya no se puede resolver así. Vuelve a cargar la lista para verlo como está ahora.",

    insufficientBalance: "No te alcanzan las monedas para este premio.",

    duplicatePending: "Ya tienes una solicitud pendiente para este premio.",

    parentRoleRequired: rolRequerido.adulto,

    childRoleRequired: rolRequerido.nino,
  },

  assistant: {
    unavailable: "Monedín está descansando ahora mismo. Vuelve a preguntarle en un rato.",
  },

  health: {
    serviceName: "monedin-api",
  },
} as const;

export type Messages = typeof messages;
