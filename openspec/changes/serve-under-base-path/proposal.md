# Proposal

## Why

El servidor donde se va a desplegar Monedín ya tiene un Apache en el 443 que reparte el dominio
`ingenieria.unac.edu.co` **por rutas** entre varias aplicaciones. Monedín solo sabe vivir en la raíz
`/`: los archivos compilados se piden a `/assets/...`, el router no reconoce `/monedin/welcome` y el
cliente HTTP llama a `/api/v1` en la raíz del dominio, que es de otro. Ocupar la raíz rompería las
demás aplicaciones, y un subdominio o un puerto propio dependen de terceros.

## What Changes

- Nueva variable de entorno **`WEB_BASE_PATH`**, por defecto `/`, que dice bajo qué ruta se sirve el
  front. Se lee **en compilación**: el artefacto de `pnpm build` queda atado a esa ruta.
- Con ella, tres piezas dejan de suponer la raíz: los recursos compilados, el router (las direcciones
  de la aplicación cuelgan de la base) y el cliente HTTP (la API se llama en `<base>api/v1`).
- La API **no cambia**: sigue escuchando en `/api/v1`. Quitar el prefijo es trabajo del proxy inverso,
  igual que el proxy de Vite en desarrollo.
- El servidor de desarrollo honra la misma base, para que un defecto de rutas aparezca en local y no
  en el primer despliegue.
- Documentación de despliegue detrás de **Apache** con una ruta base en el README.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `runtime-configuration`: se añade un requisito para que el front pueda servirse bajo una ruta base
  configurable sin tocar código, que es la misma promesa de portabilidad que ya hace para la API.

## Impact

- `apps/web/vite.config.ts`, `apps/web/src/main.tsx`,
  `apps/web/src/lib/http-client.ts` y un módulo nuevo en `apps/web/src/lib/`.
- `turbo.json`: la base entra en la caché de `build` y se pasa a `build` y `dev`.
- `.env.example` y la lista de claves de infraestructura del test de la plantilla
  (`apps/api/tests/config/env-template.test.ts`).
- README: sección de despliegue.
- Sin cambios de contrato, de API ni de base de datos. Con `WEB_BASE_PATH=/` el comportamiento es
  idéntico al actual.

## No incluye

- Arreglar las imágenes de MinIO del `docker-compose.yml`, que ya no se pueden descargar. Es su propio
  change.
- Un pipeline de despliegue o un proceso gestor de la API (pm2, systemd): se documentan los comandos,
  no se automatizan.
- Servir la **API** bajo otra ruta: su prefijo sigue siendo `API_PREFIX`.
- Cambiar la base sin recompilar. Es una decisión de compilación, como en cualquier SPA de Vite.
