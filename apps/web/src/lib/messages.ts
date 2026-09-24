import { CHILD_AGE_MAX, CHILD_AGE_MIN, PIN_LENGTH } from "@monedin/contracts";

export const messages = {
  app: {
    title: "Monedín",

    locale: "es",
  },

  landing: {
    headline: "Sus tareas valen monedas. Sus premios cuestan monedas.",
    subhead:
      "Monedín le enseña a tu hijo el ciclo completo: se esfuerza, gana, y decide en qué gastarlo. Tú apruebas cada paso.",

    start: "Empezar",
    signIn: "Entrar",
    signInHint: "¿Ya tienes cuenta?",

    balanceLabel: "sus monedas",
    orbitLabel: "El ciclo de Monedín: tareas, premios y los perfiles de la familia",

    aboutTitle: "Dinero de mentira, decisiones de verdad",
    aboutBody:
      "Las monedas de Monedín no salen de tu cuenta ni llegan a ninguna. No hay pagos, no hay " +
      "tarjetas y no se comparte nada con otras familias: el saldo de tu hijo vive dentro de tu casa.",
    aboutLearns:
      "Lo que sí es real es lo que aprende. Ve cuánto tiene, cuánto le falta para lo que quiere, y " +
      "qué pasó con cada moneda que gastó.",

    howTitle: "Así funciona, de principio a fin",
    howStepTaskTitle: "Hace una tarea",
    howStepTaskBody: "Recoger la mesa, la cama, los deberes. Vale lo que tú decidas.",
    howStepApproveTitle: "Tú apruebas",
    howStepApproveBody: "Nada se acredita sin que lo mires. Es el paso que sostiene el resto.",
    howStepCoinsTitle: "Gana sus monedas",
    howStepCoinsBody: "Se le acreditan al aprobar, y ve de dónde salió cada una.",
    howStepRewardTitle: "Elige su premio",
    howStepRewardBody: "Del cine a una hora más de consola, con el precio que le pongas.",

    howLoop: "Y vuelta a empezar. Canjear también pasa por ti.",

    previewTitle: "Las dos caras de Monedín",
    previewBody:
      "Tú gestionas y apruebas; tu hijo ve lo suyo, en grande. Es la misma aplicación con dos " +
      "medidas distintas, porque un niño de seis años y tú no leéis una pantalla igual.",

    previewParentLabel: "Ejemplo del panel del padre.",
    previewChildLabel: "Ejemplo del inicio del niño.",
    previewNotOurs: "Los datos no son de nadie.",
    previewParentTag: "Lo que ves tú",
    previewChildTag: "Lo que ve tu hijo",

    previewPending: "Te esperan",
    previewPendingTasks: "tareas por aprobar",
    previewChildren: "Tus hijos",
    previewChildOne: "Mateo",
    previewChildTwo: "Emma",
    previewChildGreeting: "Hola, Mateo",
    previewChildBalance: "tus monedas",
    previewChildTasks: "Mis tareas",
    previewChildRewards: "Mis premios",

    closingTitle: "Empieza esta semana",
    closingBody: "Crea tu cuenta, añade a tus hijos y pon la primera tarea. Se tarda menos que leer esto.",
    closingAction: "Crear mi cuenta",
  },

  nav: {
    childHome: "Inicio",
    childTasks: "Tareas",
    childRewards: "Premios",
    childRedemptions: "Canjes",

    parentHome: "Panel",
    parentTasks: "Tareas",
    parentRewards: "Premios",
    parentRedemptions: "Canjes",
    parentChildren: "Hijos",
    parentAccount: "Mi cuenta",

    themeSystem: "Tema: el del sistema",
    themeLight: "Tema: claro",
    themeDark: "Tema: oscuro",

    parentAccountLead: "Lo tuyo, no lo de tus hijos",

    pendingSuffix: "esperando",

    childNavLabel: "Dónde ir",
    parentNavLabel: "Secciones",

    menu: "Menú",
    drawerLabel: "Navegación",

    collapseSidebar: "Contraer",
    expandSidebar: "Expandir",

    notFoundTitle: "Aquí no hay nada",
    notFoundBody: "Esa dirección no existe o dejó de existir.",
    notFoundBack: "Volver al inicio",
  },

  parents: {
    greeting: "Hola,",

    pendingTitle: "Te esperan",
    tasksToApprove: "tareas por aprobar",
    taskToApprove: "tarea por aprobar",
    redemptionsWaiting: "canjes esperando respuesta",
    redemptionWaiting: "canje esperando respuesta",

    allClear: "Todo al día. No hay nada esperando por ti.",

    childrenTitle: "Tus hijos",
    childrenLink: "Gestionar perfiles",
    childrenEmpty: "Todavía no has creado ningún perfil.",

    consoleFailed: "No pudimos cargar tu panel.",
  },

  ui: {
    coinsUnit: "monedas",
    coinsUnitSingular: "moneda",
    progressLabel: "Progreso",

    progressOf: "de",
    progressDone: "hechas",
    dismiss: "Cerrar",
    loading: "Cargando…",

    previousPage: "Anterior",
    nextPage: "Siguiente",
    paginationLabel: "Páginas",
  },

  coins: {
    title: "De dónde salieron tus monedas",
    parentTitle: "Historial de monedas",

    ledgerNote:
      "El historial no se edita ni se borra, ni siquiera desde aquí: lo impide la base de datos. " +
      "Un movimiento equivocado se corrige registrando otro que lo compense.",
    empty: "Todavía no hay movimientos.",
    seeHistory: "Ver de dónde salieron",
    seeChildHistory: "Ver su historial",

    earned: "Ganó",
    spent: "Gastó",
    balanceAfter: "Quedó con",

    reasonTaskApproved: "Por una tarea aprobada",
    reasonRedemptionApproved: "Por un premio canjeado",
    reasonManualAdjustment: "Ajuste de su padre",

    notFound: "No encontramos ese perfil.",
    forbidden: "No puedes ver este historial.",
  },

  tutorial: {
    next: "Seguir",
    finish: "Empezar",
    skip: "Saltar",
    replay: "Ver el recorrido otra vez",

    replayLead: "Te enseño dónde está cada cosa.",
    replayAction: "Verlo",
    replayFailed: "No pudimos volver a abrir el recorrido.",

    stepOf: "de",

    parentWelcomeTitle: "Bienvenido a Monedín",
    parentWelcomeBody:
      "Soy Monedín. En un momento te enseño dónde está cada cosa de tu panel.",
    parentPendingTitle: "Lo que te espera",
    parentPendingBody:
      "Aquí aparece lo que tus hijos han marcado y todavía no has aprobado. Nada se acredita ni se gasta sin que pases por aquí.",
    parentChildrenTitle: "Tus hijos",
    parentChildrenBody:
      "Cada uno con su perfil, su PIN y su saldo. Desde aquí los creas y los gestionas.",
    parentCreateTitle: "Tareas y premios",
    parentCreateBody:
      "Tú pones las tareas y decides lo que vale cada una, y publicas los premios con su precio.",
    parentDoneTitle: "Ya está",
    parentDoneBody: "Empieza creando a tu primer hijo y ponle una tarea. Lo demás sale solo.",

    childWelcomeTitle: "¡Hola! Soy Monedín",
    childWelcomeBody: "Te enseño esto en un momento.",
    childBalanceTitle: "Tus monedas",
    childBalanceBody: "Aquí ves cuántas tienes. Suben cuando tu padre aprueba una tarea tuya.",
    childTasksTitle: "Tus tareas",
    childTasksBody: "Haz una y márcala. Cuando tu padre la apruebe, ganas sus monedas.",
    childRewardsTitle: "Tus premios",
    childRewardsBody: "Para esto sirven las monedas: eliges un premio y lo pides.",
    childDoneTitle: "¡A por ello!",
    childDoneBody: "Empieza por una tarea. Yo te espero aquí.",
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
    signInTitle: "Entrar",
    signUpTitle: "Crear cuenta",
    name: "Tu nombre",
    email: "Correo",
    password: "Contraseña",
    signIn: "Entrar",
    signUp: "Crear cuenta",
    signOut: "Cerrar sesión",

    signOutConsequence:
      "No es lo mismo que cambiar de perfil. Cerrar sesión desvincula este dispositivo: " +
      "para volver habrá que teclear el correo y la contraseña.",

    pinVsPassword:
      "El PIN es lo que tecleas para entrar a tu perfil. La contraseña, solo al vincular un " +
      "dispositivo nuevo.",

    accountEmailLabel: "Correo de la cuenta:",
    toSignUp: "¿Todavía no tienes cuenta? Créala",
    toSignIn: "¿Ya tienes cuenta? Entra",
    working: "Un momento…",

    invalidCredentials: "El correo o la contraseña no son correctos.",
    emailTaken: "Ese correo ya está registrado.",
    invalidData: "Revisa los datos e inténtalo de nuevo.",

    tooManyAttempts: "Demasiados intentos. Espera unos minutos antes de volver a probar.",

    pinLead: "PIN de",
    pinTail: "dígitos",
    pinHelp: "Lo usarás cada vez que entres a tu perfil. La contraseña solo al vincular un dispositivo.",

    passwordMinHelp: "Al menos",
    passwordMinHelpTail: "caracteres.",

    twoKeysTitle: "Dos claves, para dos cosas distintas",
    twoKeysBody:
      "La contraseña solo la usarás al vincular un dispositivo nuevo. El PIN es lo que teclearás cada vez que entres a tu perfil.",

    accessGreeting: "¡Bienvenido!",

    accessSignInLead: "Entra a tu cuenta",
    accessSignUpLead: "Crea tu cuenta",

    accessSignInTagline: "Tu casa, sus monedas. Entra y sigue el ciclo.",
    accessSignUpTagline: "Empieza a repartir tareas y a ver crecer sus monedas.",
    accessDiscLabel:
      "El ciclo de Monedín: se hace una tarea, se gana una moneda, se gasta en un premio",

    submitSignIn: "Entrar a mi cuenta",
    submitSignUp: "Crear mi cuenta",

    whoIsPlaying: "¿Quién eres?",

    whoIsPlayingLead: "Toca tu cara y escribe tu PIN.",
    createProfile: "Crear perfil",

    adultProfile: "Adulto",

    manageProfiles: "Administrar perfiles",
    manageProfilesTitle: "Administrar perfiles",

    manageProfilesLead: "Toca un perfil para editarlo. Te pedirá su PIN.",
    manageDone: "Listo",
    editProfile: "Editar",

    pinPromptToEdit: "Escribe tu PIN para editar tu perfil",

    pinDelete: "Borrar",

    changeProfile: "Cambiar de perfil",
    profileLocked: "Bloqueado",
    pinPrompt: "Escribe tu PIN",
    pinWrong: "Ese PIN no es correcto. Prueba otra vez.",
    adultPinWrong: "Ese PIN no es correcto.",
    adultPinLocked: "Demasiados intentos. Espera unos minutos o restablece el PIN con tu contraseña.",
    pinLocked: "Este perfil está bloqueado. Pídele a un adulto que lo desbloquee.",

    profileNotFound: "Ese perfil ya no está disponible.",
    back: "Volver",

    myAvatarTitle: "Cambiar mi foto",
    changePinTitle: "Cambiar mi PIN",
    currentPin: "PIN actual",
    newPin: "PIN nuevo",
    changePinSubmit: "Guardar PIN",
    pinChanged: "PIN actualizado.",

    forgotPin: "¿Olvidaste tu PIN?",
    resetPinTitle: "Restablecer PIN",
    resetPinSubmit: "Restablecer",

    resetPinLead: "Estás bloqueado fuera de tu perfil. Con tu contraseña puedes ponerte un PIN nuevo.",
    resetPinPasswordHelp: "La de tu cuenta. Es lo que demuestra que eres tú.",
    resetPinNewPinHelp: "Lo que teclearás para entrar a tu perfil a partir de ahora.",
    pinReset: "PIN restablecido. Ya puedes entrar con el nuevo.",

    cancel: "Cancelar",
  },

  children: {
    title: "Perfiles de la familia",
    empty: "Todavía no has creado ningún perfil.",
    addChild: "Añadir un perfil",
    newChildTitle: "Nuevo perfil",
    editChildTitle: "Editar perfil",

    editChildLead: "Su nombre, su cara y su clave",
    name: "Nombre",
    ageOptional: "Edad (opcional)",

    avatar: "Elige tu animal",

    photoLater: "La foto se pone después, al editar este perfil.",
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

    resetPin: "Su PIN",
    resetPinFull: "Cambiar el PIN de",
    historyShort: "Historial",
    historyFull: "Ver el historial de",
    editFull: "Editar el perfil de",
    unlockFull: "Desbloquear el perfil de",
    deactivateFull: "Dar de baja el perfil de",

    lockedVsDeactivated:
      "Dar de baja no se puede deshacer. Bloqueado es otra cosa: pasa cuando alguien falla el PIN varias veces, y se quita desde aquí.",

    listLead: "Cada uno con su PIN y su saldo",

    deactivateVsLock:
      "Dar de baja un perfil NO se deshace desde aquí: desaparece de tus listas con su saldo. " +
      "Bloquear es otra cosa —pasa solo si alguien falla el PIN varias veces— y se quita en un toque.",

    deactivate: "Dar de baja",
    deactivateConfirm:
      "Este perfil dejará de aparecer y no se puede recuperar. Su historial de monedas se conserva. ¿Seguro?",

    deactivateLockedHint:
      "Este perfil solo está bloqueado porque alguien falló el PIN. Eso se quita con un toque y no borra nada.",
    deactivateSubmit: "Sí, dar de baja",

    coinsEachChosen: "a cada hijo elegido",
    pickAtLeastOne: "Elige al menos un hijo.",

    myProfileTitle: "Mi perfil",
    myProfileLead: "Tu cara y tu clave",

    homeGreeting: "Hola,",

    homeBalanceLabel: "monedas",

    homeGreetingLead: "¡Hola! Soy Monedín.",
    homeNothingPending: "No te queda nada por hacer. ¡Disfruta!",
    homeAllDone: "Ya hiciste todo lo tuyo. Te aviso cuando haya algo nuevo.",
    homePendingOne: "tarea por hacer",
    homePendingMany: "tareas por hacer",

    homeMarkExplains: "Cuando marques una, aviso a tu papá o a tu mamá.",

    homeTasksTitle: "Tus tareas",

    homeCoinsTitle: "Tus monedas",
    homeCoinsAll: "Ver todo",
    homeTasksAll: "Ver todas",

    myCoins: "Mis monedas",
    chooseAvatar: "Elige tu animal",
    avatarSaved: "¡Listo!",
    changeMyPin: "Cambiar mi PIN",

    myPinLead: "Son tus",
    myPinTail: "números secretos. Si se te olvidan, un adulto puede ponerte otros.",

    yearsOne: "año",
    yearsMany: "años",

    maxReached: "Esta familia ya tiene el máximo de perfiles. Da de baja alguno para crear otro.",
    notFound: "No encontramos ese perfil.",
    forbidden: "No puedes hacer esto desde este perfil.",
    invalidData: "Revisa los datos: algo no es válido.",
  },

  tasks: {
    title: "Tareas",
    empty: "Todavía no has repartido ninguna tarea.",
    newTask: "Repartir una tarea",
    newTaskTitle: "Nueva tarea",

    newTaskLead: "Tú decides lo que vale",

    handOutTitle: "Qué pasa al repartir",
    handOutEach:
      "Cada hijo elegido recibe SU tarea. Son independientes: que uno la marque no afecta a los otros.",
    handOutMarkLead: "Cuando la marque, te aparecerá en «",
    handOutMarkTail: "». Marcarla no le paga nada todavía.",
    handOutApprove: "Las monedas se le acreditan cuando TÚ la apruebas, y solo entonces.",
    handOutEditable:
      "Una tarea solo se puede editar mientras esté pendiente. Rechazarla la devuelve a pendiente, no la borra.",
    taskTitle: "¿Qué hay que hacer?",
    description: "Detalles (opcional)",
    dueDate: "Fecha límite (opcional)",
    dueDateHelp: "Solo se muestra: no caduca ni avisa.",
    dueLabel: "Para el",

    handedOutLabel: "Repartida el",

    inboxLead: "Lo que tus hijos han marcado",
    forWhom: "¿Para quién?",
    noChildren: "Primero crea un perfil de hijo.",
    sameCoins: "El mismo valor para todos",
    coinsPerChild: "Un valor para cada uno",
    coins: "Monedas",

    valueLegend: "¿Cuánto vale?",
    create: "Repartir",
    working: "Guardando…",
    cancel: "Cancelar",
    back: "Volver",
    remove: "Borrar",
    approve: "Aprobar",
    reject: "Rechazar",

    filterAll: "Todas",
    filterPending: "Pendientes",
    filterCompleted: "Por aprobar",
    filterApproved: "Aprobadas",
    filterLabel: "Filtrar por estado",

    wholeBatchNote:
      "Cada reparto se muestra completo, incluso las tareas que no casan con el filtro: " +
      "lo que se filtra son los repartos, no las filas.",

    groupPending: "Por hacer",
    groupCompleted: "Esperando revisión",
    groupApproved: "Hechas",

    statusPending: "Pendiente",
    statusCompleted: "Hecha, esperando revisión",
    statusApproved: "Aprobada",

    myTasksTitle: "Mis tareas",

    pendingCountOne: "pendiente",
    pendingCountMany: "pendientes",

    nothingPending: "Nada pendiente",
    myTasksEmpty: "No tienes tareas ahora mismo. ¡Disfruta!",
    markDone: "¡Ya la hice!",

    howTitle: "Cómo funciona",
    howDoLead: "Haces la tarea y tocas «",
    howDoTail: "».",
    howReview: "Tu papá o tu mamá la revisan.",
    howApproved: "Al aprobarla, las monedas ya son tuyas.",
    addEvidence: "Súbele una foto (opcional)",
    evidenceReady: "¡Foto lista! Ahora marca la tarea.",
    evidenceAlt: "La foto que subiste",
    evidenceLabel: "Lo que mandó",
    waitingReview: "Se lo dijimos a tu papá o a tu mamá.",
    earned: "¡Ganaste estas monedas!",
    myTasks: "Ver mis tareas",

    conflict: "Esa tarea ya no está pendiente. Vuelve a cargar la lista para verla como está ahora.",
    notFound: "No encontramos esa tarea.",
    forbidden: "No puedes hacer esto desde este perfil.",
    invalidData: "Revisa los datos: algo no es válido.",
  },

  rewards: {
    catalogLead: "Lo que pueden pedir, y a qué precio",

    title: "Premios",
    empty: "Todavía no has publicado ningún premio.",
    newReward: "Publicar un premio",
    newRewardTitle: "Nuevo premio",

    newRewardLead: "Tú pones el precio",
    rewardTitle: "¿Qué premio es?",
    description: "Detalles (opcional)",

    forWhom: "¿A quién se lo ofreces, y por cuánto?",
    noChildren: "Primero crea un perfil de hijo.",
    sameCoins: "El mismo precio para todos",
    coinsPerChild: "Un precio para cada uno",
    valueLegend: "¿Cuánto cuesta?",

    coins: "Monedas",

    publishTitle: "Qué pasa al publicar",
    publishShows:
      "Aparece en el escaparate de los hijos a los que se lo ofreces, cada uno con SU precio.",
    publishSaving:
      "Si no le alcanza, lo ve igual: con una barra de cuánto le falta. Eso es lo que convierte " +
      "un saldo en una decisión de ahorro.",
    publishFrozen:
      "Al pedirlo, el precio se CONGELA. Si luego lo subes, ese canje mantiene el que tenía.",
    create: "Publicar",
    working: "Guardando…",
    cancel: "Cancelar",
    back: "Volver",

    edit: "Editar",
    editRewardTitle: "Editar premio",
    addImage: "Ponerle una foto",

    optionalImage: "Foto (opcional)",

    imageSquare: "Se recorta cuadrada: en el escaparate van en rejilla y si no, se dentea.",
    imageReady: "Foto lista. Se guardará al publicar el premio.",

    imageFallbackGlyph: "🎁",
    removeImage: "Quitar la foto",
    save: "Guardar",

    editOffers: "Cambiar ofertas",
    offeredTo: "Ofrecido a",
    noOffers: "Sin ofertas todavía.",
    saveOffers: "Guardar ofertas",

    retire: "Retirar",

    retireConfirm:
      "Dejará de poder pedirse y desaparecerá del escaparate de tus hijos. " +
      "Los canjes que ya te hayan pedido siguen su curso. " +
      "Sigue en tu catálogo: publicándolo otra vez vuelve. ¿Seguro?",
    retireSubmit: "Sí, retirar",

    filterLabel: "Filtrar por estado",
    filterActive: "Activos",
    filterRetired: "Retirados",

    myRewardsTitle: "Mis premios",
    myRewardsLead: "Canjea lo que ganaste",

    goalOf: "/",
    nextRewardTitle: "Tu próximo premio",
    allAffordableTitle: "¡Te alcanza para todo!",
    allAffordableBody: "Elige el que más te guste, que ya lo tienes.",

    countOne: "premio",
    countMany: "premios",
    myRewardsEmpty: "Todavía no hay premios para ti.",
    myRewards: "Ver mis premios",
    affordable: "¡Ya te alcanza!",
    missingPrefix: "Te faltan",

    notFound: "No encontramos ese premio.",
    forbidden: "No puedes hacer esto desde este perfil.",
    invalidData: "Revisa los datos: algo no es válido.",
  },

  redemptions: {
    title: "Canjes",

    inboxLead: "Lo que tus hijos han pedido",

    requestedLabel: "Pedido el",

    ruleDiscountOnApprove: "Las monedas se descuentan al aprobar, no al pedir.",
    rulePriceFrozen:
      "El precio se congela el día de la solicitud: si luego subes el del premio, este canje mantiene el que tenía.",
    ruleRejectFree: "Rechazar no descuenta nada.",
    empty: "No hay ninguna solicitud de canje todavía.",
    approve: "Aprobar",
    reject: "Rechazar",
    back: "Volver",
    coins: "Monedas",

    filterAll: "Todos",
    filterPending: "Pendientes",
    filterApproved: "Aprobados",
    filterRejected: "Rechazados",
    filterLabel: "Filtrar por estado",

    statusPending: "Pendiente",
    statusApproved: "Aprobado",
    statusRejected: "Rechazado",

    myRedemptionsTitle: "Mis canjes",

    historyCaption: "Lo que he pedido",
    columnReward: "Premio",
    columnCoins: "Monedas",
    columnStatus: "Estado",
    columnWhen: "Cuándo",

    countOne: "canje",
    countMany: "canjes",
    myRedemptionsEmpty: "No has pedido ningún premio todavía.",

    myRedemptionsExplainTitle: "Las monedas se van cuando lo aprueban, no cuando lo pides.",
    myRedemptionsExplainBody:
      "Y si dicen que no, no pierdes nada: el precio se guarda tal como estaba el día que lo pediste.",

    summaryPending: "esperando",
    summaryApproved: "aprobados",
    summaryRejected: "rechazados",
    summaryScope: "En esta página",
    myRedemptions: "Ver mis canjes",
    request: "Pedirlo",
    requesting: "Pidiendo…",
    alreadyRequested: "Ya lo pediste, espera a que te respondan.",

    notFound: "No encontramos ese canje.",
    forbidden: "No puedes hacer esto desde este perfil.",
    invalidData: "Revisa los datos: algo no es válido.",
    conflict: "Ese canje ya no se puede resolver así. Vuelve a cargar la lista para verlo actualizado.",
  },

  uploads: {
    choose: "Elegir una foto",

    orYourOwnPhoto: "O ponte una foto tuya",
    change: "Cambiar la foto",
    remove: "Quitar la foto",
    crop: "Ajusta el encuadre",

    cropLead: "La foto de un premio va cuadrada, para que la rejilla no se dentee.",
    cropConfirm: "Usar esta foto",
    cancel: "Cancelar",
    preparing: "Preparando la foto…",
    uploading: "Subiendo…",
    zoom: "Acercar",

    failed: "No se pudo subir la foto. Vuelve a intentarlo.",
    network: "No pudimos conectar para subir la foto. Revisa tu conexión.",
    tooLarge: "Esa imagen es demasiado grande, incluso comprimida.",
    wrongType: "Solo se admiten imágenes JPG, PNG o WEBP.",
  },

  help: {
    title: "Preguntas frecuentes",

    lead: "Lo que más se pregunta",

    coinsQ: "¿Qué son las monedas?",
    coinsA:
      "Son monedas de mentira que solo valen dentro de tu familia. No son dinero real y no se " +
      "pueden cambiar por dinero: sirven para aprender cómo funciona ganar y gastar.",

    earnQ: "¿Cómo se ganan monedas?",
    earnA:
      "Un adulto crea una tarea y le pone un valor. Cuando el niño la hace, la marca como " +
      "terminada y queda esperando revisión.",

    approveQ: "¿Cuándo se pagan las monedas de una tarea?",
    approveA:
      "Al aprobarla. Aprobar es lo que acredita las monedas, así que hasta que un adulto la " +
      "revisa el saldo no cambia. Marcar una tarea no paga nada por sí solo.",

    twiceQ: "Aprobé dos veces y me avisó. ¿Hice algo mal?",
    twiceA:
      "No. La primera aprobación ya contó y pagó las monedas; la segunda se rechaza para no " +
      "pagar dos veces por lo mismo. El aviso está para que sepas que ya estaba hecho.",

    rewardQ: "¿Cómo se consigue un premio?",
    rewardA:
      "El niño lo pide desde sus premios y un adulto lo aprueba. Aprobar es lo que descuenta las " +
      "monedas, y el precio queda fijado en el momento de pedirlo aunque después cambie.",

    rejectQ: "Si rechazan un canje, ¿se pierden las monedas?",
    rejectA:
      "No se pierde nada. Las monedas solo se descuentan al aprobar, así que un canje rechazado " +
      "deja el saldo exactamente como estaba.",

    siblingQ: "¿Puede un niño ver las monedas de su hermano?",
    siblingA:
      "No. Cada niño ve solo lo suyo: sus tareas, sus premios y su saldo. Ni siquiera " +
      "preguntándomelo a mí, porque yo tampoco lo sé.",

    ageQLead: "¿Para qué edades es Monedín? De",
    ageQTail: "años",
    ageA:
      "Está pensado para esas edades, que es cuando el ciclo de esfuerzo, ingreso y decisión de " +
      "gasto se entiende mejor haciéndolo que explicándolo.",

    pinQLead: "¿Y si alguien olvida su PIN de",
    pinQTail: "dígitos?",
    pinA:
      "Un adulto puede reponer el PIN de un hijo desde su perfil. Y si el que se olvida es el " +
      "del adulto, se restablece con el correo y la contraseña de la cuenta.",

    childCoinsQ: "¿Qué son las monedas?",
    childCoinsA:
      "Son de mentira: no se compran ni se cambian por dinero de verdad. Sirven para pedir los " +
      "premios que tu papá o tu mamá publican.",

    childEarnQ: "¿Cómo consigo más?",
    childEarnA:
      "Haciendo tus tareas y marcándolas. Las monedas llegan cuando un adulto la aprueba, no " +
      "cuando tú la marcas.",

    childWaitQ: "Marqué una tarea y no me pagaron. ¿Por qué?",
    childWaitA:
      "Porque falta que la revisen. Mientras tanto la verás en «Esperando revisión».",

    childRejectQ: "Si me dicen que no a un premio, ¿pierdo monedas?",
    childRejectA:
      "No. Las monedas solo se descuentan cuando te aprueban el canje. Un «no» no te cuesta nada.",

    childSiblingQ: "¿Puedo ver las monedas de mi hermano?",
    childSiblingA: "No. Cada uno ve solo las suyas, y eso no se puede cambiar.",

    childPinQ: "Se me olvidó mi PIN.",
    childPinA: "Pídele ayuda a un adulto: desde su perfil puede ponerte uno nuevo.",

    frozenQ: "Subí el precio de un premio que ya me habían pedido.",
    frozenA:
      "Ese canje mantiene el precio del día en que se pidió. El precio nuevo vale para los " +
      "siguientes.",

    retireQ: "¿Retirar un premio es lo mismo que dejar de ofrecérselo a un hijo?",
    retireA:
      "No. Retirar lo quita del escaparate de todos; cambiar ofertas decide a quién se le ofrece " +
      "y a qué precio.",

    moreDoubts: "¿Tu duda no está aquí?",
    moreDoubtsLead: "Pregúntamela a mí: conozco tus tareas, tus premios y tus monedas.",
    askMonedin: "Pregúntale a Monedín",
  },

  widget: {
    openChat: "Pregúntale a Monedín",

    childHomeBalance: "¿Quieres saber de dónde salieron tus monedas?",
    childHomeAsk: "Pregúntame lo que quieras sobre tus monedas.",
    childHomeCycle: "¿Sabes cómo se ganan monedas aquí?",
    childTasksDo: "¿No sabes por dónde empezar? Yo te ayudo.",
    childTasksApproval: "¿Ya la hiciste y sigue esperando? Te cuento por qué.",
    childRewardsChoose: "¿Te ayudo a elegir a cuál llegas antes?",
    childRewardsGoal: "¿Cuánto te falta para el que más quieres?",
    childRedemptionsWait: "¿Tu premio sigue esperando? Pregúntame.",
    childRedemptionsWhy: "¿Te dijeron que no? Te explico qué pasó.",
    childAccountPin: "¿Se te olvidó tu PIN? Te digo qué hacer.",
    childAccountAvatar: "¿Quieres cambiar tu foto? Te digo cómo.",
    childHelp: "Si tu duda no está aquí, pregúntamela.",

    parentHomePending: "¿Te cuento qué tienes esperando?",
    parentHomeAsk: "Pregúntame por las tareas o los premios de tu familia.",
    parentTasksApprove: "¿Dudas de cuánto vale una tarea? Hablemos.",
    parentTasksConflict: "¿Aprobaste y te avisó? Te explico por qué.",
    parentRewardsPrice: "¿Te ayudo a poner un precio que motive?",
    parentRewardsRetire: "¿Retirar o dejar de ofrecer? No es lo mismo.",
    parentRedemptionsFrozen: "El precio se congela al pedirlo. ¿Te lo explico?",
    parentRedemptionsReject: "¿Rechazar devuelve monedas? Pregúntame.",
    parentChildrenPin: "¿Alguien olvidó su PIN? Te digo cómo reponerlo.",
    parentChildrenBalance: "¿Quieres repasar cómo va cada uno?",

    parentAccountLeave: "¿Cambiar el PIN te echa de aquí? Te lo cuento.",
    parentAccountAsk: "¿Alguna duda sobre tu cuenta?",
    parentHelp: "Si tu duda no está aquí, pregúntamela.",
  },

  assistant: {
    title: "Pregúntale a Monedín",

    leadChild: "Monedín conoce tus tareas, tus premios y tus monedas. Pregúntale lo que quieras.",
    leadParent:
      "Monedín conoce las tareas, los premios y las monedas de tu familia. Pregúntale lo que quieras.",

    you: "Tú",
    monedin: "Monedín",

    greetHave: "Tienes",
    greetAnd: "y",
    greetAskChild: "¿Te cuento algo?",
    greetAskParent: "¿Te cuento por dónde empezar?",

    inputLabel: "Tu pregunta",
    placeholder: "Escribe tu pregunta…",
    send: "Preguntar",
    thinking: "Monedín está pensando…",
    retry: "Volver a intentarlo",

    ideasTitle: "Explora con Monedín",
    ideaBalance: "¿Cómo consigo más monedas?",

    ideaPriceGlyph: "🎁",
    ideaPrice: "¿Qué precio le pongo a un premio?",
    ideaRetireGlyph: "📦",
    ideaRetire: "¿Retirar un premio o dejar de ofrecerlo?",
    ideaCreditedGlyph: "🪙",
    ideaCredited: "¿Cuánto le he acreditado a cada hijo?",

    ideaBalanceGlyph: "🪙",
    ideaTasksGlyph: "🧹",
    ideaRewardsGlyph: "🎁",
    ideaTasks: "¿Qué me falta por hacer?",
    ideaRewards: "¿Para qué premio me alcanza?",

    unavailable: "Monedín está descansando ahora mismo. Vuelve a preguntarle en un rato.",

    invalidQuestion: "Esa pregunta no se pudo enviar. Prueba a escribirla más corta.",

    signedOut: "Se cerró tu sesión. Vuelve a entrar para seguir preguntando.",
  },

  errors: {
    unreadableResponse: "La respuesta del servidor no se pudo interpretar.",

    unexpectedShape: "La respuesta del servidor no tiene la forma esperada.",

    network: "No se pudo contactar con el servidor.",
  },
} as const;

export const PIN_LABEL = `${messages.auth.pinLead} ${PIN_LENGTH} ${messages.auth.pinTail}`;

export const HELP_AGE_QUESTION =
  `${messages.help.ageQLead} ${CHILD_AGE_MIN} a ${CHILD_AGE_MAX} ${messages.help.ageQTail}`;

export const HELP_PIN_QUESTION =
  `${messages.help.pinQLead} ${PIN_LENGTH} ${messages.help.pinQTail}`;

export const MY_PIN_EXPLAINER =
  `${messages.children.myPinLead} ${PIN_LENGTH} ${messages.children.myPinTail}`;
