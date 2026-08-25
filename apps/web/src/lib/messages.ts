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

    pin: "PIN de 4 dígitos",
    pinHelp: "Lo usarás cada vez que entres a tu perfil. La contraseña solo al vincular un dispositivo.",

    /** Rejilla de perfiles. */
    whoIsPlaying: "¿Quién eres?",
    createProfile: "Crear perfil",
    changeProfile: "Cambiar de perfil",
    profileLocked: "Bloqueado",
    pinPrompt: "Escribe tu PIN",
    pinWrong: "Ese PIN no es correcto. Prueba otra vez.",
    adultPinWrong: "Ese PIN no es correcto.",
    adultPinLocked: "Demasiados intentos. Espera unos minutos o restablece el PIN con tu contraseña.",
    pinLocked: "Este perfil está bloqueado. Pídele a un adulto que lo desbloquee.",
    back: "Volver",

    /** Cambiar el PIN sabiendo el actual. Requiere perfil de padre activo. */
    changePinTitle: "Cambiar PIN",
    currentPin: "PIN actual",
    newPin: "PIN nuevo",
    changePinSubmit: "Guardar PIN",
    pinChanged: "PIN actualizado.",

    /** Restablecer el PIN con la contraseña. Es la vía de rescate sin perfil activo. */
    forgotPin: "¿Olvidaste tu PIN?",
    resetPinTitle: "Restablecer PIN",
    resetPinSubmit: "Restablecer",
    pinReset: "PIN restablecido. Ya puedes entrar con el nuevo.",

    cancel: "Cancelar",
  },

  children: {
    /** Gestión de los perfiles desde el lado del padre. */
    title: "Perfiles de la familia",
    empty: "Todavía no has creado ningún perfil.",
    addChild: "Añadir un perfil",
    newChildTitle: "Nuevo perfil",
    editChildTitle: "Editar perfil",
    name: "Nombre",
    age: "Edad",
    ageOptional: "Edad (opcional)",
    avatar: "Animal",
    pin: "PIN de 4 dígitos",
    pinHelp: "Es el que usará para entrar a su perfil.",
    coins: "Monedas",
    save: "Guardar",
    create: "Crear perfil",
    cancel: "Cancelar",
    working: "Guardando…",
    back: "Volver",
    edit: "Editar",
    locked: "Bloqueado",
    unlock: "Desbloquear",
    resetPin: "Cambiar su PIN",

    /** La baja es definitiva: la interfaz tiene que decirlo antes, no después. */
    deactivate: "Dar de baja",
    deactivateConfirm:
      "Este perfil dejará de aparecer y no se puede recuperar. Su historial de monedas se conserva. ¿Seguro?",
    deactivateSubmit: "Sí, dar de baja",

    /** Lo que el niño ve y puede cambiar de lo suyo. */
    myProfileTitle: "Mi perfil",
    myCoins: "Mis monedas",
    chooseAvatar: "Elige tu animal",
    avatarSaved: "¡Listo!",
    changeMyPin: "Cambiar mi PIN",

    /** Errores. Un 409 aquí NO es «correo ya registrado». */
    maxReached: "Esta familia ya tiene el máximo de perfiles. Da de baja alguno para crear otro.",
    notFound: "No encontramos ese perfil.",
    forbidden: "No puedes hacer esto desde este perfil.",
    invalidData: "Revisa los datos: algo no es válido.",

    /** Paginación del listado. */
    previousPage: "Anterior",
    nextPage: "Siguiente",
  },

  tasks: {
    /** Gestión del padre. */
    title: "Tareas",
    empty: "Todavía no has repartido ninguna tarea.",
    newTask: "Repartir una tarea",
    newTaskTitle: "Nueva tarea",
    taskTitle: "¿Qué hay que hacer?",
    description: "Detalles (opcional)",
    dueDate: "Fecha límite (opcional)",
    dueDateHelp: "Solo se muestra: no caduca ni avisa.",
    dueLabel: "Para el",
    forWhom: "¿Para quién?",
    noChildren: "Primero crea un perfil de hijo.",
    sameCoins: "El mismo valor para todos",
    coinsPerChild: "Un valor para cada uno",
    coins: "Monedas",
    create: "Repartir",
    working: "Guardando…",
    cancel: "Cancelar",
    back: "Volver",
    remove: "Borrar",
    approve: "Aprobar",
    reject: "Rechazar",

    /** Filtro del listado. Filtrar por completadas es la bandeja de aprobación. */
    filterAll: "Todas",
    filterPending: "Pendientes",
    filterCompleted: "Por aprobar",
    filterApproved: "Aprobadas",

    /** Estados, tal como los lee una persona. */
    statusPending: "Pendiente",
    statusCompleted: "Hecha, esperando revisión",
    statusApproved: "Aprobada",

    /** Lo que ve el niño. */
    myTasksTitle: "Mis tareas",
    myTasksEmpty: "No tienes tareas ahora mismo. ¡Disfruta!",
    markDone: "¡Ya la hice!",
    waitingReview: "Se lo dijimos a tu papá o a tu mamá.",
    earned: "¡Ganaste estas monedas!",
    myTasks: "Ver mis tareas",

    /**
     * Errores. Un 409 aquí NO es el tope de perfiles: es que alguien se te
     * adelantó, o que la pantalla lleva un rato abierta.
     */
    conflict: "Esa tarea ya no está pendiente. Vuelve a cargar la lista para verla como está ahora.",
    notFound: "No encontramos esa tarea.",
    forbidden: "No puedes hacer esto desde este perfil.",
    invalidData: "Revisa los datos: algo no es válido.",

    /** Paginación del listado. */
    previousPage: "Anterior",
    nextPage: "Siguiente",
  },

  rewards: {
    /** Gestión del padre. */
    title: "Premios",
    empty: "Todavía no has publicado ningún premio.",
    newReward: "Publicar un premio",
    newRewardTitle: "Nuevo premio",
    rewardTitle: "¿Qué premio es?",
    description: "Detalles (opcional)",
    forWhom: "¿Para quién?",
    noChildren: "Primero crea un perfil de hijo.",
    sameCoins: "El mismo precio para todos",
    coinsPerChild: "Un precio para cada uno",
    coins: "Monedas",
    create: "Publicar",
    working: "Guardando…",
    cancel: "Cancelar",
    back: "Volver",

    /** Edición del premio: solo título y descripción. */
    edit: "Editar",
    editRewardTitle: "Editar premio",
    save: "Guardar",

    /** Reemplazo del conjunto de ofertas. */
    editOffers: "Cambiar quién puede pedirlo",
    offeredTo: "Ofrecido a",
    noOffers: "Sin ofertas todavía.",
    saveOffers: "Guardar ofertas",

    /** La baja es lógica: la interfaz tiene que decirlo antes, no después. */
    retire: "Retirar",
    retireConfirm:
      "Este premio dejará de poder pedirse y desaparecerá del escaparate de tus hijos. " +
      "Sigue en tu catálogo. ¿Seguro?",
    retireSubmit: "Sí, retirar",

    /** Filtro del catálogo. */
    filterActive: "Activos",
    filterRetired: "Retirados",

    /** Lo que ve el niño. */
    myRewardsTitle: "Mis premios",
    myRewardsEmpty: "Todavía no hay premios para ti.",
    myRewards: "Ver mis premios",
    affordable: "¡Ya te alcanza!",
    missingPrefix: "Te faltan",

    /**
     * Errores. Un 404 aquí NO es «esa tarea ya no está pendiente»: es que ese
     * premio ya no está, retirado o nunca existió.
     */
    notFound: "No encontramos ese premio.",
    forbidden: "No puedes hacer esto desde este perfil.",
    invalidData: "Revisa los datos: algo no es válido.",

    /** Paginación del listado. */
    previousPage: "Anterior",
    nextPage: "Siguiente",
  },

  redemptions: {
    /** Bandeja del padre. */
    title: "Canjes",
    empty: "No hay ninguna solicitud de canje todavía.",
    approve: "Aprobar",
    reject: "Rechazar",
    back: "Volver",
    coins: "Monedas",

    /** Filtro de la bandeja. */
    filterAll: "Todos",
    filterPending: "Pendientes",
    filterApproved: "Aprobados",
    filterRejected: "Rechazados",

    /** Estados, tal como los lee una persona. */
    statusPending: "Pendiente",
    statusApproved: "Aprobado",
    statusRejected: "Rechazado",

    /** Lo que ve el niño: sus propias solicitudes y el botón de pedir. */
    myRedemptionsTitle: "Mis canjes",
    myRedemptionsEmpty: "No has pedido ningún premio todavía.",
    myRedemptions: "Ver mis canjes",
    request: "Pedirlo",
    requesting: "Pidiendo…",
    alreadyRequested: "Ya lo pediste, espera a que te respondan.",

    /**
     * Errores. Un 409 aquí cubre tres casos —una transición perdida, el saldo
     * que ya no alcanza al aprobar, o un duplicado al solicitar— con el mismo
     * texto, porque el código HTTP es el contrato y no el mensaje.
     */
    notFound: "No encontramos ese canje.",
    forbidden: "No puedes hacer esto desde este perfil.",
    invalidData: "Revisa los datos: algo no es válido.",
    conflict: "Ese canje ya no se puede resolver así. Vuelve a cargar la lista para verlo actualizado.",

    /** Paginación de la bandeja. */
    previousPage: "Anterior",
    nextPage: "Siguiente",
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
