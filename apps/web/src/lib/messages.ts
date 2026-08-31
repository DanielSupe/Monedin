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
    /**
     * Con qué convenciones se formatea un número.
     *
     * Está aquí y no en un componente porque es una decisión de producto —el
     * primer mercado es Latinoamérica hispanohablante— y porque dejarla al
     * idioma del navegador haría que el mismo saldo se escribiera «1.250» o
     * «1,250» según el dispositivo de cada hijo.
     */
    locale: "es",
  },

  /**
   * La puerta pública: lo único que ve alguien que todavía no es nadie.
   *
   * Recibe a DOS personas distintas —quien no conoce el producto y quien lo usa
   * y perdió la sesión—, y por eso las dos acciones pesan igual.
   */
  landing: {
    /** El titular. Se escribe solo, pero el texto completo siempre está en el DOM. */
    headline: "Sus tareas valen monedas. Sus premios cuestan monedas.",
    subhead:
      "Monedín le enseña a tu hijo el ciclo completo: se esfuerza, gana, y decide en qué gastarlo. Tú apruebas cada paso.",

    /** Las dos acciones. Ninguna escondida detrás de la otra. */
    start: "Empezar",
    signIn: "Entrar",
    signInHint: "¿Ya tienes cuenta?",

    /** El centro de la visualización. La cifra es un ejemplo, no un dato real. */
    balanceLabel: "sus monedas",
    orbitLabel: "El ciclo de Monedín: tareas, premios y los perfiles de la familia",

    /** Las tres promesas. Sustituyen a los logos de socios que no tenemos. */
    promiseEarnTitle: "Haz tus tareas",
    promiseEarnBody: "Cada tarea vale las monedas que tú decidas.",
    promiseSpendTitle: "Elige tu premio",
    promiseSpendBody: "Del cine a una hora más de consola, con el precio que le pongas.",
    promiseApproveTitle: "Tú apruebas",
    promiseApproveBody: "Nada se acredita ni se gasta sin que lo revises.",
  },

  /**
   * Textos de la navegación: los destinos de cada marco y la pantalla de una
   * dirección que no existe.
   */
  nav: {
    /** Los destinos de la barra del niño. Cortos: caben debajo de un icono. */
    childHome: "Inicio",
    childTasks: "Tareas",
    childRewards: "Premios",
    childRedemptions: "Canjes",

    /** Los de la cabecera del padre. */
    parentHome: "Panel",
    parentTasks: "Tareas",
    parentRewards: "Premios",
    parentRedemptions: "Canjes",
    parentChildren: "Hijos",
    parentAccount: "Mi cuenta",

    /** Qué es cada marco, para quien no ve la disposición. */
    childNavLabel: "Dónde ir",
    parentNavLabel: "Secciones",

    /** Una dirección que no corresponde a ningún destino. */
    notFoundTitle: "Aquí no hay nada",
    notFoundBody: "Esa dirección no existe o dejó de existir.",
    notFoundBack: "Volver al inicio",
  },

  /**
   * Textos de las piezas del sistema de diseño.
   *
   * Una pieza no incrusta un texto visible, igual que una pantalla. Lo que la
   * distingue es que aquí casi todo es para tecnologías de asistencia: la
   * cifra de monedas se VE, pero «25 monedas» hay que decirlo.
   */
  ui: {
    coinsUnit: "monedas",
    coinsUnitSingular: "moneda",
    progressLabel: "Progreso",
    dismiss: "Cerrar",
    loading: "Cargando…",
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

    /**
     * Lo que el formulario no decía y ahora dice ANTES de rechazar.
     *
     * `passwordHelp` lleva el número dentro compuesto en el punto de uso, desde
     * la constante del contrato: escribirlo aquí a mano sería tener el mínimo en
     * dos sitios, y el día que cambie uno se quedaría mintiendo el otro.
     */
    passwordMinHelp: "Al menos",
    passwordMinHelpTail: "caracteres.",
    /** Por qué son DOS credenciales. Sin esto parece un error del producto. */
    twoKeysTitle: "Dos claves, para dos cosas distintas",
    twoKeysBody:
      "La contraseña solo la usarás al vincular un dispositivo nuevo. El PIN es lo que teclearás cada vez que entres a tu perfil.",

    /** El saludo del acceso, y la cinta que lo acompaña. */
    accessGreeting: "¡Bienvenido!",
    accessSignInLead: "Entra para continuar",
    accessSignUpLead: "Crea tu cuenta para empezar",
    /** La frase del panel de presentación, una por pantalla. */
    accessSignInTagline: "Tu casa, sus monedas. Entra y sigue el ciclo.",
    accessSignUpTagline: "Empieza a repartir tareas y a ver crecer sus monedas.",
    accessDiscLabel:
      "El ciclo de Monedín: se hace una tarea, se gana una moneda, se gasta en un premio",
    /** El envío es una flecha, así que su nombre no es opcional. */
    submitSignIn: "Entrar a mi cuenta",
    submitSignUp: "Crear mi cuenta",

    /** Rejilla de perfiles. */
    whoIsPlaying: "¿Quién eres?",
    createProfile: "Crear perfil",
    /**
     * Distintivo de la tesela del adulto. Es su NOMBRE ACCESIBLE, no un adorno:
     * un icono suelto hay que aprenderlo, y quien no ve la pantalla no lo
     * aprende nunca.
     */
    adultProfile: "Adulto",

    /**
     * Modo de administración de la rejilla.
     *
     * `editProfile` se compone con el nombre en el punto de uso —«Editar
     * Mateo»— porque es el nombre ACCESIBLE de la tesela entera: quien no ve la
     * pantalla tiene que oír a quién edita, no un «editar» suelto repetido
     * cuatro veces.
     */
    manageProfiles: "Administrar perfiles",
    manageProfilesTitle: "Administrar perfiles:",
    manageDone: "Listo",
    editProfile: "Editar",
    /** Título del teclado de PIN cuando se viene a administrar. */
    pinPromptToEdit: "Escribe tu PIN para editar tu perfil",
    /** Borrar el último dígito tecleado. Es un icono, así que necesita nombre. */
    pinDelete: "Borrar",

    changeProfile: "Cambiar de perfil",
    profileLocked: "Bloqueado",
    pinPrompt: "Escribe tu PIN",
    pinWrong: "Ese PIN no es correcto. Prueba otra vez.",
    adultPinWrong: "Ese PIN no es correcto.",
    adultPinLocked: "Demasiados intentos. Espera unos minutos o restablece el PIN con tu contraseña.",
    pinLocked: "Este perfil está bloqueado. Pídele a un adulto que lo desbloquee.",
    /** El identificador de la dirección no está en la rejilla. */
    profileNotFound: "Ese perfil ya no está disponible.",
    back: "Volver",

    /** Cambiar el PIN sabiendo el actual. Requiere perfil de padre activo. */
    myAvatarTitle: "Mi foto",
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
    addEvidence: "Súbele una foto (opcional)",
    evidenceReady: "¡Foto lista! Ahora marca la tarea.",
    evidenceAlt: "La foto que subiste",
    evidenceLabel: "Lo que mandó",
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
    addImage: "Ponerle una foto",
    removeImage: "Quitar la foto",
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

  uploads: {
    /** Selector y recorte. */
    choose: "Elegir una foto",
    change: "Cambiar la foto",
    remove: "Quitar la foto",
    crop: "Ajusta el encuadre",
    cropConfirm: "Usar esta foto",
    cancel: "Cancelar",
    preparing: "Preparando la foto…",
    uploading: "Subiendo…",
    zoom: "Acercar",

    /** Lo que puede salir mal, en el idioma de quien lo lee. */
    failed: "No se pudo subir la foto. Vuelve a intentarlo.",
    network: "No pudimos conectar para subir la foto. Revisa tu conexión.",
    tooLarge: "Esa imagen es demasiado grande, incluso comprimida.",
    wrongType: "Solo se admiten imágenes JPG, PNG o WEBP.",
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
