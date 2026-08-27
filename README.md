# Monedín

Plataforma de educación financiera gamificada para niños de 6 a 11 años.

Los padres asignan **tareas** con valor en monedas y publican **premios** con precio en monedas. El
niño gana monedas completando tareas (con aprobación del padre) y las gasta canjeando premios
(también con aprobación). La moneda es virtual y cerrada a la familia: no hay dinero real, no hay
pagos y no hay interoperabilidad entre familias.

> **Estado del proyecto**: modelo de datos, autenticación y los tres módulos de dominio previstos. Un
> padre puede registrarse, entrar, y elegir desde una rejilla su propio perfil o el de un hijo, cada
> uno con su PIN. `tasks` cubre el ciclo completo de una tarea —repartirla, marcarla, aprobarla o
> rechazarla, con la acreditación de monedas—, `rewards` el catálogo de premios —publicarlos, ponerles
> precio por hijo, editarlos y retirarlos— y `redemptions` cierra el ciclo: el niño pide un premio que
> le alcanza y el padre lo aprueba —descontando el precio congelado al solicitar— o lo rechaza.
> `file-storage` añade imágenes de verdad: avatar propio del padre y de cada hijo —que convive con el
> catálogo de animales—, foto del premio, y una evidencia opcional que el niño adjunta al marcar una
> tarea. En local las guarda MinIO; en producción, S3.
>
> **Etapa actual: interfaz y diseño.** La API está completa; lo que se construye ahora es lo que se
> ve. `add-design-system` pone el cimiento: tokens en un único archivo, quince piezas en
> `apps/web/src/ui/`, tests de componente, y tres reglas —una de lint y dos de test— que impiden
> escribir un color o una medida fuera de los tokens. Trae también una **doble escala**, porque
> Monedín son dos productos en una app: para el niño cifras grandes y toque amplio, para el padre
> densidad y escaneo rápido, con las mismas piezas y sin duplicar ninguna.
>
> `add-app-shell` cierra el segundo change y es el único de la etapa que es arquitectura y no
> aspecto: **el niño no tenía ninguna ruta**. Sus cuatro pantallas vivían dentro de `/` con booleanos,
> así que el botón atrás sacaba de la aplicación y recargar volvía al inicio. Ahora cada destino tiene
> dirección, hay un marco por rol —cabecera para el padre, barra inferior para el niño— y el filtro de
> un listado viaja en la URL.
>
> Las pantallas de producto **todavía no están vestidas** y se ven más planas de lo que se veían: el
> reinicio de estilos entra con el sistema, y vestirlas una a una es lo que hacen los nueve changes
> siguientes. Para ver las piezas, `pnpm dev` y `http://localhost:5173/ui.html`, que existe solo en
> desarrollo.

---

## Requisitos previos

| Herramienta    | Versión  | Por qué                                              |
| -------------- | -------- | ---------------------------------------------------- |
| Node           | 22 LTS   | Fijada en `engines` y en `.nvmrc`                    |
| pnpm           | 11+      | Fijada en `packageManager`                           |
| Docker Desktop | cualquier | Levanta PostgreSQL, Adminer y MinIO                 |

```bash
node -v   # v22.x
pnpm -v   # 11.x
docker --version
```

Si no tienes pnpm: `npm install -g pnpm`.

---

## Arranque

Dos comandos, más copiar la plantilla de entorno:

```bash
cp .env.example .env    # los valores de ejemplo funcionan tal cual en local
docker compose up -d    # PostgreSQL + Adminer + MinIO (almacén de imágenes)
pnpm install && pnpm dev
```

Y ya está:

| Dónde   | URL                              |
| ------- | -------------------------------- |
| Front   | http://localhost:5173            |
| API     | http://localhost:3000/api/v1     |
| MinIO   | http://localhost:9001            |
| Salud   | http://localhost:3000/api/v1/health |
| Adminer | http://localhost:8080            |

En el navegador, la portada consulta `health` y muestra el resultado: si lo ves, la cadena completa
funciona (front → proxy de Vite → API → contrato compartido).

Para entrar en Adminer: sistema `PostgreSQL`, servidor `postgres`, y usuario, contraseña y base de
datos los que tengas en el `.env` (por defecto `monedin` en los tres).

---

## Comandos

```bash
pnpm dev         # API y front a la vez, con recarga
pnpm build       # compila todos los paquetes
pnpm test        # tests de todo el monorepo
pnpm lint        # ESLint
pnpm typecheck   # TypeScript sin emitir
pnpm verify      # lint + typecheck + test + build, SIN caché de Turbo
pnpm format      # Prettier
```

`pnpm verify` es el que hay que ejecutar antes de cerrar un change: la caché de Turborepo puede dar
por buena una tarea que ya no compila, y `--force` la desactiva.

Para un solo paquete: `pnpm --filter @monedin/api test`.

### Base de datos

```bash
pnpm --filter @monedin/api db:generate   # regenera el cliente de Prisma
pnpm --filter @monedin/api db:migrate    # crea y aplica una migración en desarrollo
pnpm --filter @monedin/api db:deploy     # aplica las migraciones pendientes (producción)
pnpm --filter @monedin/api db:seed       # datos de ejemplo, SOLO en desarrollo
pnpm --filter @monedin/api db:studio     # explorador de datos de Prisma
```

Tras sembrar, se puede entrar con:

| Quién | Credencial |
| ----- | ---------- |
| Lucía (madre) | `familia.ejemplo@monedin.dev` / `monedin-desarrollo`, perfil con PIN `1357` |
| Mateo | PIN `1234` |
| Emma | PIN `5678` |

Están a la vista de cualquiera que lea el repositorio: por eso la siembra **se niega a ejecutarse
fuera de desarrollo**.

El cliente de Prisma **se genera, no se versiona**. Las tareas de Turborepo lo encadenan a `build`,
`typecheck` y `test`, así que en el flujo normal no hay que pensar en ello.

Los tests de la capa de datos corren contra una base **separada** de la de desarrollo
(`TEST_DATABASE_URL`), que se recrea al arrancar la batería. Cada test va dentro de una transacción
que se deshace, así que no dejan rastro y el orden no importa.

Cuando toques una migración que recree una tabla, comprueba que siguen ahí las restricciones `CHECK`
y el disparador del historial: Prisma no los conoce y puede llevárselos por delante. Hay un test que
lo detecta (`tests/database/limits-sync.test.ts`).

---

## Estructura

```
monedin/
├── apps/
│   ├── api/                  Express + Prisma + TypeScript
│   │   ├── prisma/           esquema, migraciones y siembra de desarrollo
│   │   ├── prisma.config.ts  configuración del CLI de Prisma
│   │   └── src/
│   │       ├── config/       ÚNICO lugar que lee el entorno en tiempo de petición
│   │       ├── generated/    cliente de Prisma (generado, no versionado)
│   │       ├── modules/      un directorio por módulo (health es la plantilla)
│   │       ├── shared/       errores, mensajes, logger, actor, base de datos
│   │       ├── app.ts        composición de la app
│   │       └── server.ts     arranque
│   └── web/                  Vite + React + TanStack Router y Query
├── packages/
│   ├── contracts/            schemas Zod, tipos y constantes compartidos
│   └── config/               tsconfig, ESLint y Prettier compartidos
├── openspec/                 proposals, designs, specs y tasks
├── docker-compose.yml        PostgreSQL 16 + Adminer + MinIO (solo desarrollo)
├── .env.example              plantilla de entorno versionada
└── CLAUDE.md                 reglas de desarrollo — léelo antes de tocar código
```

**Antes de escribir código, lee [`CLAUDE.md`](./CLAUDE.md).** No es documentación de cortesía: fija
la anatomía de módulo, el patrón de autorización y las reglas de atomicidad del saldo.

---

## Cómo se entra

El dispositivo es familiar, así que el flujo lo es también. Hay dos niveles de sesión: la cuenta
acredita el dispositivo, y el **perfil activo** —el del padre o el de un hijo, elegido en la
rejilla— es lo que da actor. La cuenta por sí sola no permite operar nada.

```
   El padre entra una vez con su correo y contraseña, o se registra (con su PIN incluido).
   La sesión de CUENTA persiste en el dispositivo (30 días, y el uso la renueva).
        │
        ▼
   rejilla de perfiles  ──►  elige un perfil (el suyo o el de un hijo)  ──►  PIN de 4 dígitos
        ▲                                                                        │
        │                                                                        ▼
        └───────────────────── "Cambiar de perfil" ◄───────── perfil activo, padre o hijo
```

Salir de un perfil vuelve a la rejilla sin pedir contraseña: solo borra la cookie de perfil, la de
cuenta queda intacta. Cerrar la sesión (`signOut`) sí se lleva la cuenta y con ella el acceso a
todos los perfiles.

Cinco PIN fallidos bloquean el perfil de ese niño durante 5 minutos, y su padre puede desbloquearlo
al momento. Diez PIN fallidos bloquean el perfil del propio padre 15 minutos —el mismo límite que
sus contraseñas, porque es un adulto tecleando, no un niño de seis años— y los dos bloqueos son
independientes entre sí.

**No hay recuperación de contraseña.** Necesita envío de correo, que llegará en su propio change; un
padre que la olvide hoy se queda fuera. El PIN sí se recupera en los dos casos: el de un niño lo
restablece su padre, y el del padre se restablece con su propia contraseña, desde la rejilla —es la
vía de rescate para quien se queda bloqueado fuera de su propio perfil.

## Configuración

Todo el comportamiento dependiente del entorno sale del `.env`. El mismo artefacto se despliega en
local, en un servidor propio o en EC2 cambiando solo ese archivo.

La API **se niega a arrancar** si falta una variable o tiene un valor inválido, y te dice todos los
problemas de una vez:

```
La configuración de entorno no es válida. Se encontraron 2 problemas:

  - API_PORT: se esperaba un número (recibido: abc)
  - WEB_ORIGIN: falta esta variable, es obligatoria

Revisa tu archivo .env en la raíz del repositorio.
```

Los valores de variables marcadas como secretas nunca aparecen en la salida.

Para apuntar a otro archivo de entorno sin tocar código:

```bash
ENV_FILE=/etc/monedin/produccion.env node apps/api/dist/server.js
```

---

## Problemas conocidos

**`turbo` falla con `spawn EPERM`, o `pnpm dev` no arranca.**
Un antivirus está bloqueando `turbo.exe` (50 MB, sin firmar). Se detectó con **360 Total Security**,
y la instalación *parece* terminar bien: el binario simplemente nunca llega a escribirse. Añade una
exclusión para la carpeta del proyecto y para el store de pnpm (`%LOCALAPPDATA%\pnpm\store`), borra
`node_modules` y reinstala.

**`pnpm install` falla con `EPERM ... symlink`.**
Windows sin Modo desarrollador restringe la creación de symlinks. Suele bastar con volver a ejecutar
`pnpm install`; si es persistente, activa Modo desarrollador en Ajustes → Privacidad y seguridad →
Para desarrolladores.

**El editor marca errores de tipos justo después de clonar.**
El cliente de Prisma se genera y no está en el repositorio. Ejecuta
`pnpm --filter @monedin/api db:generate` (o cualquier `pnpm build` / `pnpm test`, que ya lo
encadenan) y reinicia el servidor de TypeScript del editor.

**Cambio un contrato de `packages/contracts` y la API no lo recoge.**
Es deliberado: el vigilante de la API mira solo `apps/api/src`. `tsc --watch` reescribe `dist`
archivo por archivo, y un vigilante que mire ahí encadena un reinicio por escritura y acaba matando
el proceso a medio arrancar. Tras tocar un contrato, reinicia `pnpm dev`.

**El puerto 5432 ya está en uso.**
Tienes otro PostgreSQL corriendo. Cambia `POSTGRES_PORT` en el `.env` y ajusta `DATABASE_URL` para
que coincida.

---

## Despliegue

El proyecto es portable a mano, sin pipeline (eso es trabajo de un change posterior):

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @monedin/api db:deploy  # aplica las migraciones pendientes
node apps/api/dist/server.js          # API, con su .env
# apps/web/dist se sirve como estáticos desde Nginx
```

La API cierra de forma ordenada al recibir la señal de apagado: deja de aceptar peticiones y después
cierra la conexión a la base de datos.

Nginx sirve la SPA en `/` y reenvía `/api/v1/*` a la API — la misma topología que el proxy de Vite en
desarrollo, para que los problemas de cookies y orígenes aparezcan mientras programas y no en el
primer despliegue.

**Adminer no se despliega nunca.** Es un cliente de base de datos con acceso total; está en el
compose de desarrollo y solo ahí.
