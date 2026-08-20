## 1. Prisma instalado y cableado

- [ ] 1.1 Instalar `prisma`, `@prisma/client`, `@prisma/adapter-pg` y `pg` en `apps/api`, fijando la versión mayor
- [ ] 1.2 Crear `prisma.config.ts` en la raíz de la API con la URL de conexión, y declarar su excepción en `apps/api/eslint.config.js` con el motivo por escrito. Verificar que el lint sigue fallando en cualquier otro archivo que lea el entorno
- [ ] 1.3 Crear `schema.prisma` con el bloque `datasource` sin `url` y el generador `prisma-client`, incluyendo `output`, `moduleFormat = "esm"` e `importFileExtension = "js"` (decisión 6 del design)
- [ ] 1.4 Añadir el directorio del cliente generado al `.gitignore` y al `include` del `tsconfig` de la API
- [ ] 1.5 Crear la tarea `db:generate` en `turbo.json` y hacer que `build`, `typecheck` y `test` dependan de ella. Verificar que `pnpm typecheck` funciona partiendo de un clon sin el cliente generado
- [ ] 1.6 Comprobar con un modelo de prueba que `prisma generate` produce un cliente importable, y borrar el modelo antes de seguir

## 2. Esquema del dominio

- [ ] 2.1 Definir los enums `TaskStatus` (sin `REJECTED`), `RedemptionStatus` y el motivo de movimiento de monedas
- [ ] 2.2 Definir `User` (solo padres) con correo único, y `ChildProfile` con nombre, PIN, saldo, edad, avatar, baja lógica y su padre obligatorio
- [ ] 2.3 Definir `Task` con su estado, su valor en monedas, su hijo y su padre
- [ ] 2.4 Definir `Reward`, `RewardAssignment` con clave compuesta y precio por hijo, y `RewardRedemption` con el precio congelado al solicitar
- [ ] 2.5 Definir `CoinTransaction` sin marca de actualización, con cantidad, saldo resultante, motivo y referencias opcionales a la tarea o el canje que lo originó
- [ ] 2.6 Añadir los índices que se derivan de los accesos descritos en el documento de producto, y las acciones de borrado de cada relación, incluida la restrictiva que impide borrar un hijo con historial
- [ ] 2.7 Revisar el esquema completo contra `family-data-model`: que cada requisito tenga su reflejo en una columna, una relación o una restricción

## 3. Migración inicial y restricciones del motor

- [ ] 3.1 Generar la migración inicial y comprobar que aplica sobre una base de datos vacía
- [ ] 3.2 Editar la migración para añadir las restricciones de rango: saldo no negativo, monedas de tarea, precio de asignación y de canje, y edad del hijo
- [ ] 3.3 Editar la migración para añadir el disparador que rechaza modificar y borrar filas del historial de monedas
- [ ] 3.4 Tests de restricciones: saldo negativo rechazado, tarea de cero monedas rechazada, precio por encima del máximo rechazado, edad fuera de rango rechazada
- [ ] 3.5 Tests de inmutabilidad del historial: modificar una fila falla, borrarla falla, y borrar un hijo con historial falla
- [ ] 3.6 Test de coherencia de límites: lee las restricciones vivas de la base de datos y las compara con las constantes de `@monedin/contracts`, fallando con el nombre de la que se haya descuadrado (decisión 4 del design)
- [ ] 3.7 Verificar la reproducibilidad: sobre una base vacía, aplicar las migraciones deja el esquema sin diferencias respecto al declarado

## 4. Capa de acceso a datos

- [ ] 4.1 Crear el módulo que construye el cliente con el adaptador, tomando la conexión de la configuración ya validada
- [ ] 4.2 Implementar el cierre ordenado de la conexión al recibir la señal de terminación, y su test
- [ ] 4.3 Implementar la traducción de errores del motor a errores de dominio: unicidad a conflicto, restricción de rango a entrada inválida, referencia inexistente a no encontrado
- [ ] 4.4 Tests de traducción de errores: un caso por cada correspondencia, más uno que verifica que la respuesta no contiene nombres de tablas, columnas ni restricciones
- [ ] 4.5 Añadir la regla de lint que restringe la importación del cliente a los archivos de repositorio
- [ ] 4.6 Verificar la regla: importar el cliente desde un servicio y comprobar que el lint falla señalando archivo y línea; revertirlo después

## 5. Contratos compartidos y actor

- [ ] 5.1 Sustituir en `@monedin/contracts` las constantes de nombre de usuario por la del PIN, y añadir las que la migración replica
- [ ] 5.2 Convertir `Actor` en unión discriminada, con `parentId` en la rama del niño (decisión 2 del design)
- [ ] 5.3 Ajustar el andamio existente que deje de compilar por los dos cambios anteriores
- [ ] 5.4 Test de tipos del actor: comprobar que no se puede construir un actor de niño sin su perfil

## 6. Infraestructura de tests de datos

- [ ] 6.1 Configurar una base de datos de tests separada de la de desarrollo, creada y migrada al arrancar la batería
- [ ] 6.2 Implementar el aislamiento por transacción que se deshace al terminar cada test
- [ ] 6.3 Verificar el aislamiento: dos tests que escriben sobre las mismas entidades pasan en cualquier orden y no se ven entre sí
- [ ] 6.4 Verificar que ejecutar la batería completa deja intactos los datos de la base de datos de desarrollo
- [ ] 6.5 Crear la siembra de datos de ejemplo para desarrollo, con la comprobación explícita de que no puede ejecutarse fuera de desarrollo

## 7. Verificación del libro de monedas

- [ ] 7.1 Escribir la operación de referencia que mueve saldo: modificación incremental más su fila de historial, ambas en la misma transacción. Es la plantilla que copiarán los módulos de dominio
- [ ] 7.2 Tests de atomicidad: si falla la escritura del historial, el saldo queda como estaba
- [ ] 7.3 Test de concurrencia: dos acreditaciones simultáneas dejan el saldo correcto y dos filas de historial
- [ ] 7.4 Test de concurrencia: una acreditación y un descuento simultáneos cuadran y el saldo nunca baja de cero
- [ ] 7.5 Test de auditoría: la suma de los movimientos coincide con el saldo actual y con el saldo resultante del último movimiento
- [ ] 7.6 Test de baja lógica: un hijo dado de baja desaparece de los listados y conserva su historial íntegro

## 8. Cierre

- [ ] 8.1 Comprobar que el artefacto compilado arranca sobre `node` a secas, sin `ERR_MODULE_NOT_FOUND`, que es el fallo que solo aparece en producción (decisión 6 del design)
- [ ] 8.2 Actualizar `CLAUDE.md`: el niño no es un `User`, la nueva forma del actor, la regla de que solo el repositorio importa el cliente, y la advertencia de revisar las restricciones a mano en cada migración que recree una tabla
- [ ] 8.3 Actualizar el `README` con los comandos de base de datos y con el aviso de que un clon recién hecho necesita generar el cliente antes de que el editor deje de marcar errores
- [ ] 8.4 Actualizar `.env.example` si el adaptador o la base de datos de tests introducen alguna variable
- [ ] 8.5 Verificación completa sin caché sobre un clon limpio, y `openspec validate --all` en verde
- [ ] 8.6 Commit final del change
