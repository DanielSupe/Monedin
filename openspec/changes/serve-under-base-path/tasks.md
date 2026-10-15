# Tasks

## 1. La base como configuración

- [x] 1.1 Crear `apps/web/src/lib/base-path.ts` con la normalización pura, la constante y lo derivado (base del router, URL de la API), con tests en `apps/web/tests/` que cubran sin base, con base, barra final y base inválida
- [x] 1.2 Declarar `WEB_BASE_PATH` en `.env.example` y en la lista de claves de infraestructura del test de la plantilla; verificar que `env-template.test.ts` pasa
- [x] 1.3 Leer `WEB_BASE_PATH` en `vite.config.ts`: `base`, `define` y el proxy de desarrollo bajo la base que recorta el prefijo; verificar que `pnpm --filter @monedin/web build` con `WEB_BASE_PATH=/monedin` deja en `dist/index.html` recursos bajo `/monedin/`, y que con `WEB_BASE_PATH=monedin` falla nombrando la variable
- [x] 1.4 Declarar `WEB_BASE_PATH` en `env` de `build` y `dev` y el `.env` entre las entradas de `build` en `turbo.json`; verificar que cambiar la base en el `.env` da cache miss y que `WEB_BASE_PATH=/otra pnpm turbo run build` compila bajo `/otra/`

## 2. Los consumidores

- [x] 2.1 Pasar la base al router en `main.tsx` y la URL de la API al cliente HTTP; verificar con un test del cliente que con base `/monedin/` llama a `/monedin/api/v1/…` y que la batería existente del front sigue en verde con la base por defecto
- [x] 2.2 Documentar en el README el despliegue detrás de Apache bajo una ruta base (Alias, FallbackResource, ProxyPass) y la consecuencia de que la base se fija al compilar

## 3. Integración

- [x] 3.1 `pnpm verify` en verde, y comprobación a mano: `pnpm dev` con `WEB_BASE_PATH=/monedin` sirve `/monedin/welcome` y la API responde en `/monedin/api/v1/health`; y en el navegador, `/monedin/tasks` sin sesión redirige a `/monedin/welcome` y las llamadas van a `/monedin/api/v1/…`
