## Context

Ver `proposal.md` para el porqué y `specs/` para los requisitos. Lo que este documento tiene que
establecer son cuatro restricciones del proyecto ya medidas, porque cada una descarta la solución
obvia:

1. **La esquina inferior derecha ya está ocupada.** `ui/Toast.tsx` usa `fixed bottom-0 right-0 z-50`
   — el **único** `z-50` del proyecto, escrito a mano. No hay tokens de apilado.
2. **Tailwind 4 no tiene espacio de nombres de z-index.** Sus namespaces de tema son `--color`,
   `--container`, `--radius`, `--shadow`, `--ease`, `--animate`… Un `z-widget` **no** saldría de
   `@theme`. Verificado leyendo `tokens.css` y la versión instalada.
3. **No existe ninguna pieza colapsable.** Cero `<details>`, cero acordeón, y el único
   `aria-expanded` del proyecto es el botón de contraer el lateral. Radix instalado: diálogo,
   pestañas y avisos, nada más.
4. **El recorrido de bienvenida deja el documento inerte.** `Spotlight` es un Radix Dialog: mientras
   está abierto, todo lo demás queda marcado como oculto y teñido por el velo.

Y una del catálogo de mensajes que va a morder: el test que prohíbe cifras dentro de una cadena
**recorre los arrays** —`Object.entries` de un array da índices—, y unas preguntas frecuentes hablan
de edades y de dígitos de un PIN.

## Goals / Non-Goals

**Goals**

- Que llegar al chat no dependa de saberse una dirección.
- Que el orden de las capas flotantes se lea en un sitio, no abriendo dos componentes.
- Que las frases de la mascota no se conviertan en un mapa de veinte direcciones que nadie mantiene.
- Que la pieza colapsable la pueda usar la siguiente pantalla sin volver a pensar en accesibilidad.

**Non-Goals** (además de lo que excluye el proposal)

- Rediseñar la cabecera. Se extrae **un enlace**, no el armazón.
- Un sistema general de capas con nombre para todo. Dos pasos, los dos que existen.

## Decisions

### 1. El widget vive en `app/`, no en `ui/`

**Elegido**: `apps/web/src/app/MonedinWidget.tsx`.

No puede vivir en `ui/` y no es una preferencia: consulta la dirección actual y navega, y el test del
catálogo vivo prohíbe que `ui-catalog.tsx` monte `RouterProvider`. Una pieza de `ui/` con un enlace
dentro **rompe `ui.html`**. `app/` es literalmente la capa que «sabe de rol y de destinos pero no de
negocio».

Consecuencia buena y no obvia: al no exportarse de `ui/index.ts`, **no necesita —ni puede tener—
entrada en el catálogo vivo**, así que el test que exige una no se toca.

Recibe el rol y si ya se vio el recorrido **como props del marco**, que ya los sabe. Así no consulta
la sesión y se prueba montándolo suelto.

### 2. Una escala de apilado en `@theme`, como los colores

**Descartado**: `z-60` a mano en el widget. Es exactamente el número mágico que el proyecto prohíbe,
y un orden de apilado no es distinto de un color.

**Elegido**: dos entradas `--z-index-*` en `@theme`, capa 2, junto a los colores semánticos.

**ESTE DESIGN DECÍA LO CONTRARIO Y ERA FALSO.** Afirmaba que Tailwind 4 no genera utilidades de
z-index desde el tema y que por tanto había que declararlas a mano con `@utility`, como la capa 3.
La tarea 1.1 pedía comprobarlo antes de escribirlo, y al comprobarlo resultó que **sí las genera**:
`--z-index-sonda: 42` en `@theme` produce `.z-sonda{z-index:var(--z-index-sonda)}` en el CSS
compilado. `z-index` sí es uno de sus espacios de nombres.

Se corrige a la solución simple —que además es la que un lector espera— y la equivocación queda
escrita, porque la lección vale más que el resultado: **una precaución copiada de otro sitio hay que
comprobarla, no heredarla**. Es la misma que dejó `polish-profile-and-reward-image` al descubrir que
el orden de registro de una ruta que llevaba documentado en cuatro archivos era innecesario. La capa
3 se declara a mano por un motivo REAL y escrito —`text-balance` ya existe en Tailwind y significa
otra cosa—; suponer que ese motivo se extiende a todo lo demás es exactamente el error.

Lo que sí se conserva de la decisión original, porque no dependía de eso: los pasos se nombran por su
**papel** y no por su valor, igual que un color. El punto de uso pide «la capa del aviso», no un
número.

**El aviso emergente migra a la escala en este mismo change.** Si no, la escala nace mintiendo en la
mitad de sus entradas y el `z-50` a mano sigue ahí contradiciéndola.

**El orden**: el aviso **encima** del widget. Un toast que dice «tarea aprobada» tapando una mascota
decorativa es inofensivo; al revés esconde información. Se escribe en el token, no en un comentario.

### 3. El bocadillo cuelga del ÁREA, no de la dirección

**Descartado**: un objeto con una entrada por dirección. Se desincroniza en cuanto alguien renombra
una ruta y el typecheck no lo ve, que es el defecto que `fullBleed` ya evitó declarándose en la ruta
en vez de en un `if` sobre la URL.

**Elegido**: `areaOf(pathname)` por **prefijos**, y las frases en un `Record<FamilyRole, Record<Area,
…>>`.

Las dos mitades importan y por razones distintas:

- **Por prefijos**, `/me/tasks` y `/tasks` caen en la misma área, y una ruta nueva de un área existente
  hereda sus frases sin que nadie se acuerde. Un mapa por dirección exigiría acordarse.
- **El `Record` doble es el mecanismo**: un área nueva **no compila** hasta que los dos roles la
  cubren. Es la diferencia entre una regla que vive en un documento y una que se hace cumplir con una
  herramienta.

### 4. Con movimiento reducido, no rota

Un texto que cambia solo es movimiento, y del que peor sienta. Es la decisión que ya tomó el saldo que
cicla en la puerta pública.

**No vale bajar la duración**: el bloque de movimiento reducido del sistema deja las duraciones en un
instante, y eso convierte un cambio suave en un salto — peor para quien pidió no ver movimiento, no
mejor. Hay que **parar el temporizador**.

La preferencia se lee **de forma síncrona al inicializar el estado**, no en un efecto, para que el
primer pintado ya sea el correcto: exactamente como `app/use-wide.ts` hace con el ancho. Hermano
nuevo: `app/use-reduced-motion.ts`.

El realce del bocadillo al cambiar va bajo `motion-safe:`, y **siempre queda encendido algo que no es
movimiento**, para que el acceso nunca deje de responder.

### 5. No se monta durante el recorrido, y se apaga sin cablear estado

El problema: `features/tutorial` monta el recorrido desde las dos pantallas de inicio, y el marco no
sabe si está abierto. Pasarle una señal sería cablear estado entre dos capas que hoy no se hablan.

La salida es que **no hace falta**: el marco sí sabe `tutorialSeen`, que es la **misma condición** con
la que las pantallas de inicio deciden montarlo. Los marcos reciben ese dato —coherente con «un dato
del perfil viaja dentro del actor», que es como llegó ahí— y no montan el widget mientras sea falso.

Dos consecuencias, las dos correctas: quien salta el recorrido lo marca visto y el widget aparece; y
quien pide «verlo otra vez» desde ajustes lo pierde hasta cerrarlo.

**Tampoco en `/help`.** Ahí el pie ya dice «Pregúntale a Monedín», y dos enlaces con el mismo nombre
al mismo destino en la misma pantalla son ruido y un `getByRole` ambiguo esperando a morder a
cualquier test futuro. Lo decide la **misma función** que elige el bocadillo: si el área es la ayuda,
no hay nada que dibujar.

### 6. El colapsable: se añade Radix, no se escribe a mano

**Elegido**: una entrada más del proveedor de accesibilidad que el sistema ya usa.

1. **Es la regla que el proyecto ya escribió**: «Radix solo donde la accesibilidad no se improvisa
   (diálogo, pestañas, avisos)». Un acordeón es exactamente eso — el estado anunciado, la relación
   entre el control y su región, el recorrido con flechas y con inicio y fin. Escrito a mano son cinco
   detalles y cada uno se olvida una vez.
2. **La coherencia ya está comprada**: sería la única revelación del sistema que no viene del mismo
   proveedor.
3. **El coste es el más bajo posible**: mismo proveedor, misma versión mayor, mismo patrón de
   envoltura por tokens. No es una dependencia nueva de verdad.

**Descartado, con su porqué**: `<details>` y `<summary>` nativos. Cero dependencia y accesibles de
fábrica, lo que es un argumento serio. Se descartan porque **no se animan de forma consistente entre
navegadores** y su marcador se estiliza de forma irregular — no por no poder controlar cuántas se
abren a la vez, que sí se resuelve con un poco de estado.

**Coste aceptado**: es pieza de `ui/`, así que **exige entrada en el catálogo vivo** o el test falla. Y
como guarda su aspecto en un `Record` de variantes, cuidado con el test de colores literales, que
escanea el archivo entero y no solo los `className`.

### 7. El icono de ayuda: se extrae el enlace, no la cabecera

**Elegido**: un componente pequeño con el enlace, junto a las demás piezas de `app/`, usado desde los
dos marcos.

**Descartado, y se dice para que no parezca un olvido**: extraer el `<header>` entero. Las dos
cabeceras difieren en el destino del avatar y en el fondo del padre, así que un `AppHeader` común
necesitaría props para las dos cosas y sería el mismo `if` mudado de sitio. Con un cuarto elemento
común valdrá la pena; hoy no.

**Un interrogante y no una «i»**: «información» es ambiguo, y este control lleva a preguntas.

### 8. `/help` y no `/faq`

Las rutas van en inglés. «faq» es jerga, y el destino puede crecer —una guía, un contacto— sin
renombrarse. El archivo de ruta monta el destino y no lo dibuja.

`requireActor`, como el chat: es el segundo destino compartido por los dos roles, y el primero lo
estrenó `add-family-assistant`.

### 9. La objeción a un destino que solo está en la cabecera, de frente

Un destino alcanzable solo desde la cabecera es **exactamente lo que `add-sidebar-nav` retiró**. Hay
que responderlo o esto se lee como una regresión.

Lo que lo salva: **la ayuda no es una sección del producto, es meta**. El cajón enumera dónde vive el
trabajo —tareas, premios, canjes, hijos—, y la ayuda no es un sitio donde se hace nada. El precedente
exacto es el avatar, que volvió a la cabecera **además** de estar en el cajón porque responde a otra
pregunta: «¿quién eres?». La ayuda responde «¿cómo funciona?».

Y por eso **no va también en el cajón**: eso sería un segundo destino ofrecido dos veces, y la
excepción declarada sigue siendo una sola. El requisito modificado de `app-navigation` lo escribe.

## Risks / Trade-offs

**El test de cifras en el catálogo va a fallar con las preguntas frecuentes** → Es el riesgo más
probable de todo el change, y es seguro, no hipotético: las respuestas hablan de edades y de dígitos
de un PIN. La salida ya existe y es `PIN_LABEL`: se componen una sola vez al final del catálogo desde
sus constantes. Va como tarea explícita, porque descubrirlo al final duele.

**Tocar `Toast` puede romper algo que ya funcionaba** → Es un cambio de una clase por otra con el
mismo valor. Lo cubre la batería del front, que monta el proveedor de avisos.

**Los marcos ganan una prop** → `tutorialSeen`. Añadir un campo obligatorio a un actor de prueba ya
rompió seis fixtures una vez; aquí es una prop de dos componentes, no del esquema, así que lo caza el
typecheck. Pero hay que revisar los tests que montan los marcos antes de tocarlos.

**El intervalo de rotación y las frases son números y textos de arranque** → No están medidos. Se
ajustan abriendo la aplicación, no con un test.

**Que las cuatro columnas y el acordeón quepan en la escala del niño a 390 px no lo prueba jsdom** →
No aplica CSS. Va como tarea de comprobación manual, con eso dicho, en vez de un test que aparente
cubrirlo.

## Migration Plan

Ninguna. No hay base de datos, ni API, ni contrato: es front y tokens.

Marcha atrás: retirar el widget de los dos marcos y el enlace de la cabecera deja el resto intacto.
`/assistant` y `/help` seguirían existiendo, alcanzables por dirección.
