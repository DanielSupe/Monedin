## Context

El repositorio está vacío y **ni siquiera es un repositorio git todavía**: hay un scaffold de
OpenSpec y el documento de definición del producto. No hay código previo que respetar, ningún
usuario en producción y ninguna migración pendiente. Todo lo que se decida aquí es barato ahora y
caro dentro de seis módulos.

Ver `proposal.md` para la motivación. Este documento cubre cómo se monta el andamio y por qué se
eligió cada pieza.

Dos restricciones del entorno condicionan varias decisiones: el proyecto vive en una carpeta
sincronizada por OneDrive en Windows, y el objetivo declarado de despliegue es un servidor propio o
EC2 gestionado a mano, no una plataforma administrada.

## Goals / Non-Goals

**Goals:**

- Que exista un molde de módulo copiable, de forma que el primer módulo de dominio no tenga que
  inventar estructura.
- Que la regla "nada hardcodeado" sea comprobable por una herramienta y no por la memoria de quien
  programa.
- Que el contrato entre front y back sea un artefacto único, no dos definiciones que se parecen.
- Que la topología de desarrollo se parezca a la de producción, para que los problemas de cookies,
  orígenes y rutas aparezcan en local y no en el primer despliegue.
- Que un clon limpio llegue a `GET /api/v1/health` respondiendo, con dos comandos.

**Non-Goals:**

- Rendimiento, escalado horizontal y observabilidad avanzada. Con cero usuarios, optimizar es
  adivinar.
- Sistema de diseño y componentes visuales. El front de este change es andamio.
- Automatización de despliegue. El change deja el proyecto portable y desplegable a mano.
- Abstraer la base de datos o el proveedor de almacenamiento antes de tener un caso de uso real.

## Decisions

### 1. pnpm workspaces + Turborepo

**Elegido** frente a npm workspaces (resolución más laxa: permite importar paquetes no declarados, y
eso rompe el aislamiento entre módulos), frente a Nx (mucha maquinaria para dos apps y dos paquetes)
y frente a no usar monorepo (obligaría a duplicar los contratos o a publicar un paquete privado).

pnpm aporta el aislamiento estricto que hace que `packages/contracts` sea de verdad la única fuente:
si `apps/web` no lo declara como dependencia, no lo puede importar. Turborepo aporta el grafo de
tareas y la caché.

La versión de pnpm se fija en el campo `packageManager` del `package.json` raíz y la de Node en
`engines` más un archivo de versión, para que la máquina de un tercero y el servidor coincidan.

### 2. `packages/contracts` como fuente única de verdad, con Zod

Los esquemas Zod viven una sola vez y de ellos se derivan los tipos de TypeScript. La API los usa
para validar la entrada; el front los usa para tipar respuestas y para validar formularios antes de
enviar.

```
              packages/contracts
              ┌──────────────────────────────┐
              │  schemas Zod                 │
              │  constantes de dominio       │
              │  (6-11, 2-100, 1-9999, ...)  │
              └──────┬────────────────┬──────┘
                     │                │
          valida ▼   │                │   ▼ tipa y valida
              apps/api            apps/web
```

**Alternativa descartada**: definir el contrato en OpenAPI y generar clientes. Más ceremonia, y
obliga a mantener un archivo intermedio. Se prefiere generar el OpenAPI *desde* los esquemas Zod
cuando haga falta documentación, invirtiendo la dirección.

Las constantes de dominio viven aquí y no en cada app. Es la forma concreta de cumplir "nada
hardcodeado": si el rango de edad cambia, cambia en un archivo, no en cuatro.

### 3. Anatomía de módulo y patrón de actor

Cada módulo de la API tiene la misma forma, y el módulo `health` de este change existe en buena
medida para ser esa plantilla ejecutable.

```
   HTTP
    │
    ▼
  routes ──► controller ──► service ──────► repository ──► base de datos
             │              │                              │
             │              └── reglas de negocio          └── único lugar
             │                  Y autorización                 que la toca
             │
             └── construye el actor desde la sesión,
                 parsea y serializa, cero permisos
```

La firma de todo método de servicio es `service.method(actor, dto)`, con
`actor = { userId, familyRole, childProfileId? }`. Esto es lo que hace **cumplible** la regla del
documento de producto de que la autorización se valida en la capa de negocio: si el actor es el
primer argumento obligatorio, no hay forma de escribir un servicio que ignore quién llama sin que se
note en la firma.

**Alternativa descartada**: middlewares de autorización por ruta. Es más rápido de escribir, pero
deja la regla fuera del servicio, y un servicio invocado desde otro sitio (un job, otro servicio) se
salta el permiso silenciosamente.

### 4. Configuración: un módulo, validación al arrancar, lint que lo obliga

Un único módulo lee el entorno, lo valida con un esquema Zod y exporta un objeto tipado congelado.
El proceso muere si la validación falla.

La parte que hace que la regla sobreviva al tercer mes es la **regla de lint**: se prohíbe
`process.env` en todo el proyecto salvo en ese módulo. Sin esa regla, la convención se erosiona en
cuanto alguien tenga prisa.

**Alternativa descartada**: leer el entorno donde haga falta con valores por defecto en el propio
sitio. Es lo que produce el escenario de "funciona en local, y en producción apunta a la base de
datos equivocada porque un valor por defecto silencioso tapó la variable ausente".

### 5. Errores: clases de dominio + un único traductor a HTTP

Los servicios lanzan errores de dominio (no encontrado, no permitido, conflicto, entrada inválida)
que no saben nada de HTTP. Un único manejador al final de la cadena los traduce a estado y cuerpo.

```
  service lanza          traductor único        respuesta
  ─────────────          ───────────────        ─────────
  NotFoundError    ────►      404        ────►  { code, message, details? }
  ForbiddenError   ────►      403        ────►  misma forma
  ConflictError    ────►      409        ────►  misma forma
  ValidationError  ────►      422        ────►  + detalle por campo
  (cualquier otro) ────►      500        ────►  mensaje genérico + incidentId
```

Un módulo nuevo hereda el comportamiento correcto sin escribir nada. El código de error es la parte
estable del contrato; el mensaje es texto y puede cambiar.

Para el 500 se genera un identificador de incidente que viaja al cliente y se registra en el log con
el error completo. Así un padre puede reportar un código y ser rastreable, sin que la respuesta
filtre trazas internas.

### 6. Prefijo `/api/v1` y proxy de Vite en desarrollo

El documento de producto pedía rutas sin prefijo. Se cambia porque choca con el propio objetivo de
despliegue: con el front en TanStack Router, `/tasks` es a la vez una ruta de navegación y un
endpoint, y resolver esa ambigüedad obligaría a un subdominio aparte, con CORS y cookies entre
sitios distintos.

La decisión que lo acompaña: en desarrollo, Vite hace proxy de `/api` hacia la API, en vez de que el
front llame a otro origen.

```
   DESARROLLO                             PRODUCCIÓN
   ──────────                             ──────────
   navegador                              navegador
      │ :5173                                │ :443
      ▼                                      ▼
   Vite dev server                        Nginx
      ├── /           SPA                    ├── /           SPA (estático)
      └── /api/v1/* ──proxy──► API           └── /api/v1/* ──► API

   Un solo origen. Cookies same-site.     Idéntica topología.
```

Esto elimina CORS del desarrollo y, más importante, hace que el comportamiento de las cookies de
sesión sea el mismo en local y en el servidor. Los problemas de sesión aparecerán mientras se
programa, no en el primer despliegue.

### 7. `health` es sonda de vida, no de dependencias

No consulta la base de datos. Un endpoint de salud que falla cuando cae Postgres provoca que el
orquestador reinicie una API que está perfectamente viva, convirtiendo una incidencia de base de
datos en una caída total.

Si más adelante hace falta comprobar dependencias, será un endpoint distinto con otro propósito. No
se añade ahora porque no hay dependencias que comprobar.

### 8. Docker solo para infraestructura; las apps corren en el host

Postgres y Adminer en `docker-compose.yml`; API y web con `pnpm dev` en la máquina. Meter las apps
en contenedores durante el desarrollo añade recarga en caliente sobre volúmenes montados, que en
Windows es lenta y frágil.

Adminer se declara con un comentario explícito de que es exclusivo de desarrollo, y el compose de
producción sencillamente no lo incluye.

### 9. Sin Prisma en este change

Se difiere la instalación de Prisma a `add-data-model`. Instalarlo ahora significaría un cliente sin
esquema del que generar: una dependencia y un paso de build que no hacen nada. La conectividad del
contenedor de Postgres se verifica con Adminer, que es justamente para lo que está.

### 10. Mensajes en español mediante catálogo propio, sin librería de i18n

Un objeto tipado de mensajes, no una librería de internacionalización. Con un solo idioma, una
librería aporta pluralización e interpolación que aún no se necesitan, y una estructura de archivos
que habría que mantener.

Lo que sí se adopta desde el día uno es la **disciplina**: cero textos visibles incrustados. Migrar
un catálogo centralizado a una librería el día que haya un segundo idioma es mecánico; extraer
textos repartidos por sesenta archivos no lo es.

## Risks / Trade-offs

**El proyecto vive dentro de OneDrive** → OneDrive sincroniza `node_modules` y la caché de Turbo, lo
que provoca lentitud, bloqueos de archivos y builds corruptos en Windows. Mitigación: excluir
`node_modules`, `.turbo` y `dist` de la sincronización, o mover el repositorio fuera de la carpeta
sincronizada. Conviene decidirlo **antes** de la primera instalación de dependencias, no después.

**El repositorio no está bajo git** → todo el trabajo hecho hasta ahora es irrecuperable ante un
error. Mitigación: `git init` y primer commit como primera tarea del change, antes de instalar nada.

**Fricción histórica entre Prisma y ESM** → si se fija `"type": "module"` en toda la monorepo y
Prisma da problemas en `add-data-model`, el coste de revertir crece con cada módulo escrito.
Mitigación: verificar la combinación exacta de versiones en una tarea corta de este change y dejar
la decisión registrada por escrito antes de escribir el segundo módulo.

**La caché de Turborepo puede enmascarar fallos** → una tarea marcada como exitosa desde caché
oculta que el código actual ya no compila. Mitigación: declarar bien entradas y salidas de cada
tarea desde el principio, y disponer de un comando de verificación sin caché.

**El andamio puede crecer más de lo necesario** → es fácil que un change de fundaciones acabe
incluyendo sistema de diseño, logging estructurado y CI. Mitigación: la sección "No incluye" del
proposal es vinculante; cualquier añadido va a un change propio.

**Docker Desktop pasa a ser requisito de desarrollo** → sin él no hay base de datos. Se asume: la
alternativa (Postgres instalado en el host) diverge del entorno de producción y reintroduce
configuración específica de cada máquina, que es justo lo que este change quiere eliminar.

## Migration Plan

No hay migración: el proyecto es nuevo y no hay datos ni usuarios. El orden de ejecución sí importa:

1. `git init` y commit inicial **antes** de instalar dependencias.
2. Resolver la exclusión de OneDrive.
3. Raíz del monorepo (workspace, Turbo, gitignore, plantilla de entorno).
4. `packages/config` y `packages/contracts`, en ese orden: el resto depende de ellos.
5. `apps/api`: configuración, errores, mensajes, módulo `health`.
6. `apps/web`: andamio, proxy de Vite, consumo de `health`.
7. `CLAUDE.md` al final, redactado sobre lo que realmente quedó construido y no sobre lo que se
   pensaba construir.

Reversión: borrar el directorio. No hay estado que preservar.

Criterio de terminado: ver los escenarios de las tres specs. Resumido — un clon limpio llega a
`GET /api/v1/health` respondiendo, quitar una variable del entorno impide arrancar, y el front
muestra el resultado de `health` usando un tipo importado del paquete de contratos.

## Open Questions

Deferibles sin afectar a las specs ni al desglose de tareas:

- Formato de log: texto legible o JSON estructurado. Se decidirá cuando haya un destino de logs real
  en el servidor; el identificador de incidente funciona igual con ambos.
- Si `packages/ui` llegará a existir como paquete separado o los componentes vivirán dentro de
  `apps/web`. Se resolverá cuando haya un segundo consumidor, y no antes.
- Puerto por defecto de la API en producción y nombre definitivo de la base de datos: son valores de
  configuración; cambiarlos no toca código.
- Si el catálogo de mensajes se organiza por módulo o por tipo de mensaje. Afecta a la ergonomía, no
  al contrato.
