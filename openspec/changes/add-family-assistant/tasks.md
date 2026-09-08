## 1. El contrato de errores gana el 503

- [x] 1.1 Añadir `SERVICE_UNAVAILABLE` a `ERROR_CODES` en `packages/contracts/src/schemas/error.ts`,
      con su comentario de una línea como los otros siete.
- [x] 1.2 Añadir la fila a `HTTP_STATUS_BY_ERROR_CODE` en `apps/api/src/shared/errors/http-status.ts`.
      **El typecheck falla hasta que se hace**: el objeto es `Record<ErrorCode, number>`. Comprobarlo
      compilando ANTES de escribirla, para ver el mecanismo funcionar.
- [x] 1.3 `ServiceUnavailableError` en `apps/api/src/shared/errors/domain-errors.ts` y su texto en
      `messages.errors` del catálogo de la API. En la cabecera de la clase, por qué NO es un 500:
      no hay incidencia nuestra que correlacionar.
- [x] 1.4 Test en `apps/api/tests/errors/`: un error de dominio `SERVICE_UNAVAILABLE` sale como 503
      con su código y **sin** `incidentId`. Comprobar si el `probeRouter()` de
      `error-contract.test.ts` enumera códigos y ampliarlo si lo hace.
- [x] 1.5 Actualizar la tabla de `CLAUDE.md` §3 con la fila nueva. Es contrato documentado, no un
      apunte.

## 2. `shared/ai/`, con el molde del almacén

- [x] 2.1 `apps/api/src/shared/ai/provider.ts`: interfaz `AiProvider`, tipos `AiTurn`,
      `AiCompletionRequest`, `AiCompletion`, clase `AiProviderError` con `reason` y `status` **y nada
      más**, y las constantes `AI_MODEL`, `AI_REQUEST_TIMEOUT_MS`, `AI_MAX_OUTPUT_TOKENS`,
      `AI_TEMPERATURE`. En la cabecera, qué NO sabe este archivo y por qué el modelo es constante
      —el mismo argumento que los TTL de `shared/storage/provider.ts`—.
- [x] 2.2 `apps/api/src/shared/ai/gemini-provider.ts`: la clase con opciones por constructor
      (`apiKey`, `model`, `timeoutMs`, `baseUrl`), un `POST` con `AbortSignal.timeout()`, la clave en
      la cabecera `x-goog-api-key` y **jamás** en la dirección, y el esquema Zod local que valida la
      respuesta. Comentar por qué ese Zod no vive en `@monedin/contracts`.
- [x] 2.3 La traducción de fallos en el mismo archivo: 429 a `rate_limited`, 5xx a `unavailable`,
      aborto a `timeout`, cuerpo que no valida a `invalid_response`, fallo de red a `unavailable`.
      Comentar que **no se pone `cause`** aunque sea tentador, y por qué.
- [x] 2.4 `client.ts` con `getAiProvider()` / `setAiProviderForTests()` y `index.ts` como barril,
      calcados de `shared/storage/`.
- [x] 2.5 `GEMINI_API_KEY` en `env.schema.ts`, en `SECRET_ENV_KEYS` y en `.env.example` con sección
      propia y un placeholder que no sirve para llamar a Google. Ver pasar el test
      `tests/config/env-template.test.ts`.
- [x] 2.6 Test del proveedor contra un servidor HTTP local: los cuatro motivos de fallo salen con su
      `reason`, y un cuerpo con otra forma da `invalid_response` y no un `undefined`.

## 3. Que ningún test pueda llamar a Google

- [x] 3.1 `apps/api/tests/support/ai.ts`: `espiaIA()` con `peticiones()`, `ultima()`, `responder()`,
      `fallar()` y `reiniciar()`, y el ayudante `textoEntregado(req)` que concatena instrucción,
      historial y pregunta en una sola cadena.
- [x] 3.2 Cablear `setAiProviderForTests(espiaIA())` en el `beforeAll` de
      `apps/api/tests/support/setup.ts` y `undefined` en el `afterAll`, junto a los de Prisma y el
      almacén. Comentar que el doble por defecto es lo que impide una llamada real por descuido.
- [x] 3.3 `apps/api/tests/shared/ai-secret-leak.test.ts`: proveedor con `baseUrl` local que responde
      500 y una clave reconocible; se espían `console.log` y `console.error` durante la petición
      completa y se afirma que la clave no aparece en nada emitido ni en el cuerpo.
- [x] 3.4 **Inyectar la violación**: mover la clave a la dirección y registrar el error con la
      dirección dentro. El test de 3.3 tiene que caer. Si no cae, no prueba nada. Revertir.

## 4. El contrato del asistente

- [x] 4.1 Cuatro constantes en `packages/contracts/src/constants/domain.ts`:
      `ASSISTANT_QUESTION_MAX_LENGTH`, `ASSISTANT_MAX_HISTORY_TURNS`, `ASSISTANT_TURN_MAX_LENGTH` y
      `ASSISTANT_ROLES`. En el comentario, la regla de reparto: aquí lo que el front necesita, en
      `shared/ai/provider.ts` lo que solo necesita el proveedor.
- [x] 4.2 `packages/contracts/src/schemas/assistant.ts` con `assistantTurnSchema`,
      `askAssistantSchema` (`.strict()`) y `assistantAnswerSchema`, con los mensajes de Zod en
      español. Añadir la línea al barril `index.ts`.
- [x] 4.3 Comentar en el esquema por qué el rol se llama `assistant` aquí y `model` en `shared/ai`:
      son dos vocabularios a propósito, y quien traduce es el servicio.

## 5. El módulo, capa a capa

- [x] 5.1 `assistant.errors.ts` con `AssistantUnavailableError extends ServiceUnavailableError`, y
      `assistant.routes.ts` con la única ruta. Comentar por qué no lleva `requireParent` ni
      `requireChild` —la rama por rol vive en el servicio, como en `PATCH /auth/tutorial`— y por qué
      la lista de rutas de solo cuenta no se toca.
- [x] 5.2 `assistant.repository.ts`: `findChildContext(childProfileId, limits)` con las consultas del
      niño dentro de una sola `$transaction`, `select` estrechos y `withTranslatedErrors()`. En la
      cabecera, por qué no se delega en los servicios ajenos (firman URLs de S3 y devuelven `Page<T>`).
- [x] 5.3 `findParentContext(parentId, limits)` con lo del padre, misma forma.
- [x] 5.4 `assistant.prompts.ts` con los dos guiones. El del niño: frases cortas, tono cálido, solo
      conoce lo suyo, **nunca promete** monedas, premios ni aprobaciones. El del padre: el ciclo del
      producto, la moneda es virtual, y no puede hacer nada por sí mismo. Los dos: no inventar nada
      que no esté en el contexto.
- [x] 5.5 `assistant.service.ts`: `ask(actor, input)`, la rama por rol, el renderizado del contexto a
      texto etiquetado, `ASSISTANT_CONTEXT_LIMITS` local, la llamada al proveedor y la traducción del
      `AiProviderError` a error de dominio con `logger.warn` de motivo y estado. `warn` y no `error`,
      con el porqué escrito.
- [x] 5.6 `assistant.controller.ts` y el router en `apiRouters` de `apps/api/src/app.ts`.
- [x] 5.7 Añadir a `CLAUDE.md` §1 la excepción declarada: los guiones de sistema viven en
      `assistant.prompts.ts` y no en el catálogo, con las dos razones. Sin esto, el siguiente que lea
      la regla los mueve de buena fe.

## 6. Tests de la API

- [x] 6.1 Camino feliz en `apps/api/tests/assistant/assistant-ask.test.ts`: padre y niño reciben el
      texto exacto que devolvió el proveedor, y **las dos instrucciones de sistema son distintas**
      —caza la rama por rol olvidada—.
- [x] 6.2 Autorización: sin cookie, 401; con cookie de cuenta y sin perfil elegido, 401. El segundo
      es el que fija que la ruta no se coló como de solo cuenta. Comentar en el archivo que **no hay
      403 posible**, porque no hay identificador en la petición.
- [x] 6.3 Validación: pregunta vacía, pregunta larga, hilo con demasiados turnos, rol inválido y
      campo desconocido, los cinco 422 con el campo señalado.
- [x] 6.4 Fallos del proveedor: `it.each` sobre los cuatro motivos, todos 503 con
      `SERVICE_UNAVAILABLE` y sin `incidentId`; y que el cuerpo no contiene `"at "`, `".ts:"`,
      `"Error:"` ni `"stack"`.
- [x] 6.5 El hilo llega al modelo: se mandan dos turnos previos y `ultima().history` tiene
      **exactamente dos**, con sus textos y en orden.
- [x] 6.6 **La fuga del hermano.** `familiaOperando(app, ["Mateo", "Wilfredina"])`, con tareas,
      premios y canjes de la hermana sembrados con importes de cuatro dígitos improbables. Aserción
      **doble** sobre `textoEntregado(ultima())`: lo de la hermana **no** está **y** lo propio **sí**.
      Sin la segunda mitad, un renderizador que devolviera cadena vacía pasaría en verde.
- [x] 6.7 **Inyectar la violación** de 6.6: cambiar el filtro de `findChildContext` de
      `childProfileId` a `parentId` —el error plausible de copiar el módulo del padre— y ver caer las
      **dos** aserciones. Revertir.
- [x] 6.8 Espejo del padre: su contexto lleva a todos sus hijos y **no** lleva nada de una segunda
      familia sembrada con otro correo.
- [x] 6.9 Comentar en el archivo que **no aplica el doble tap** —no mueve monedas ni cambia de
      estado— para que la ausencia no se lea como olvido.

## 7. El front

- [x] 7.1 `apps/web/src/api/assistant.ts` con `askAssistant(input)` sobre `apiFetch`. Sin query key,
      y con el comentario de por qué: no hay nada que cachear.
- [x] 7.2 `apps/web/src/features/assistant/use-assistant.ts` con `useAskAssistant()` y
      `describeAssistantError(error)`, que mira `error.code` y nunca el texto. Comentar que es **la
      primera mutación del proyecto que no invalida ninguna clave**, para que nadie copie un
      `invalidateQueries` que aquí sería falso.
- [x] 7.3 Una rama en `apps/web/src/lib/alert-tone.ts`: `SERVICE_UNAVAILABLE` es advertencia, no
      peligro, por el mismo argumento que el 409.
- [x] 7.4 Los textos en `messages.assistant`, **sin una sola cifra dentro de ninguna cadena**. El
      máximo del campo se compone en el punto de uso desde `ASSISTANT_QUESTION_MAX_LENGTH`.
- [x] 7.5 `apps/web/src/features/assistant/AssistantChat.tsx`: el hilo en `useState` con transición
      funcional —**nunca** leer, componer y escribir—, el campo dentro de un `<form>`, `maxLength`
      desde la constante, la lista de turnos en `<ul>` con `aria-live="polite"`, y el turno del
      modelo etiquetado «Monedín» y no solo distinguido por color.
- [x] 7.6 El camino de fallo: **se conserva la pregunta** en el hilo, marcada, con «Reintentar».
      Nunca borrarla.
- [x] 7.7 `apps/web/src/routes/assistant.tsx` con `requireActor`. El archivo monta el destino y no lo
      dibuja.
- [x] 7.8 `apps/web/tests/assistant-client.test.ts`: el cliente llama a la ruta correcta con el cuerpo
      esperado y valida la respuesta.
- [x] 7.9 `apps/web/tests/app/assistant.test.tsx` con **espía de `fetch` propio**, copiando el de
      `tests/app/tutorial.test.tsx` —`servirSesion` devuelve una página vacía a todo lo demás y el
      esquema de la respuesta la rechazaría—. Casos: pregunta y respuesta aparecen; **la segunda
      petición lleva exactamente dos turnos previos con sus textos**; el 503 pinta advertencia y
      conserva la pregunta; navegar y volver deja el hilo vacío; los dos roles llegan sin redirección.
      Esperar a la **respuesta**, no al título.
- [x] 7.10 Añadir a `apps/web/tests/app/destinations.test.tsx` el caso de una ruta compartida por los
      dos roles: hoy sus dos listas son excluyentes y `/assistant` no cabe en ninguna.

## 8. Comprobar y cerrar

- [x] 8.1 `pnpm --filter @monedin/contracts build`, luego typecheck y lint de las dos apps.
- [x] 8.2 Batería de la API completa, **desde `apps/api`**. Tarda unos 14 minutos.
- [x] 8.3 Batería del front con `pnpm vitest run --no-file-parallelism`.
- [x] 8.4 Con una clave real: abrir `/assistant` escribiendo la dirección, preguntar como padre y
      como niño, y comprobar que el tono y los datos son los de cada uno.
- [x] 8.5 Con una clave inválida: ver el aviso en tono de advertencia con «Reintentar», y que la
      pregunta escrita sigue ahí.
- [x] 8.6 Comprobar a mano que una conversación completa no deja ninguna fila nueva en la base.
- [x] 8.7 Actualizar `openspec/config.yaml` con lo que este change deja construido, en la sección de
      la superficie de la API.
