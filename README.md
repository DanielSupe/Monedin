# Monedín

Plataforma de educación financiera gamificada para niños de 6 a 11 años.

Los padres asignan **tareas** con valor en monedas y publican **premios** con precio en monedas. El
niño gana monedas completando tareas (con aprobación del padre) y las gasta canjeando premios
(también con aprobación). La moneda es virtual y cerrada a la familia: no hay dinero real, no hay
pagos y no hay interoperabilidad entre familias.

> **Estado del proyecto**: el andamio (`setup-foundations`). Hay monorepo, configuración validada,
> contrato de errores, `GET /api/v1/health` y un front que lo consume. Todavía **no** hay modelo de
> datos, ni autenticación, ni módulos de dominio.

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

---

## Estructura

```
monedin/
├── apps/
│   ├── api/                  Express + TypeScript
│   │   └── src/
│   │       ├── config/       ÚNICO lugar que lee el entorno
│   │       ├── modules/      un directorio por módulo (health es la plantilla)
│   │       ├── shared/       errores, mensajes, logger, actor, validación
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

**El puerto 5432 ya está en uso.**
Tienes otro PostgreSQL corriendo. Cambia `POSTGRES_PORT` en el `.env` y ajusta `DATABASE_URL` para
que coincida.

---

## Despliegue

El proyecto es portable a mano, sin pipeline (eso es trabajo de un change posterior):

```bash
pnpm install --frozen-lockfile
pnpm build
node apps/api/dist/server.js          # API, con su .env
# apps/web/dist se sirve como estáticos desde Nginx
```

Nginx sirve la SPA en `/` y reenvía `/api/v1/*` a la API — la misma topología que el proxy de Vite en
desarrollo, para que los problemas de cookies y orígenes aparezcan mientras programas y no en el
primer despliegue.

**Adminer no se despliega nunca.** Es un cliente de base de datos con acceso total; está en el
compose de desarrollo y solo ahí.
