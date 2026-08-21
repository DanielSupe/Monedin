## 1. Esquema y constantes

- [ ] 1.1 Añadir a `@monedin/contracts` las constantes de autenticación: longitud del PIN, mínimo de contraseña, límites de intentos y duración de los bloqueos y de las sesiones
- [ ] 1.2 Añadir al esquema la tabla de sesiones: hash del identificador único, a quién pertenece (padre o perfil de niño), de qué sesión de padre nace, caducidad y marcas de tiempo
- [ ] 1.3 Añadir a `User` y a `ChildProfile` las columnas de intentos fallidos y de bloqueo
- [ ] 1.4 Generar la migración, extenderla con las restricciones que hagan falta, y comprobar que sigue aplicando desde una base vacía
- [ ] 1.5 Actualizar el test de coherencia de límites si la migración replica alguna constante nueva

## 2. Hash y verificación de credenciales

- [ ] 2.1 Implementar el hash de credenciales con `scrypt` asíncrono, en el formato con algoritmo, parámetros y sal incluidos (decisión 2 del design)
- [ ] 2.2 Implementar la verificación, con comparación en tiempo constante
- [ ] 2.3 Implementar la detección de parámetros antiguos, para poder subirlos sin invalidar credenciales existentes
- [ ] 2.4 Tests: una credencial correcta verifica, una incorrecta no; dos credenciales iguales producen hashes distintos; una cadena con parámetros antiguos sigue verificando y se marca para rehash
- [ ] 2.5 Test de que la verificación no depende del tiempo: comparar una credencial correcta y una incorrecta no revela cuál era por la duración
- [ ] 2.6 Test de que el hash es asíncrono y no bloquea el bucle de eventos

## 3. Sesiones

- [ ] 3.1 Implementar la generación del identificador de sesión con fuente criptográficamente segura, y su derivación para almacenar
- [ ] 3.2 Implementar el repositorio de sesiones: crear, buscar por hash, prolongar, revocar una y revocar todas las de una cuenta
- [ ] 3.3 Implementar el servicio de sesiones, con la regla de que una sesión de niño solo vale si su sesión de padre sigue valiendo
- [ ] 3.4 Implementar la emisión y el borrado de las dos cookies, con las banderas de seguridad que correspondan al entorno
- [ ] 3.5 Tests de almacenamiento: la tabla no contiene ningún identificador utilizable, y dos identificadores generados seguidos son distintos
- [ ] 3.6 Tests de caducidad: una sesión caducada no da acceso y su cookie se retira; el uso prolonga la caducidad
- [ ] 3.7 Tests de revocación: cerrar sesión revoca en el servidor y reutilizar la cookie ya no sirve; revocar todas las de una cuenta invalida las demás
- [ ] 3.8 Test de dependencia: revocar la sesión del padre invalida la del niño que nació de ella

## 4. Resolución del actor y protección de rutas

- [ ] 4.1 Implementar el middleware que resuelve la petición a un actor, o a ninguno, dejándolo disponible para el controlador
- [ ] 4.2 Implementar el guardián de sesión y los guardianes de rol, y montarlos de modo que toda ruta nazca protegida y las públicas se declaren una a una (decisión 5 del design)
- [ ] 4.3 Declarar `health` como ruta pública y comprobar que sigue respondiendo sin credenciales
- [ ] 4.4 Tests del actor: sesión de padre da actor de padre; sesión de niño da actor de niño con el identificador de su padre; sin sesión, 401 sin ejecutar lógica
- [ ] 4.5 Test de que una ruta nueva sin declarar nada responde 401 sin sesión
- [ ] 4.6 Tests de rol: un niño en ruta de padre da 403, y un padre en ruta de niño da 403
- [ ] 4.7 Test de que el rol correcto no autoriza sobre un recurso ajeno: la comprobación de la ruta no sustituye a la del servicio

## 5. Contrato de errores

- [ ] 5.1 Añadir el error de dominio de demasiados intentos y su código, y mapearlo a 429 en el traductor único
- [ ] 5.2 Añadir al catálogo los mensajes en español de acceso rechazado y de bloqueo, sin revelar cuál de los dos datos falló
- [ ] 5.3 Tests: el bloqueo responde 429 con el cuerpo estándar, y su código se distingue del de credencial incorrecta sin leer el mensaje

## 6. Acceso del padre

- [ ] 6.1 Definir en `@monedin/contracts` los esquemas de registro, acceso y cambio de contraseña, y el tipo de la respuesta de sesión
- [ ] 6.2 Implementar el módulo `auth` con la anatomía completa, y el registro de padre dejando la sesión iniciada
- [ ] 6.3 Implementar el acceso con correo y contraseña, respondiendo igual ante correo inexistente y ante contraseña equivocada
- [ ] 6.4 Implementar el cierre de sesión, revocando en el servidor y no solo borrando la cookie
- [ ] 6.5 Implementar el cambio de contraseña: exige la actual, revoca las demás sesiones y conserva la que lo pidió
- [ ] 6.6 Implementar el bloqueo por intentos fallidos del padre, con su reinicio al acertar
- [ ] 6.7 Tests de registro: datos válidos crean cuenta con sesión; correo repetido se rechaza; contraseña corta se rechaza señalando el campo
- [ ] 6.8 Tests de acceso: credenciales correctas dan sesión; contraseña mala y correo inexistente son indistinguibles, también en el tiempo que tardan
- [ ] 6.9 Tests de que la credencial no aparece en respuestas ni en logs, ni siquiera para su dueño
- [ ] 6.10 Tests de bloqueo: se alcanza el límite y se rechaza aun con la contraseña correcta; caduca; acertar antes del límite pone el contador a cero; fallar contra un correo inexistente no delata que no existe
- [ ] 6.11 Tests de cambio de contraseña: con la actual correcta funciona y las otras sesiones caen; con la actual incorrecta se rechaza y la anterior sigue valiendo

## 7. Acceso del niño

- [ ] 7.1 Implementar el listado de perfiles de niño disponibles para la sesión de padre, con solo el nombre y el avatar
- [ ] 7.2 Implementar la entrada a un perfil con PIN, creando la sesión de niño sobre la del padre
- [ ] 7.3 Implementar la salida del perfil, que devuelve la sesión del padre sin pedir la contraseña
- [ ] 7.4 Implementar el bloqueo del perfil por PIN fallido, por perfil y no por dispositivo
- [ ] 7.5 Implementar el establecimiento y restablecimiento del PIN por el padre, que además desbloquea el perfil
- [ ] 7.6 Tests de listado: solo salen los hijos activos del padre de la sesión; sin sesión de padre no hay listado; un hijo dado de baja ni aparece ni se puede alcanzar por identificador
- [ ] 7.7 Test de aislamiento entre familias: entrar a un perfil de otra familia se rechaza sin revelar si existe
- [ ] 7.8 Tests del PIN: el correcto entra; el incorrecto se rechaza y deja intacta la sesión del padre; el PIN no aparece en el almacén ni en las respuestas; dos hermanos con el mismo PIN tienen hashes distintos
- [ ] 7.9 Tests de bloqueo del perfil: se alcanza el límite y se rechaza aun con el PIN correcto; un hermano sigue pudiendo entrar; el padre desbloquea al momento; el bloqueo caduca solo
- [ ] 7.10 Tests de suspensión: volver al padre no pide contraseña; cambiar de un hijo a otro pide el PIN del segundo; cerrar la sesión del padre se lleva el acceso a los perfiles
- [ ] 7.11 Tests de frontera: una sesión de niño no puede ejecutar operaciones de padre, no ve datos de sus hermanos, y no puede recuperar la sesión del padre manipulando la petición
- [ ] 7.12 Tests de gestión del PIN: el padre lo cambia a un hijo suyo y el anterior deja de servir; sobre un hijo ajeno se rechaza; una sesión de niño no puede cambiar ningún PIN

## 8. Estado de sesión y front

- [ ] 8.1 Implementar `GET /auth/session`, que responde 200 con o sin sesión y nunca expone credenciales ni el identificador
- [ ] 8.2 Tests del estado: con padre, con niño (incluye saldo y que hay padre detrás) y sin nadie
- [ ] 8.3 Cablear en el front el cliente de sesión y el estado de autenticación, consultándolo al arrancar
- [ ] 8.4 Crear la guarda de rutas del front: sin sesión lleva al acceso, y las rutas de cada rol respetan quién está dentro
- [ ] 8.5 Crear las pantallas de registro y acceso del padre, mostrando el error por código y no por texto
- [ ] 8.6 Crear el selector de perfil y el teclado numérico del PIN, con el mensaje de bloqueo diferenciado del de PIN incorrecto
- [ ] 8.7 Crear la salida del perfil de niño y el cierre de sesión del padre
- [ ] 8.8 Tests del front: la guarda redirige sin sesión, y el cliente distingue credencial incorrecta de bloqueo por el código

## 9. Cierre

- [ ] 9.1 Actualizar la siembra para que genere credenciales verificables, y dejar documentadas las de ejemplo
- [ ] 9.2 Actualizar `.env.example` y el esquema de entorno con la duración de sesión y la política de cookies
- [ ] 9.3 Actualizar `CLAUDE.md`: cómo se protege una ruta, cómo se obtiene el actor, y que ningún módulo lee la tabla de sesiones
- [ ] 9.4 Actualizar el `README` con el flujo de acceso y las credenciales de la siembra
- [ ] 9.5 Verificación de extremo a extremo en el navegador: registrarse, entrar, pasar a un hijo con su PIN, volver sin reescribir la contraseña, y cerrar sesión
- [ ] 9.6 Verificación completa sin caché sobre un clon limpio, y `openspec validate --all` en verde
- [ ] 9.7 Commit final del change
