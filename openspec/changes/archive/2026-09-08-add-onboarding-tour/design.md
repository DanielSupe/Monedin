## Context

Ver `proposal.md` — Why. Lo que condiciona el cómo:

- `ui/Dialog.tsx` monta Radix con un velo `fixed inset-0 bg-ink/40` y una tarjeta centrada. Su
  cabecera advierte que el foco atrapado, el Escape, el resto inerte y el anuncio por título «no se
  escriben bien a mano, y lo peor es que roto no se nota hasta que alguien lo necesita de verdad».
- El actor sale de `GET /auth/session` y lo arma `auth.service`. `parentActorSchema` y
  `childActorSchema` ya llevan nombre, avatar y —el del niño— saldo.
- `useRefreshSession()` invalida la sesión **y el router**, en un solo sitio. Navegar desde el
  `onSuccess` de una mutación no funciona: al cambiar la sesión la raíz cambia de marco y desmonta
  quien llamó a `mutate`.
- El proyecto prohíbe `style` en línea salvo en tres archivos declarados en `eslint.config.js`.
- La puerta pública ya usa `explica.png`; las otras diecinueve ilustraciones están sin usar.

## Goals / Non-Goals

**Goals:**

- Que quien entra por primera vez sepa qué está viendo, con su propio guion según el rol.
- Que «ya lo vio» sobreviva al dispositivo.
- Que se pueda salir, y volver.
- Reutilizar la accesibilidad del diálogo en vez de reescribirla.

**Non-Goals:**

- Un sistema de tutoriales por pantalla. Esto cubre los dos inicios.
- Que el recorrido deje usar lo que ilumina.

## Decisions

### 1. «Ya lo vio» vive en el servidor, DENTRO del actor

Dos columnas anulables, `tutorialSeenAt`, una en `User` y otra en `ChildProfile`. El actor expone un
**booleano**, no la fecha: quien pregunta decide con un sí o un no.

Va dentro del actor y no por un camino aparte por el precedente exacto que el proyecto ya pagó: el
avatar del padre estuvo fuera, y `add-file-storage` lo metió dentro porque era «el mismo dato en dos
sitios comportándose distinto». Un segundo camino trae su propia caché, y una caché puede separarse.

**Alternativa descartada: el almacenamiento del navegador.** Cero API, y tres precios. El padre que
usa la tablet y su teléfono lo vería dos veces; limpiar el navegador lo devolvería a toda la familia;
y sería la primera vez que el proyecto usa almacenamiento del navegador — `ParentShell` renunció a
guardar el lateral contraído justo por eso.

**La columna es `DateTime?` y no `Boolean`.** No cuesta más y responde una pregunta que un booleano
no puede: cuándo. El día que alguien quiera saber si el recorrido nuevo lo vio gente antes o después
de cambiarlo, el dato está. Lo que no sale por la API es la fecha.

### 2. UNA ruta para los dos roles, con la rama en el servicio

`PATCH /auth/tutorial` con `{ seen }`, exigiendo actor.

Una sola por lo mismo que `POST /auth/profiles/enter` sirve al padre y a los hijos: «tener dos
endpoints invitaría a proteger uno y olvidarse del otro». Y la rama por rol vive en el **servicio**,
no en el controlador, que es el precedente de `getRewardForActor` — un `if` sobre el rol en la capa
de HTTP está en la capa equivocada.

Marcar visto es **idempotente**: no mueve dinero ni cambia de estado, así que dos toques dejan lo
mismo. No hay transición condicional que proteger aquí, y decirlo evita que alguien copie el patrón
de aprobar donde no hace falta.

`{ seen: false }` es el «verlo otra vez» de los ajustes. Un solo campo en vez de dos rutas.

### 3. La pieza se apoya en Radix, y el agujero es una SOMBRA

```
   Dialog (existe)              Spotlight (nuevo)
   ───────────────              ─────────────────
   velo que tapa todo           velo con un agujero
   tarjeta centrada             panel junto a lo destacado
```

Se montan las primitivas de Radix directamente —`Root`, `Portal`, `Content`— con el velo del propio
Radix **transparente**, y el atenuado lo pinta la pieza. Así el foco atrapado, el Escape y el resto
inerte vienen de donde ya funcionan.

Que el resto quede **inerte** no es un efecto colateral que haya que sortear: es lo que la spec pide.
Lo que se pulsa es «seguir», nunca el elemento iluminado.

**El agujero se pinta con una sombra proyectada, no con un recorte.** Una caja colocada sobre el
elemento con un `box-shadow` enorme y opaco tiñe todo lo de fuera y deja limpio lo de dentro. Sin
máscaras, sin SVG, sin recalcular una silueta: mover la caja mueve el agujero.

**Alternativa descartada: cuatro rectángulos alrededor del hueco.** Funciona y son cuatro cajas que
mantener sincronizadas en cada medida, con una costura visible en las esquinas.

### 4. La cuarta excepción de estilo en línea, y por qué se acepta

La posición y el tamaño del hueco salen de `getBoundingClientRect` en ejecución. No hay token que
exprese «donde está esa tarjeta ahora mismo», igual que no lo hay para el ancho de `ProgressBar` ni
para el radio de una órbita.

Se declara en `eslint.config.js` con su porqué y **acotada a `ui/Spotlight.tsx`**. Toda la geometría
se concentra ahí para que la excepción cubra lo mínimo, que es la regla que las otras tres siguen.

### 5. Las anclas viven en las pantallas de inicio, y solo ahí

Cada paso nombra un ancla; las pantallas la declaran con un atributo de datos. **Ninguna apunta a la
navegación**: en estrecho está detrás de un botón, así que la mitad de las veces el objetivo no
existiría y el paso se quedaría sin foco justo en el dispositivo más probable.

**Un ancla que no aparece no rompe el paso.** Se muestra centrado y sin foco. Es lo que hace que el
recorrido funcione en una cuenta recién creada — que es exactamente cuando se ve: un padre sin hijos
no tiene filas que iluminar, y ahí el paso que explica dónde aparecerán es más útil que nunca.

### 6. Quién lo monta

Cada pantalla de inicio monta el suyo, porque cada una conoce sus anclas. El archivo de ruta sigue
montando el destino y no dibujándolo.

Al marcar visto se llama a `useRefreshSession()`, que invalida la sesión y el router en un solo
sitio. Es el mecanismo que ya existe, y navegar desde el `onSuccess` no funcionaría: al cambiar la
sesión la raíz cambia de marco y desmonta a quien llamó.

## Risks / Trade-offs

- **Una migración** → Dos columnas anulables, sin restricciones nuevas. Aun así hay que revisarla a
  mano: Prisma no conoce los `CHECK` ni el disparador que instaló la inicial, y una migración
  generada puede llevárselos por delante.
- **Una excepción más de estilo en línea** → Cuatro es más que tres, y cada una debilita la regla. Se
  acepta con su porqué escrito y acotada a un archivo. La alternativa era meter en los tokens
  utilidades que dependen de dónde está una tarjeta en pantalla, que no es una medida del sistema.
- **El foco se mide, así que puede quedarse desfasado** → Se vuelve a medir al cambiar de paso y al
  cambiar el tamaño de la ventana. Que quede perfecto al desplazar mientras el recorrido está abierto
  no es un caso real: el resto está inerte y no hay nada que desplazar.
- **Cinco pasos por rol** → Con salida desde el primero. Un recorrido del que no se puede salir es
  una pantalla que no deja pasar.

## Migration Plan

Una migración de dos columnas `DateTime?`. Los perfiles existentes las tienen a nulo, así que **verán
el recorrido la próxima vez que entren** — que es lo correcto: nunca se les explicó.

## Decisiones que este change NO toma

- **Si hace falta recorrido en otras pantallas.** El mecanismo queda; el contenido sería otro change.
- **Si el padre debería poder reiniciar el recorrido de un hijo.** Hoy cada quien reinicia el suyo, y
  el padre puede hacerlo entrando al perfil del hijo, que ya sabe hacer.
- **Si el recorrido debería adaptarse a lo que hay en pantalla** —saltarse el paso de los hijos
  cuando no hay ninguno—. Hoy se muestra igual y sin foco, porque ese es el caso en que más falta
  hace.
