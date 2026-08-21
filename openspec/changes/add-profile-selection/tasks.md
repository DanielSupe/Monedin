## 1. Esquema y catálogo

- [ ] 1.1 Añadir a `User` las columnas del PIN de adulto: hash, intentos fallidos y bloqueo, **separadas** de las de la contraseña (decisión 3 del design)
- [ ] 1.2 Sustituir la restricción de sesión por la regla nueva: sin sesión padre detrás es una sesión de cuenta; con ella es un perfil activo, y el hijo puede ser nulo (decisión 1)
- [ ] 1.3 Generar y aplicar la migración, y comprobar que sigue aplicando desde una base vacía
- [ ] 1.4 Actualizar el test de coherencia de límites con las restricciones nuevas
- [ ] 1.5 Crear en `@monedin/contracts` el catálogo de avatares, como constante y como esquema, más las constantes de bloqueo del PIN de adulto
- [ ] 1.6 Tests del catálogo: una clave del catálogo se acepta, una que no está se rechaza, y no hay claves repetidas

## 2. PIN de adulto

- [ ] 2.1 Añadir el PIN al registro de padre, hasheado con lo que ya existe, y actualizar su esquema en `@monedin/contracts`
- [ ] 2.2 Implementar la verificación del PIN de adulto y su bloqueo por intentos, reutilizando el patrón del PIN del niño
- [ ] 2.3 Implementar el cambio de PIN indicando el actual
- [ ] 2.4 Implementar el restablecimiento del PIN indicando la contraseña, que además desbloquea
- [ ] 2.5 Tests de almacenamiento: el PIN no aparece en el almacén ni en ninguna respuesta; el del padre y el de un hijo con el mismo valor guardan hashes distintos
- [ ] 2.6 Tests de bloqueo: se alcanza el límite y se rechaza aun con el PIN correcto; caduca; acertar antes del límite pone el contador a cero
- [ ] 2.7 Test de independencia: bloquear el PIN de adulto no impide entrar con la contraseña, y no bloquea a los hijos
- [ ] 2.8 Tests de cambio y restablecimiento: con el actual correcto funciona; con el incorrecto no; con la contraseña se restablece y desbloquea; un niño no puede hacer ninguna de las dos

## 3. Sesión de cuenta y perfil activo

- [ ] 3.1 Renombrar la cookie de niño a cookie de perfil, y su constante en `@monedin/contracts`
- [ ] 3.2 Implementar la creación de un perfil activo para el padre: fila de sesión con perfil de hijo nulo colgando de la sesión de cuenta
- [ ] 3.3 Implementar la salida de perfil, que revoca solo el perfil activo y conserva la sesión de cuenta
- [ ] 3.4 Implementar el cambio directo de un perfil a otro, sin dejar dos activos
- [ ] 3.5 Tests de forma: una sesión de cuenta no puede tener perfil de hijo; un perfil activo siempre cuelga de una cuenta; el motor rechaza las combinaciones imposibles
- [ ] 3.6 Tests de ciclo de vida: salir deja la cuenta viva; cerrar la cuenta se lleva el perfil; el perfil caduca antes que la cuenta

## 4. Resolución del actor en dos niveles

- [ ] 4.1 Reescribir la resolución: la cookie de cuenta acredita el dispositivo y NO da actor; el actor sale del perfil activo (decisión 2 del design)
- [ ] 4.2 Añadir el guardián de «solo cuenta» para las rutas de la rejilla, dejando `requireSession` como está
- [ ] 4.3 Ampliar la respuesta de estado de sesión a tres situaciones: sin cuenta, cuenta sin perfil, y perfil activo
- [ ] 4.4 **Arreglar los tests de `add-authentication` que ahora fallan**, uno a uno, actualizando los ayudantes para que devuelvan cookies con perfil activo. No relajar ninguna aserción (decisión 6)
- [ ] 4.5 Test de la frontera: con sesión de cuenta y sin perfil, una operación de padre responde 401
- [ ] 4.6 Test de que no se puede rodear la rejilla llamando al endpoint directamente
- [ ] 4.7 Tests del actor: perfil de padre da actor de padre; perfil de niño da actor de niño con el identificador de su padre; sin perfil, ninguno
- [ ] 4.8 Test de que listar los perfiles sí funciona con cuenta y sin perfil elegido
- [ ] 4.9 Tests del estado de sesión en las tres situaciones, sin credenciales ni identificador en ninguna

## 5. Rejilla de perfiles

- [ ] 5.1 Crear el módulo `profiles` con la anatomía completa, y el listado que devuelve el perfil del padre y los hijos activos
- [ ] 5.2 Implementar la entrada a un perfil, que acepta tanto el del padre como el de un hijo y exige el PIN del que sea
- [ ] 5.3 Implementar la salida al listado
- [ ] 5.4 Tests del listado: salen el padre y los hijos activos; solo nombre y avatar; ni saldo ni edad; un hijo dado de baja no aparece ni se puede alcanzar
- [ ] 5.5 Test de aislamiento: no aparece ningún perfil de otra familia, y entrar a uno ajeno se rechaza sin revelar si existe
- [ ] 5.6 Tests de entrada: con el PIN correcto queda activo; con el incorrecto no y la cuenta sigue intacta; un perfil bloqueado se rechaza aun con el PIN bueno
- [ ] 5.7 Tests de cambio y salida: cambiar de perfil deja solo uno activo; salir devuelve a la rejilla sin pedir contraseña; cerrar la cuenta se lo lleva todo
- [ ] 5.8 Test de que un niño no puede crear perfiles ni listar como si fuera el padre

## 6. Front

- [ ] 6.1 Ampliar la guarda de rutas a tres estados: sin cuenta lleva al acceso, cuenta sin perfil lleva a la rejilla, perfil activo deja pasar
- [ ] 6.2 Crear la rejilla con los avatares del catálogo, el nombre de cada perfil y el botón de crear
- [ ] 6.3 Reutilizar el teclado de PIN para el perfil del padre, con su mensaje propio de bloqueo
- [ ] 6.4 Añadir el campo de PIN al registro y las pantallas de cambio y restablecimiento
- [ ] 6.5 Cablear el botón de crear perfil a su pantalla, que en este change solo anuncia que llega en el siguiente
- [ ] 6.6 Añadir la salida a la rejilla desde cualquier perfil
- [ ] 6.7 Tests del front: la guarda manda a la rejilla con cuenta y sin perfil; el error de PIN de adulto se distingue del de bloqueo por el código; el catálogo pinta todas sus claves

## 7. Cierre

- [ ] 7.1 Actualizar la siembra con el PIN de adulto y avatares del catálogo, y documentar las credenciales
- [ ] 7.2 Actualizar `CLAUDE.md`: la cookie no da actor, el actor sale del perfil activo, y cómo se declara una ruta de «solo cuenta»
- [ ] 7.3 Actualizar el `README` con el flujo nuevo y el PIN de adulto de la siembra
- [ ] 7.4 Verificación de extremo a extremo en el navegador: abrir y ver la rejilla, entrar como padre con PIN, salir, entrar como hijo, salir, y comprobar que sin perfil no se puede operar
- [ ] 7.5 Verificación completa sin caché sobre un clon limpio, y `openspec validate --all` en verde
- [ ] 7.6 Commit final del change
