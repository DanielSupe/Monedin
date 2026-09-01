## Context

Últimas cuatro pantallas de la lista de deuda que se pueden vestir: el listado de perfiles, el
formulario que sirve para el alta y la edición, y las dos que lo envuelven.

Al mirarlas aparecen tres cosas que no son andamio, y una de ellas importa más que el aspecto: **la
acción menos reversible del producto se confirma con menos ceremonia que la más reversible**. Dar de
baja un perfil —que no se deshace— pregunta con un párrafo y dos botones; retirar un premio —que se
revierte publicándolo otra vez— abre un `Dialog` desde `redesign-parent-authoring`.

## Goals / Non-Goals

**Goals**

- Vestir las cuatro y dejar la lista de deuda en una sola entrada.
- Que la baja se confirme como lo que es.
- Que el bloqueo se lea como estado y no como error.
- Retirar la cuarta y última copia de la paginación.

**Non-Goals**

- **Subir foto al crear un perfil.** Aplazada a conciencia, con dueño. Ver la decisión 4.
- **Unificar la edición de un hijo con la de un premio.** Ver la decisión 3.
- **Tocar la API.** Ni un endpoint.
- **`ResetPinScreen`**, que se abre sin sesión y va con la puerta de entrada.

## Decisions

### 1. La baja va a `Dialog`, y el argumento es la asimetría

```
                     hoy se pregunta con...        ¿se puede deshacer?
retirar un premio    Dialog                        sí, publicándolo otra vez
dar de baja un hijo  <p role="alert"> + 2 botones  NO
```

Está al revés. Un diálogo atrapa el foco, cierra con Escape y deja inerte el resto del documento;
dos botones sueltos dentro de la fila dejan una acción destructiva a un toque de la fila de al lado,
en una tablet que se usa con el dedo.

No se toca el texto de confirmación, que ya dice lo que hay que decir —que el perfil deja de aparecer,
que no se recupera y que su historial de monedas se conserva—. Lo que cambia es dónde se lee.

### 2. Bloqueado es ADVERTENCIA, no peligro

Hoy es `<span style={{ color: "#b00020" }}>` dentro de una frase. Pasa a `Badge tone="warning"`.

El tono no es decoración: estar bloqueado significa que ese niño falló el PIN varias veces. No es una
avería ni una culpa de nadie, y el rojo lo diría. Es el mismo criterio con el que un canje rechazado
va en ámbar y con el que un 409 no se pinta como un error.

Y el tono acompaña al texto, nunca lo sustituye — la etiqueta sigue diciendo «Bloqueado».

### 3. El hijo se sigue editando en su ruta, y el premio en línea. NO es una incoherencia

`redesign-parent-authoring` dejó esta pregunta anotada para aquí, así que se responde en vez de
heredarla:

```
editar un premio                    editar un hijo
────────────────                    ──────────────
subir un precio, cambiar la foto    nombre, edad, avatar, y el PIN aparte
retoque pequeño y frecuente         se hace una vez y casi no se vuelve
cabe en la tarjeta que ya se ve     no cabe: es un formulario entero
```

No son el mismo gesto con dos implementaciones: son dos gestos de tamaño distinto. Lo que sí sería
incoherente es que el mismo tipo de edición se hiciera de dos maneras, y no ocurre.

**Queda cerrado**: no se reabre sin un argumento nuevo sobre el tamaño de cada edición.

### 4. La foto al crear: aplazada OTRA VEZ, pero con dueño y con un dato nuevo

`CLAUDE.md` la lleva anotada desde `add-file-storage` con la instrucción explícita de no resolverla de
pasada. Se decidió aplazarla, y aplazar bien significa dejarla mejor de lo que estaba:

**El dato que faltaba**: todos los endpoints de subida del proyecto —cinco— cuelgan del identificador
de una entidad que ya existe. No hay ninguno bajo el prefijo del padre. Así que:

- el camino de **dos momentos** no necesita API, pero **no sirve desde la rejilla**: esa alta se hace
  sin perfil activo y la pantalla de edición exige ser el padre;
- el camino de **un solo momento** funciona en los dos sitios y exige un endpoint nuevo, un
  `avatarUploadKey` en el alta y una política para las fotos de quien sube y luego no crea. Sería el
  **primer cambio de API de toda esta etapa**.

Deja de estar flotando: pasa a ser un change propio, después de que la lista de deuda quede vacía.

### 5. La cuarta copia de la paginación

`Pagination` nació en `redesign-parent-inbox` con dos consumidores y la adoptaron el catálogo y las
dos bandejas. Esta es la última pantalla que la reescribía a mano. Al terminar, la pieza tiene todos
sus consumidores y no queda ninguna copia.

### 6. Reponer el PIN pasa a ser un formulario

Es la misma regla que `redesign-parent-authoring` aplicó a las tres pantallas de escritura, aplicada
al último sitio donde queda un campo suelto con un botón al lado.

## Risks / Trade-offs

- **`ChildForm` sirve al alta y a la edición**, y se toca entero. Sus dos usos están cubiertos por
  tests desde `redesign-parent-authoring` —la salida por enlace— y se añade el resto.
- **`CreateProfileScreen` se usa SIN actor**, desde la rejilla, y lleva `EntryShell`. Vestirla no
  puede asumir el marco del padre: es la única de las cuatro que vive en los dos lados.
- **La lista de deuda queda con una entrada**, así que el bloque de excepciones sigue existiendo por
  un solo archivo. Se borra entero en `redesign-reset-pin`.

## Migration Plan

Sin migración: mismas direcciones, mismas guardas, mismos contratos.

## Open Questions

Ninguna que bloquee.

## Decisiones que este change NO toma

- **Cuándo y cómo se sube una foto al crear.** Change propio, decisión 4.
- **Si el bloque de deuda se borra ya.** Queda una entrada; lo borra quien se la lleve.
