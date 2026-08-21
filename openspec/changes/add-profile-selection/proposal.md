## Why

Hoy, quien tiene el dispositivo familiar **es el padre**. La sesión persiste treinta días y concede
poderes de padre por sí sola; el niño es el único que está detrás de un PIN. Funciona, pero deja una
puerta abierta que no es de seguridad sino de producto: un niño que llame al endpoint de aprobar una
tarea desde la sesión que ya está abierta se aprueba sus propias tareas. El ciclo esfuerzo → ingreso
que Monedín enseña se rompe justo ahí.

Se adopta el modelo de selección de perfil: al abrir la aplicación, lo primero es **elegir quién
eres**, con todos los perfiles de la familia en la misma rejilla y un botón para crear uno nuevo.

Eso obliga a que el PIN de adulto sea real y no un adorno de la interfaz. Y para que lo sea, la
cookie tiene que dejar de significar «soy el padre» y pasar a significar «este dispositivo pertenece
a esta cuenta». Quién eres se decide después, eligiendo perfil.

## What Changes

- **Rejilla de perfiles al abrir.** Todos los perfiles de la familia —el del padre y el de cada
  hijo— con su avatar, más un botón de crear perfil. Se ve cada vez que se abre la aplicación.
- **PIN de adulto.** El padre gana un PIN, además de su contraseña. La contraseña se teclea una vez,
  al vincular el dispositivo; el día a día se mueve con PIN, igual para todos.
- **BREAKING — la sesión de cuenta no concede poderes.** Una cookie válida acredita el dispositivo,
  no una identidad. Sin perfil elegido no hay actor, y toda ruta protegida responde 401.
- **BREAKING — volver del perfil de un hijo ya no devuelve al padre automáticamente.** Devuelve a la
  rejilla, y volver a ser el padre exige su PIN.
- **Avatares de un set fijo** que viene con la aplicación. La columna guarda una clave, no una URL.
- **Estado de sesión con tres respuestas** en vez de dos: sin cuenta, con cuenta pero sin perfil
  elegido, y con perfil activo.
- El botón de crear perfil existe y lleva a su pantalla; **el alta en sí llega en `add-children`**.

### Por qué el PIN de adulto y no la contraseña

Pedir la contraseña completa cada vez que se vuelve del perfil de un hijo, en una tablet, es lo que
hace que la gente acabe poniendo una contraseña corta. El PIN protege el cambio de perfil, que es
una operación de todos los días; la contraseña protege vincular un dispositivo nuevo, que es rara.
Son dos fronteras con frecuencias distintas y merecen credenciales distintas.

### No incluye

- **Crear, editar y dar de baja perfiles de hijo.** El botón existe y navega; lo que hay detrás es
  `add-children`. Este change se queda en la selección.
- **Subir un avatar propio.** El set es fijo y viene con la aplicación. Las imágenes propias
  necesitan S3 y llegan en `add-file-storage`.
- **Recuperar el PIN de adulto olvidado.** Se restablece con la contraseña, que ya existe; no hay
  flujo por correo, igual que no lo hay para la contraseña.
- **Diseño visual.** La rejilla es funcional: avatares del set, nombres y un botón. El sistema de
  componentes es otro change.
- **Bloqueo de perfil por dispositivo, ni lista de dispositivos vinculados.** El bloqueo por
  intentos sigue siendo por identidad, como está.
- **Ningún módulo de dominio.** No se tocan tareas, premios ni canjes.

## Capabilities

### New Capabilities

- `profile-selection`: la rejilla y lo que significa elegir perfil. Cubre qué perfiles se ofrecen y
  con qué datos, que la elección es obligatoria antes de operar, cómo se cambia de perfil y cómo se
  vuelve a la rejilla, y el catálogo de avatares.

### Modified Capabilities

- `session-management`: el requisito «Una petición se resuelve a un actor, o a ninguno» hoy convierte
  una sesión de padre válida en un actor de padre. Pasa a haber **dos niveles**: la sesión de cuenta
  acredita el dispositivo y no da actor; el actor sale del perfil activo. Cambia también el estado de
  sesión consultable, que gana el caso intermedio de cuenta sin perfil.
- `child-authentication`: el requisito «La sesión del padre se suspende, no se cierra» dice que salir
  del perfil de un niño devuelve la sesión del padre sin pedir nada. Pasa a devolver a la rejilla, y
  ser el padre exige su PIN. El resto del requisito —que la contraseña no se vuelve a pedir— sigue
  siendo cierto y es lo que hace tolerable el cambio.
- `parent-authentication`: el padre gana una credencial más. Entra un requisito para el PIN de
  adulto: cómo se establece la primera vez, cómo se cambia, cómo se restablece con la contraseña, y
  que se almacena y se bloquea igual que cualquier otra credencial.

## Impact

**Se crea**: el módulo `profiles` en `apps/api/src/modules/profiles/` con la anatomía completa, el
catálogo de avatares en `packages/contracts`, una migración con el PIN de adulto y el ajuste de las
restricciones de sesión, y la pantalla de rejilla en el front con su enrutado.

**Se modifica**: la resolución del actor en `apps/api/src/shared/http/session.ts`, el módulo `auth`
(la entrada a un perfil deja de ser solo cosa de niños), el esquema de sesión y el tipo de la
respuesta de estado en `packages/contracts`, y el front, que pasa a arrancar en la rejilla.

**Se rompe**: los tests de `add-authentication` que dan por hecho que una cookie de padre basta para
operar. Es la señal de que el cambio es real: si no fallara ninguno, la cookie seguiría concediendo
poderes.

**Compromisos que adquieren los changes siguientes**: ningún endpoint puede asumir que hay actor solo
porque hay cookie; el actor sigue saliendo del middleware y nada más; y toda pantalla nueva vive
detrás de un perfil elegido.
