## Context

El inicio del padre es hoy una lista de cinco enlaces. Los cinco están ya en la barra de su marco, en
todas las pantallas. No es que esté sin vestir: es que **no tiene contenido propio**.

Este change decide qué contenido merece. La respuesta sale del producto: el padre es la mitad
autorizadora del ciclo —el niño marca, el padre aprueba, y solo entonces se acreditan monedas—, así
que lo que le falta al abrir la aplicación es saber **si hay algo esperándole**.

Los datos existen. Lo que no existe es una forma segura de contarlos, y ahí está el peso técnico de
este change: la API del padre pagina las tareas por REPARTO, así que la cuenta obvia da un número
equivocado y no avisa.

Entra además `/account`, la última ruta con deuda, por la misma razón por la que «Mi perfil» del niño
entró con sus tareas: cuelga del avatar del marco, no pertenece a ningún área, y si no entra aquí no
entra en ningún sitio.

## Goals / Non-Goals

**Goals**

- Que el inicio del padre responda «¿hay algo que hacer?» sin abrir nada.
- Que las dos cifras sean **correctas**, y que la que no pueda serlo lo diga.
- Vestir `/account` y vaciar `routes` de la lista de deuda.
- Dejar el sitio donde `redesign-parent-tasks` y `redesign-parent-children` encajarán después.

**Non-Goals**

- Aprobar o rechazar desde el panel. Resolver es de la bandeja.
- Tocar la API. Ni un endpoint, ni un contrato, ni una migración.
- Vestir los listados del padre —tareas, premios, canjes, hijos—. Son tres changes propios.
- El historial de monedas. Es `add-coin-history`.
- `ResetPinScreen`, que sigue en la lista de deuda: es la vía de rescate y se abre sin sesión, así
  que su sitio es con el resto de la puerta de entrada y no con la cuenta.

## Decisions

### 1. Panel de lo que espera, no atajos vestidos

Se consideró vestir los cinco enlaces como tarjetas, igual que se hizo con el inicio del niño. Se
descarta: la simetría sería falsa. El niño tiene cuatro destinos y **su marco es una barra inferior
de iconos**, así que su inicio añade algo —su saldo en grande, y objetivos del tamaño de un dedo—. El
padre tiene los mismos destinos escritos con palabras en la cabecera de todas las pantallas; unas
tarjetas serían el mismo menú dos veces, más grande.

El vocabulario del proyecto ya lo decía sin que nadie lo cobrara: `messages.nav.parentHome` vale
**«Panel»**, no «Inicio». La barra del padre lleva meses prometiendo un panel.

### 2. La cuenta de tareas es la trampa de este change

`GET /tasks?status=COMPLETED` **no** responde lo que parece. Dos cosas, y las dos son deliberadas:

```
lo que se devuelve                       por qué
──────────────────                       ───────
total = número de REPARTOS               la unidad de paginación del listado del
                                         padre es el reparto (paginación por
                                         grupo, CLAUDE.md §8)

las filas del reparto vienen ENTERAS,    el padre quiere ver el reparto completo
sin el filtro de estado aplicado         aunque solo una tarea esté para aprobar
                                         (decisión 5 del design de add-tasks)
```

Las dos cuentas obvias fallan, en direcciones opuestas:

```
un reparto: «Recoger la mesa» → Ana (COMPLETED), Luis (COMPLETED), Sara (PENDING)

  data.total                  → 1    ✗  hay DOS niños esperando
  items.flatMap(b => b.tasks) → 3    ✗  Sara no ha hecho nada todavía
  filas con status COMPLETED  → 2    ✓
```

Se cuenta la tercera. Y se cubre con un test de **un reparto de estados mezclados**, que es el único
que falla contra las otras dos: un test con un reparto de una sola tarea completada da `1` de las
tres maneras y no prueba nada. Esa lección costó una vez en `redesign-child-shop` —un test que no
falla ante la violación que persigue no prueba nada— y aquí se aplica de entrada.

### 3. La cuenta de canjes SÍ es el `total`, y la asimetría se explica

`GET /redemptions?status=PENDING` pagina por fila. Su `total` es exactamente la cifra buscada, así
que se pide con `pageSize: 1` y se lee `total` sin traer ni un canje.

Dos cifras del mismo panel obtenidas de dos maneras distintas parece una incoherencia y no lo es: es
que las dos listas tienen unidades distintas porque sus pantallas tienen unidades distintas. Se anota
en el código, junto a las dos llamadas, porque el próximo que lea el panel va a querer unificarlas.

### 4. El techo de la cuenta de tareas se declara con un `+`

Las tareas hay que traerlas para contarlas, así que se piden con `pageSize: MAX_PAGE_SIZE`. Si aun
así hay más páginas, lo contado es un **mínimo**, y entonces la cifra se presenta como `100+`.

Alternativas descartadas:

- **Añadir un endpoint de conteo a la API.** Correcto siempre, y desproporcionado: esta etapa entera
  no ha tocado el servidor, y sería un endpoint nuevo cuyo único consumidor es un número.
- **Enseñar el número recortado sin marca.** Es la peor: un panel que dice 100 cuando son 130 no se
  nota nunca, y el error crece justo con las familias que más lo necesitan.
- **No dar número, solo «hay tareas por aprobar».** Pierde lo único que hacía útil al panel.

El coste declarado: traer hasta cien repartos con sus filas para enseñar un número. Para una familia
son decenas de filas; el design de `add-tasks` ya declaró el rendimiento de ese listado fuera de
objetivos por la misma razón.

### 5. Los saldos son exactos, y esa exactitud se ata con un test

`MAX_CHILDREN_PER_FAMILY` es 10 y `DEFAULT_PAGE_SIZE` es 20, así que una sola página trae siempre a
toda la familia. Es una coincidencia afortunada entre dos constantes que nadie ha relacionado nunca,
y de las que se rompen en silencio: subir el máximo a 25 dejaría al panel escondiendo hijos sin que
fallara nada.

Se ata con un test que compara las dos constantes. Es la regla 2 del proyecto aplicada a una
suposición que, si no, viviría solo en este párrafo.

### 6. El panel no decide el destino de cada hijo

Las filas de saldo **no** son enlaces. Adónde lleva pulsar a un hijo —a editarlo, a sus tareas, a su
historial— es una decisión de `redesign-parent-children` y de `add-coin-history`, y elegirla aquí
sería fijarla desde la pantalla que menos sabe. El bloque entero lleva a `/children`.

### 7. Cerrar sesión se muda a la cuenta; cambiar de perfil se queda

Hoy están las dos en el inicio, del mismo tamaño y una al lado de la otra. Se parecen y no lo son:
cambiar de perfil devuelve a la rejilla, ocurre varias veces al día y no pide credenciales para
volver; cerrar sesión obliga a teclear correo y contraseña. Juntas e iguales es como un padre acaba
tecleando su contraseña porque quería pasarle la tablet a su hijo.

Cambiar de perfil se queda en el inicio, que es donde está su gemela en el inicio del niño.

### 8. `/account`: una pantalla con dos partes, y una sola salida

Las dos piezas se montan dentro de `Card`, los errores pasan a `Alert` —hoy son
`<p style={{ color: "#b00020" }}>`, el mismo literal repetido en dos archivos—, y los **tres** enlaces
de «Volver» se quedan en cero: el logo del marco ya lleva al inicio y es la salida que el padre usa
en todas las demás pantallas.

Esto vacía `routes` de la lista de deuda. `account.tsx` es hoy la **única** de las veintidós rutas con
estilo en línea, comprobado buscando en el directorio entero.

### 9. Dónde vive el panel

En `apps/web/src/features/parents/`. No en `features/auth/`, donde `ParentHome` aterrizó de paso
cuando se le sacó del archivo de ruta: el panel habla de tareas, canjes e hijos, y ninguna de esas
cosas es autenticación. La carpeta la heredarán los dos changes del padre que faltan.

`ParentAvatarScreen` y `ChangePinScreen` **se quedan** en `features/auth/`: cambiar el PIN de adulto
sí es autenticación.

## Risks / Trade-offs

- **El panel hace tres peticiones al abrirse.** Las tres son listados que el padre iba a pedir de
  todos modos en cuanto navegase, y TanStack Query las comparte por clave, así que el coste real es
  la primera visita. Se piden con las mismas claves que usan los listados para que la caché sirva.
- **La cuenta de tareas viaja más datos de los que enseña.** Declarado y aceptado en la decisión 4.
- **Un panel puede envejecer.** Las cifras se invalidan con las mismas claves que ya invalidan
  aprobar una tarea y resolver un canje, así que aprobar desde la bandeja actualiza el panel sin
  código nuevo. No se añade refresco por tiempo.
- **`/account` pierde sus enlaces de vuelta.** Si algún día el marco del padre dejara de tener logo,
  esa pantalla se quedaría sin salida visible. Hoy lo tiene y es la salida de todas las demás.

## Migration Plan

Sin migración: no hay datos, ni contratos, ni direcciones que cambien. `/` y `/account` siguen
existiendo con el mismo nombre y las mismas guardas.

## Open Questions

Ninguna que bloquee. Queda anotado para `redesign-parent-children`: adónde lleva pulsar un hijo.

## Decisiones que este change NO toma

- **Qué enseña la bandeja de tareas por dentro.** Es `redesign-parent-tasks`.
- **Si el panel debería enseñar también algo de premios.** Un premio no espera por nadie: no hay
  bandeja que atender ahí, y meterlo por simetría sería llenar el panel de cosas que no piden nada.
- **Refresco automático.** Si un padre y un hijo usan la tablet a la vez, el panel se queda como
  estaba hasta que se navega. Se mira cuando haya alguien a quien le moleste.
