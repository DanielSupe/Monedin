# Design

## Context

Ver proposal.md — Why. Hoy la raíz está escrita en tres sitios del front y en ninguno más:

```
  vite.config.ts        sin `base`         -> recursos en /assets/...
  src/main.tsx          sin `basepath`     -> /monedin/welcome no casa con ninguna ruta
  src/lib/http-client   `${API_PREFIX}…`   -> la API se pide en /api/v1, la raíz del dominio
```

No hay enlaces `<a href="/…">` escritos a mano ni asignaciones a `window.location`: toda la
navegación pasa por el router, y las fuentes y los recursos los resuelve Vite. Por eso esos tres son
todos.

Una restricción que manda sobre todo lo demás: el lint del proyecto prohíbe `import.meta.env` en todo
`src`, y la única forma habitual de leer la base en Vite es `import.meta.env.BASE_URL`.

## Goals / Non-Goals

**Goals:**

- Que con `WEB_BASE_PATH=/` no cambie ni una petición: los tests existentes siguen como están.
- Que el servidor de desarrollo honre la misma base, para ver los defectos de rutas en local.

**Non-Goals:**

- Cambiar la base sin recompilar (ver la salvedad en la spec).
- Cambiar el `Path` de las cookies de sesión. Siguen en `/`: ver Riesgos.

## Decisions

### 1. La base entra por `define`, no por `import.meta.env`

`vite.config.ts` ya lee el entorno con `loadEnv` —así obtiene `API_PORT` y `WEB_PORT`— y es el
único sitio del front que lo hace. Ahí se lee `WEB_BASE_PATH`, se normaliza, y se entrega por dos
vías: `base` para que Vite reescriba los recursos, y `define: { __WEB_BASE_PATH__ }` para el código.
En `src`, un solo módulo, `lib/base-path.ts`, declara esa constante y exporta lo derivado.

Descartadas:

- **`import.meta.env.BASE_URL`**: es lo idiomático, y exige una excepción `allowEnvAccess` en el
  front. Sería la tercera del proyecto, y `CLAUDE.md` dice que una tercera es la señal de que algo se
  está haciendo mal. Con `define`, `src` no lee ningún entorno: recibe una constante ya decidida,
  igual que `applyCoinMovement` recibe una transacción.
- **Descubrirla en ejecución** (mirando la URL del script o una etiqueta `<base>`): depende de cómo
  esté escrito el HTML y falla en silencio.
- **`base: "./"` relativa**: los recursos se piden relativos a la dirección actual, así que recargar
  `/monedin/tasks/123` los pide a `/monedin/tasks/assets/…`.

Fuera de una compilación de Vite —en la batería de Vitest, que no pasa por `vite.config.ts`— la
constante no existe y el módulo cae en `/`. No es un valor por defecto que tape una variable
ausente: `/` **es** el valor sin declarar, y `vite.config.ts` siempre define la constante.

### 2. Normalizar a barra inicial y final, y rechazar lo que no empiece por `/`

Vite quiere la base con barra final y el router la quiere sin ella. Se guarda una forma canónica
(`/monedin/`) y se derivan las otras dos en `lib/base-path.ts`, en vez de que cada consumidor quite
o ponga barras por su cuenta. La normalización es una función pura del mismo módulo, que
`vite.config.ts` importa: así se prueba con Vitest sin compilar nada.

Un valor sin `/` inicial hace fallar la compilación nombrando la variable, como hace la API al
arrancar con una configuración inválida.

### 3. La API no se entera; el proxy recorta

```
   navegador                    Apache / Vite                 API
   ─────────                    ─────────────                 ───
   /monedin/welcome      ──►    sirve index.html (SPA)
   /monedin/assets/x.js  ──►    sirve el archivo
   /monedin/api/v1/…     ──►    recorta /monedin       ──►    /api/v1/…
```

Servir la API también bajo la base obligaría a que su prefijo dependiera de la configuración del
front, y el contrato compartido lo fija como constante. Recortar es exactamente lo que ya hace el
proxy de Vite en desarrollo, con una regla más.

### 4. Turbo tiene que saber que la base existe

Descubierto al implementar, no previsto en la primera versión de este design. La tarea `build` de
`turbo.json` no contaba el `.env` entre sus entradas, así que cambiar `WEB_BASE_PATH` y recompilar
daba **cache hit** y reponía un `dist` con la base anterior: el defecto exacto que este change existe
para evitar, y en silencio. Y en modo estricto turbo no pasa a la tarea una variable que no declara,
así que `WEB_BASE_PATH=/monedin pnpm build` desde la raíz compilaba en `/`.

Se declaran las dos cosas: `WEB_BASE_PATH` en `env` de `build` y de `dev`, y `$TURBO_ROOT$/.env`
entre las entradas de `build`. Lo segundo invalida también la compilación de la API cuando cambia el
`.env`; es una recompilación de más, frente a un artefacto equivocado de menos.

## Risks / Trade-offs

- [Las cookies de sesión siguen en `Path=/`, así que el navegador las envía también a las demás
  aplicaciones del dominio] → Sus nombres llevan el prefijo `monedin_` y son `HttpOnly`, así que no
  chocan con otras ni las lee ningún script. Acotarlas a la base es un change de la API, que se
  difiere.
- [Un artefacto compilado con una base y servido bajo otra pinta una página en blanco] → Se
  documenta en el README junto al despliegue, y los recursos 404 se ven en el primer vistazo a la
  consola.
- [Un enlace futuro escrito a mano como `<a href="/…">` se saltaría la base] → Hoy no hay ninguno. Se
  difiere un test que lo impida: la regla de que «navegar es trabajo de un enlace» del router ya lo
  cubre en la práctica.

## Migration Plan

Sin migración. Con la variable sin declarar, nada cambia. Para desplegar bajo una ruta: declarar
`WEB_BASE_PATH`, `pnpm build` y configurar el proxy según el README. Revertir es compilar sin ella.
