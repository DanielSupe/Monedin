# Monedín

Plataforma de educación financiera gamificada para niños de 6 a 11 años.

Los padres asignan **tareas** con valor en monedas y publican **premios** con precio en monedas. El
niño gana monedas completando tareas (con aprobación del padre) y las gasta canjeando premios
(también con aprobación). La moneda es virtual y cerrada a la familia: no hay dinero real, no hay
pagos y no hay interoperabilidad entre familias.

> **Estado del proyecto**: andamio y modelo de datos (`setup-foundations`, `add-data-model`). Hay
> monorepo, configuración validada, contrato de errores, `GET /api/v1/health`, un front que lo
> consume, y el esquema completo del dominio con sus invariantes garantizados por PostgreSQL.
> Todavía **no** hay autenticación ni módulos de dominio.

---

## Requisitos previos

| Herramienta    | Versión  | Por qué                                              |
| -------------- | -------- | ---------------------------------------------------- |
| Node           | 22 LTS   | Fijada en `engines` y en `.nvmrc`                    |
| pnpm           | 11+      | Fijada en `packageManager`                           |
| Docker Desktop | cualquier | Levanta PostgreSQL y Adminer                        |

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
docker compose up -d    # PostgreSQL + Adminer
pnpm install && pnpm dev
```

Y ya está:

| Dónde   | URL                              |
| ------- | -------------------------------- |
| Front   | http://localhost:5173            |
| API     | http://localhost:3000/api/v1     |
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
├── docker-compose.yml        PostgreSQL 16 + Adminer (solo desarrollo)
├── .env.example              plantilla de entorno versionada
└── CLAUDE.md                 reglas de desarrollo — léelo antes de tocar código
```

**Antes de escribir código, lee [`CLAUDE.md`](./CLAUDE.md).** No es documentación de cortesía: fija
la anatomía de módulo, el patrón de autorización y las reglas de atomicidad del saldo.

---

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
