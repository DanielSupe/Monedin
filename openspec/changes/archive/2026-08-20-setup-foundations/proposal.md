## Why

El repositorio está vacío: no hay monorepo, ni base de datos, ni una sola línea de aplicación. Antes
de escribir dominio hay que fijar el andamio y, sobre todo, **las reglas**: si el primer módulo de
negocio se escribe antes de existir el módulo de configuración, el contrato de errores y los
contratos compartidos, esas tres cosas nacen copiadas y dispersas, y la regla de "nada hardcodeado,
todo centralizado" queda como un buen deseo en vez de como algo verificable.

Este change existe para que cuando llegue el primer módulo de dominio ya haya un molde que copiar y
una forma correcta que sea también la forma más cómoda.

## What Changes

- **Monorepo**: pnpm workspaces + Turborepo con `apps/api`, `apps/web`, `packages/contracts` y
  `packages/config`. Un solo `pnpm dev` levanta API y web.
- **`CLAUDE.md`**: documento de reglas de desarrollo y rol asignado, vinculante para todos los
  changes siguientes. Cubre la prohibición de hardcodear, la centralización de configuración y
  constantes, la anatomía obligatoria de un módulo, el patrón de actor para autorización, y las
  reglas de atomicidad e idempotencia que el dominio va a necesitar.
- **Infraestructura local**: `docker-compose.yml` con PostgreSQL y Adminer, más `.env.example`
  versionado. La misma imagen de la API sirve para un servidor propio o EC2; lo único que cambia
  entre entornos es el `.env`.
- **Módulo de configuración**: único punto del sistema que lee el entorno. Valida al arrancar y la
  API **se niega a levantar** si falta o es inválida una variable, en lugar de fallar más tarde en
  una petición cualquiera.
- **Contrato de errores**: una forma única de respuesta de error para toda la API y un mapeo
  explícito de error de dominio a estado HTTP, definido una sola vez.
- **Módulo `health`**: `GET /api/v1/health`. Sirve de sonda de vida para el despliegue y, sobre
  todo, de módulo de referencia: es la plantilla ejecutable de la anatomía que todos los módulos
  siguientes deben seguir.
- **Paquete de contratos compartidos**: el lugar donde vivirán los schemas Zod, los tipos y las
  constantes de dominio que consumen a la vez la API y el front. En este change se establece con el
  contrato de `health` como primer caso real de uso de punta a punta.
- **Base de tests**: Vitest en ambas apps y Supertest para la API, con los primeros tests cubriendo
  el módulo `health`, el mapeo de errores y el fallo ruidoso de la configuración.
- **Módulo de mensajes**: los textos visibles al usuario, en español, en un solo lugar desde el
  primer día, para que ningún módulo posterior nazca con strings incrustados.

### No incluye

- Ningún modelo de Prisma, migración ni esquema de base de datos. El contenedor de PostgreSQL se
  levanta y queda vacío; el esquema llega en `add-data-model`.
- Nada de autenticación, sesiones, usuarios ni PIN. Llega en `add-authentication`.
- Ningún módulo de dominio: hijos, tareas, premios y canjes quedan fuera.
- Ninguna integración con S3 ni subida de archivos. La interfaz `StorageProvider` se define cuando
  exista un archivo real que guardar, en `add-file-storage`.
- Sin diseño visual ni sistema de componentes. El front de este change es el andamio mínimo que
  demuestra que el contrato compartido funciona.
- Sin pipeline de CI ni despliegue automatizado. El change deja el proyecto desplegable a mano y
  portable; automatizarlo es trabajo posterior.

## Capabilities

### New Capabilities

- `runtime-configuration`: cómo el sistema lee, valida y expone su configuración de entorno, y qué
  hace cuando esa configuración es inválida o incompleta.
- `api-error-contract`: la forma única que tiene toda respuesta de error de la API y las reglas que
  traducen un fallo de dominio o de validación a un estado HTTP.
- `platform-health`: el endpoint de salud que permite comprobar que la API está viva.

### Modified Capabilities

Ninguna. No existen specs previas en `openspec/specs/`; este es el primer change del proyecto.

## Impact

**Se crea desde cero** (no hay código previo que romper):

- Raíz: `CLAUDE.md`, `pnpm-workspace.yaml`, `turbo.json`, `docker-compose.yml`, `.env.example`,
  `.gitignore`.
- `apps/api`: servidor Express con el módulo `config`, el `shared` de errores y mensajes, y el
  módulo `health`.
- `apps/web`: aplicación Vite + React con TanStack Router y TanStack Query cableados, consumiendo
  `health` como prueba de extremo a extremo.
- `packages/contracts` y `packages/config`.

**Dependencias que se introducen**: pnpm y Turborepo como herramienta de monorepo; Express y Zod en
la API; React, TanStack Query y TanStack Router en el front; Vitest y Supertest para tests. Docker
deja de ser opcional para desarrollar. Prisma **no** se instala todavía: llega con el esquema en
`add-data-model` (ver `design.md`, decisión 9).

**Compromisos que adquieren todos los changes siguientes**: el prefijo `/api/v1`, la anatomía de
módulo, el patrón de actor, el contrato de errores y la prohibición de leer el entorno fuera del
módulo de configuración. A partir de aquí, saltarse cualquiera de estos es una regresión, no una
decisión.
