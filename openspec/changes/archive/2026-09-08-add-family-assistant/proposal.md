## Why

Monedín tiene mascota, pero solo habla una vez: en el recorrido de bienvenida, y nunca más. Un padre
que no entiende por qué aprobar un canje le da 409, o un niño que no sabe por qué tiene 120 monedas
y no 140, no tienen a quién preguntar dentro del producto — y la respuesta a las dos preguntas está
en datos que la aplicación ya tiene delante.

Lo que falta no es documentación: es alguien que mire **los datos de esa familia** y conteste con
ellos. Una ayuda genérica diría «las tareas se aprueban desde la bandeja»; lo que hace falta es «te
faltan 20 monedas para la bici, y tienes una tarea esperando a que tu mamá la revise».

## What Changes

- **Un asistente conversacional**, `POST /assistant/ask`, que responde una pregunta usando el
  contexto real de quien la hace: sus tareas, sus premios, sus canjes y su saldo.
- **Dos guiones distintos**, uno por rol, con la misma frontera de datos que ya rige el resto del
  producto: un padre ve a todos sus hijos; un niño **solo se ve a sí mismo**, nunca a sus hermanos.
- **El primer servicio externo del proyecto.** Hasta hoy no hay ni una llamada HTTP saliente en
  producción fuera del SDK de S3. Entra Google Gemini detrás de una interfaz `AiProvider`, con el
  mismo molde que `StorageProvider`: la implementación recibe todo por constructor y un singleton
  perezoso es el único que lee la configuración.
- **Una variable de entorno secreta nueva**, `GEMINI_API_KEY`, con los tres pasos que exige el
  proyecto (esquema, plantilla y lista de secretos).
- **Un código de error nuevo**, `SERVICE_UNAVAILABLE` → 503. Es el primer fallo del sistema que no
  es culpa nuestra ni del usuario, y hasta ahora no había forma de decirlo: un 500 emite un
  identificador de incidente y le dice al front «revisa tu conexión», que es mentira cuando la red
  iba bien.
- **Una pantalla de chat**, `/assistant`, para los dos roles, sin duplicar: la doble escala del
  sistema de diseño existe exactamente para esto.
- El hilo de la conversación **vive en la pantalla y muere con ella**. No se guarda nada: ni tabla,
  ni migración, ni una línea de texto de un menor en la base de datos.

## Capabilities

### New Capabilities
- `family-assistant`: qué puede preguntar cada rol, qué datos de la familia entran en el contexto y
  cuáles NO, qué pasa cuando el proveedor externo falla, y qué garantías hay —y cuáles no— frente a
  quien intente sacarle algo que no le corresponde.

### Modified Capabilities
- `api-error-contract`: la tabla de traducción de errores de dominio a estados HTTP gana una fila.
  Un fallo del proveedor externo es 503 con código `SERVICE_UNAVAILABLE`, y NO un 500 con
  identificador de incidente: el remedio del usuario es esperar, no reportar nada.

## Impact

**API**
- Módulo nuevo `apps/api/src/modules/assistant/` con las cinco capas de siempre más
  `assistant.prompts.ts`.
- `apps/api/src/shared/ai/` nuevo, calcado de `shared/storage/`.
- `apps/api/src/shared/errors/`: clase nueva y una fila en `HTTP_STATUS_BY_ERROR_CODE` — que el
  compilador exige, porque es un `Record<ErrorCode, number>`.
- `apps/api/src/config/env.schema.ts`, `SECRET_ENV_KEYS` y `.env.example`.
- `apps/api/src/app.ts`: un router más en `apiRouters`.
- `apps/api/tests/support/setup.ts` cablea el doble del proveedor, de modo que **ningún test pueda
  llamar a Google por descuido**.

**Contratos**
- `packages/contracts/src/schemas/assistant.ts` y cuatro constantes en `constants/domain.ts`.
- `ERROR_CODES` gana `SERVICE_UNAVAILABLE`.

**Front**
- Ruta `/assistant`, cliente, hook y pantalla. Cero piezas nuevas en `ui/`.
- `apps/web/src/lib/alert-tone.ts` gana una rama: un 503 es advertencia, no peligro.

**Documentación**
- `CLAUDE.md` §3: la tabla de errores.
- `CLAUDE.md` §1: la excepción declarada de que los guiones de sistema no viven en el catálogo de
  mensajes, con su porqué. Una desviación que solo viva en un design está muerta al tercer mes.

**Dependencias**: ninguna nueva. Se usa el `fetch` global de Node 22, no un SDK.

**Migraciones**: ninguna.

## No incluye

- **Los accesos al chat.** El widget flotante de Monedín y el icono de ayuda de la cabecera son el
  change siguiente, `add-assistant-access`. Mientras tanto `/assistant` se alcanza **escribiendo la
  dirección**, y eso se verifica a mano. Se parte así a propósito: el chat se puede probar entero
  por su cuenta, y los accesos no tienen sentido hasta que haya algo a lo que acceder.
- **Las preguntas frecuentes** (`/help`), que van también en el change siguiente.
- **Streaming.** La respuesta llega completa, en un JSON normal. Un endpoint que no devuelve un
  único JSON necesita camino aparte para el contrato de errores, para la validación con Zod y para
  los tests, y eso es un change propio si algún día la espera resulta intolerable.
- **Persistencia de la conversación**, y con ella la posibilidad de que un padre lea lo que preguntó
  su hijo. Es una función legítima de supervisión y pide su propio change: tabla, migración,
  endpoint y una decisión sobre cuánto tiempo se guarda texto libre de un menor.
- **Acciones desde el chat.** El asistente no crea tareas, no aprueba canjes y no mueve monedas. No
  hay herramientas ni function calling, y esa ausencia es la garantía de que una inyección de prompt
  lograda no puede hacer nada: no existe camino de código desde la respuesta a una mutación.
- **Límite propio de preguntas.** No hay contador por perfil ni por familia. Si el proveedor agota
  su cuota, se propaga como 503 con un aviso amable. Ponerlo antes de tener el problema pediría
  estado que hoy no hace falta.
- **Filtro de salida o moderación** de lo que responde el modelo. No lo hay, y decirlo es más
  honesto que un `RegExp` que aparente prevenir algo.
- **Anonimizar los datos que salen hacia Google.** Viajan los nombres de pila, las edades y los
  saldos que ya se ven en pantalla. Es una decisión tomada a conciencia, no un descuido.
