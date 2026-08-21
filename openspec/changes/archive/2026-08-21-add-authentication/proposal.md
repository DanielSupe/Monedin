## Why

El esquema tiene columnas para una contraseña y para un PIN, y nada las escribe ni las lee. El tipo
`Actor` existe y ningún controlador lo construye. La API sirve exactamente una ruta pública.

Mientras no haya sesión no hay actor real, y sin actor los servicios no pueden autorizar nada: el
primer módulo de dominio que se escriba tendría que inventarse de dónde sale quién llama, que es
justo lo que la anatomía de módulo lleva dos changes evitando.

Hay además una razón que no es de arquitectura. Aquí se guardan las credenciales de un adulto y el
PIN de un niño de seis años, en un dispositivo que la familia comparte. La forma de equivocarse en
esto no es que no funcione: es que funcione perfectamente y esté mal hecho, y no se note.

## What Changes

- **Registro y acceso del padre** con correo y contraseña, y cierre de sesión.
- **Acceso del niño desde la sesión del padre**: el padre entra una vez en el dispositivo familiar y
  su sesión persiste; el niño elige su perfil y teclea su PIN de 4 dígitos. La sesión del padre queda
  **suspendida, no cerrada**, y salir del perfil del niño vuelve a ella.
- **Sesiones propias**: cookie `httpOnly` con un identificador opaco, y una tabla de sesiones donde
  se guarda **solo el hash** del identificador. Con caducidad, renovación y revocación.
- **Bloqueo por intentos fallidos** en los dos accesos. Sin él, un PIN de 4 dígitos son 10.000
  combinaciones y no protege de nada.
- **Middleware de sesión** que resuelve la petición a un `Actor` y lo deja disponible para el
  controlador, más la protección de rutas por sesión y por rol.
- **Hash de credenciales** con `scrypt` de la biblioteca estándar de Node, sin dependencias nativas.
- **Endpoints de sesión** bajo `/api/v1/auth`, y las pantallas mínimas del front para usarlos.
- **BREAKING** para el desarrollo: `GET /api/v1/health` deja de ser la única ruta pública. Todo lo
  que se añada a partir de aquí requiere sesión salvo que se declare explícitamente lo contrario.

### Decisiones que cierran preguntas abiertas

- **El PIN tiene 4 dígitos.** Es lo que un niño de 6 años recuerda y teclea sin frustrarse. El riesgo
  real no es la fuerza bruta sino el hermano que mira por encima del hombro, y contra eso protege el
  bloqueo, no un dígito más.
- **Las credenciales se hashean con `scrypt`**, que viene en Node. Argon2id sería marginalmente
  mejor, pero exige un binario nativo, y este proyecto ya perdió una tarde con un antivirus
  impidiendo escribir exactamente eso.
- **Sesiones propias, sin librería de autenticación.** El acceso por perfil y PIN no es un flujo que
  ninguna librería contemple; habría que construirlo por fuera igualmente, y a cambio impondría su
  forma de tablas. La implementación anterior usaba una y acabó inventando correos sintéticos
  `usuario@child.monedin` para contentarla.

### No incluye

- **Recuperación de contraseña.** Necesita enviar correo, que es infraestructura nueva y su propio
  change. Mientras tanto, un padre que pierde su contraseña no tiene salida por la interfaz: es una
  limitación conocida y aceptada para este change.
- **Recuperación del PIN del niño.** Sí la hay, pero por el camino natural: el padre lo restablece
  desde su sesión.
- **Verificación de correo, OAuth y segundo factor.** Nada de eso aporta a una familia que comparte
  una tablet, y cada uno traería dependencias y pantallas.
- **Ningún módulo de dominio.** Este change no crea hijos, tareas ni premios. Crea la sesión con la
  que esos módulos sabrán quién llama. Los hijos que existan serán los de la siembra.
- **Gestión de dispositivos.** No hay lista de sesiones activas ni revocación remota desde la
  interfaz. La revocación existe en la capa de datos y se usa al cambiar la contraseña.
- **Diseño visual.** Las pantallas de acceso son funcionales: formulario, selector de perfil y
  teclado numérico. El sistema de componentes es otro change.

## Capabilities

### New Capabilities

- `parent-authentication`: cómo un padre crea su cuenta y accede. Cubre el registro, el acceso con
  correo y contraseña, el cierre de sesión, el cambio de contraseña, y qué se le dice y qué no cuando
  las credenciales no son correctas.
- `child-authentication`: cómo un niño entra a lo suyo desde el dispositivo familiar. Cubre el paso
  a perfil de niño y la vuelta, la comprobación del PIN, el bloqueo por intentos fallidos, y que un
  niño no pueda alcanzar el perfil de otra familia ni asumir el papel de su padre.
- `session-management`: qué es una sesión, cómo viaja, cuánto dura y cómo se revoca. Cubre el
  almacenamiento sin guardar el identificador en claro, la caducidad, la renovación, la revocación al
  cambiar credenciales, y cómo una petición se convierte en el actor que reciben los servicios.

### Modified Capabilities

- `api-error-contract`: la correspondencia entre error de dominio y estado HTTP se define una sola
  vez y hoy cubre cinco casos. El bloqueo por intentos fallidos introduce uno nuevo —demasiados
  intentos, 429— que no encaja en ninguno de los existentes: no es un conflicto de estado ni una
  entrada inválida, y responder 401 le diría al atacante que siga probando.

## Impact

**Se crea**: el módulo `auth` en `apps/api/src/modules/auth/` con la anatomía completa, el módulo de
contraseñas y PIN en `shared/crypto/`, el middleware de sesión en `shared/http/`, una migración con
la tabla de sesiones y los campos de bloqueo, y las pantallas de acceso en el front con su guarda de
rutas.

**Se modifica**: el catálogo de errores y su mapeo a HTTP (un código nuevo),
`packages/contracts` (esquemas de las peticiones de acceso y el tipo de la sesión), `app.ts` (monta
el módulo y el middleware), `.env.example` y el esquema de entorno (duración de sesión y política de
cookies), y `CLAUDE.md` (cómo se protege una ruta y cómo se obtiene el actor).

**Dependencias nuevas**: `cookie-parser` y sus tipos. Nada más: el hash sale de `node:crypto` y las
sesiones son nuestras.

**Compromisos que adquieren los changes siguientes**: toda ruta nueva nace protegida salvo declaración
explícita; el actor se obtiene siempre del middleware y nunca se reconstruye a mano; y ningún módulo
lee la tabla de sesiones, que es asunto exclusivo de `auth`.
