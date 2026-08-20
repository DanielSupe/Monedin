## 1. Preparación del repositorio

- [x] 1.1 Ejecutar `git init` y crear el `.gitignore` raíz (`node_modules`, `.turbo`, `dist`, `.env`, artefactos de build). Commit inicial con lo que ya existe, antes de instalar nada
- [x] 1.2 Resolver la interferencia de OneDrive: excluir `node_modules`, `.turbo` y `dist` de la sincronización, o mover el repositorio fuera de la carpeta sincronizada. Dejar constancia de la decisión tomada — *se movió el repositorio a `C:\Users\super\dev\monedin`; registrado en `design.md`, Risks*
- [x] 1.3 Fijar las versiones de herramientas: Node 22 LTS en `engines` más archivo de versión, y pnpm en el campo `packageManager` del `package.json` raíz

## 2. Raíz del monorepo

- [x] 2.1 Crear `package.json` raíz y `pnpm-workspace.yaml` declarando `apps/*` y `packages/*`
- [x] 2.2 Crear `turbo.json` con las tareas `dev`, `build`, `lint`, `test` y `typecheck`, declarando entradas y salidas de cada una para que la caché no enmascare fallos
- [ ] 2.3 Verificar que existe un comando de verificación sin caché y que `typecheck` falla de verdad cuando se introduce un error de tipos a propósito — **parcial**: el comando existe (`pnpm verify`, con `--force`) y se comprobó que `typecheck` falla señalando archivo y línea ante un error de tipos introducido a propósito; queda pendiente ejecutarlo *a través de Turborepo*, que no arranca en esta máquina (ver nota al final)
- [x] 2.4 Crear el `.env.example` versionado con todas las variables previstas y valores de ejemplo no sensibles

## 3. Infraestructura local

- [x] 3.1 Escribir `docker-compose.yml` con PostgreSQL 16 (volumen persistente, credenciales desde el entorno) y Adminer, con un comentario explícito de que Adminer es exclusivo de desarrollo y nunca se expone en producción
- [x] 3.2 Verificar que `docker compose up` levanta ambos servicios y que Adminer conecta a la base de datos desde el navegador — *PostgreSQL 16.14 healthy; login real de Adminer contra la base verificado por HTTP*
- [x] 3.3 Spike acotado: comprobar si la combinación Prisma + ESM funciona con las versiones fijadas y registrar la conclusión en `design.md`. Esta decisión debe quedar cerrada antes de `add-data-model` — *cerrada: decisión 11 del design*

## 4. `packages/config` — configuración compartida de herramientas

- [x] 4.1 Crear el paquete con el `tsconfig` base en modo estricto, del que heredan ambas apps y `packages/contracts`
- [x] 4.2 Añadir la configuración compartida de ESLint y Prettier
- [x] 4.3 Añadir la regla de lint que prohíbe leer variables de entorno fuera del módulo de configuración de la API
- [x] 4.4 Verificar la regla: introducir una lectura directa del entorno en un archivo cualquiera y comprobar que el lint falla señalando archivo y línea; revertirla después — *verificado, incluida la forma `const { env } = process`*

## 5. `packages/contracts` — contrato compartido

- [x] 5.1 Crear el paquete con su build y su exportación de tipos, consumible desde la API y desde el front
- [x] 5.2 Crear el archivo de constantes de dominio, con los rangos y límites que ya define el documento de producto, como única fuente para ambas apps
- [x] 5.3 Definir el esquema y el tipo de la respuesta de `health`
- [x] 5.4 Definir el esquema del cuerpo de error estándar (código, mensaje y detalle opcional) que compartirán API y front

## 6. Módulo de configuración de la API

- [x] 6.1 Definir el esquema del entorno, marcando qué variables son secretas
- [x] 6.2 Implementar la carga con validación al arrancar: termina el proceso con código distinto de cero, reporta **todos** los problemas de una vez y expone un objeto tipado congelado
- [x] 6.3 Implementar el enmascarado de secretos en los mensajes de error de validación
- [x] 6.4 Tests: variable requerida ausente, variable con tipo inválido, tres errores reportados juntos, arranque correcto con configuración válida, y valor secreto que no aparece en la salida
- [x] 6.5 Añadir la verificación de que el esquema del entorno y el `.env.example` están sincronizados, y su test — *comprueba los dos sentidos y los duplicados*

## 7. Contrato de errores

- [x] 7.1 Definir las clases de error de dominio (no encontrado, no permitido, sin sesión, conflicto, entrada inválida), sin ninguna referencia a HTTP
- [x] 7.2 Crear el catálogo de mensajes en español como único lugar de textos visibles al usuario
- [x] 7.3 Implementar el traductor único de error de dominio a estado HTTP y cuerpo estándar
- [x] 7.4 Implementar el tratamiento de errores de validación: 422 con detalle por campo, reportando todos los campos inválidos y sin ejecutar lógica de negocio
- [x] 7.5 Implementar el manejador de ruta desconocida: 404 con el mismo cuerpo estándar, no el formato por defecto del framework
- [x] 7.6 Implementar el tratamiento de errores inesperados: 500 con mensaje genérico e identificador de incidente en la respuesta, y registro del error completo en el log con ese mismo identificador
- [x] 7.7 Tests: un caso por cada mapeo de estado, un caso de validación con dos campos inválidos, y un caso que verifica que la respuesta 500 no contiene trazas de pila ni detalles de infraestructura

## 8. Servidor y módulo `health`

- [x] 8.1 Montar el servidor Express sirviendo todas las rutas bajo el prefijo `/api/v1`, con el traductor de errores al final de la cadena
- [x] 8.2 Implementar el módulo `health` con la anatomía completa de módulo, aunque su lógica sea mínima: es la plantilla que copiarán los módulos de dominio
- [x] 8.3 Tests de `health`: responde 200 sin credenciales, y llamadas repetidas devuelven lo mismo sin efectos secundarios
- [x] 8.4 Test de sonda de vida: con el contenedor de base de datos detenido, `GET /api/v1/health` sigue respondiendo 200 — *verificado con `docker compose stop postgres`: 200 en 7 ms, y 20 llamadas seguidas devuelven un único cuerpo distinto*
- [x] 8.5 Test de prefijo: `GET /health` sin prefijo responde 404 con el cuerpo de error estándar

## 9. `apps/web` — andamio del front

- [x] 9.1 Crear la aplicación con Vite, React y TypeScript, heredando el `tsconfig` compartido
- [x] 9.2 Cablear TanStack Router con una ruta raíz
- [x] 9.3 Cablear TanStack Query y escribir el cliente HTTP que interpreta el cuerpo de error estándar y expone el código de error al llamador
- [x] 9.4 Configurar el proxy de Vite de `/api` hacia la API, de modo que en desarrollo haya un solo origen
- [x] 9.5 Crear la vista que consulta `health` y muestra el resultado usando el tipo importado de `packages/contracts`
- [x] 9.6 Test del cliente HTTP: ante una respuesta de error estándar, expone el código sin depender del texto del mensaje

## 10. `CLAUDE.md` y cierre

- [x] 10.1 Redactar el `CLAUDE.md` sobre lo que quedó realmente construido: rol asignado, prohibición de hardcodear, centralización de configuración y constantes, anatomía obligatoria de módulo, patrón de actor, reglas de atomicidad e idempotencia para el saldo y las transiciones de estado, prefijo de rutas, idiomas, paginación por defecto y exigencia de tests por change
- [x] 10.2 Escribir el `README` con el arranque en dos comandos y los requisitos previos (Docker, Node, pnpm)
- [ ] 10.3 Verificación de extremo a extremo sobre un clon limpio: `docker compose up`, `pnpm install`, `pnpm dev`, `GET /api/v1/health` responde, el front muestra el resultado, quitar una variable del `.env` impide arrancar con mensaje claro, y `pnpm test` pasa entero — **parcial**: verificado todo sobre el repositorio actual (contenedores arriba, `pnpm install`, API y front levantados, `health` respondiendo por el proxy de Vite, el front pintando el resultado, quitar `WEB_ORIGIN` impide arrancar con salida 1 y mensaje claro, y los 55 tests en verde). Queda pendiente hacerlo con `pnpm dev` sobre un **clon limpio**, porque `pnpm dev` pasa por Turborepo (ver nota)
- [x] 10.4 Commit final del change

---

## Nota: Turborepo bloqueado por el antivirus

`turbo` no se puede ejecutar en esta máquina. **360 Total Security** impide crear `turbo.exe`
(50 MB, sin firmar): ni pnpm, ni npm, ni `tar` consiguen escribir el archivo, y el instalador de
Turborepo informa de éxito aunque el binario nunca llegue a existir. El fallo aparece después como
`spawn EPERM`.

No es un problema del código ni de la configuración: `turbo.json` está escrito y los scripts raíz
están cableados. En cuanto haya una exclusión en el antivirus para la carpeta del proyecto y para
`%LOCALAPPDATA%\pnpm\store`, basta con borrar `node_modules` y reinstalar.

Mientras tanto, todo se verificó ejecutando cada paquete directamente:

| Paquete              | lint | typecheck | tests |
| -------------------- | ---- | --------- | ----- |
| `@monedin/contracts` | ✓    | ✓         | 8     |
| `@monedin/api`       | ✓    | ✓         | 38    |
| `@monedin/web`       | ✓    | ✓         | 9     |

Las tareas 2.3 y 10.3 quedan sin marcar porque su parte pendiente depende exclusivamente de esto.
