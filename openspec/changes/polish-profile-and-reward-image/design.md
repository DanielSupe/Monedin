## Context

Ver `proposal.md` — Why. Lo que este documento añade es el estado del código que condiciona cada
decisión:

- `LeaveProfile` ya existe, funciona y **no navega**: salir pone el actor a nulo y la guarda de la
  ruta reevaluada manda sola a la rejilla. Colocarla en otro sitio no exige tocarla.
- `parentActorSchema` ya lleva `name`, `email` y `avatar`. El dato está en el cliente desde que se
  entra al perfil.
- `Keypad` no tiene ningún `<input>`: son diez `<Button>` y un `useState`. El PIN se envía **solo**
  al alcanzar `PIN_LENGTH` y al fallar se limpia.
- La imagen de un premio se sube a `POST /rewards/:rewardId/image/upload-url` y se confirma con
  `imageUploadKey` en el `PATCH`. El prefijo lo decide el módulo y lleva dentro el `rewardId`.
- Un premio sin imagen no dibuja nada: la condición `reward.image !== null` en `MyRewards` y en
  `RewardCatalog` deja el hueco.

## Goals / Non-Goals

**Goals:**

- Poner la salida del niño donde se busca sin duplicar un destino de navegación.
- Que la cuenta del padre diga de quién es sin añadir ni un campo a la API.
- Aceptar el teclado en el PIN sin quitarle nada al teclado en pantalla.
- Que un premio pueda llevar foto desde el alta **sin abrir la puerta que quedó aparcada**.

**Non-Goals:**

- Rediseñar el catálogo ni el escaparate. El respaldo tapa un hueco, no reordena una pantalla.
- Tocar `updateRewardSchema`. La vía de editar sigue igual, y las dos conviven.
- Mover a su sitio definitivo la imagen subida antes de publicar. Ver la decisión 3.

## Decisions

### 1. La salida va en «Mi perfil» ADEMÁS del inicio, y no en su lugar

Las dos salidas hacen lo mismo y eso no las convierte en una repetición que haya que resolver: es la
misma forma que ya tiene el padre, con `LeaveProfile` en su inicio y `SignOut` en su cuenta.

**Y no contradice «ningún destino dos veces».** Esa regla habla de **destinos** —sitios a los que se
va— y salir no lo es: es una acción sobre la sesión, sin dirección propia, que además ni siquiera
navega. El test que enumera los destinos del marco cuenta enlaces del lateral y del cajón, y un botón
no entra en esa cuenta.

**Alternativa descartada: moverla, no duplicarla.** Dejaría el inicio del niño sin salida y el del
padre con la suya, que es una asimetría peor que la que se arregla: los dos inicios son gemelos a
propósito.

**Alternativa descartada: meterla en el marco, junto al avatar.** Sería un control permanente en
pantalla para una acción que se hace una vez por sesión, y en el marco del niño compite con cuatro
destinos que sí se usan a diario.

### 2. La identidad del padre sale del actor, no de una petición nueva

`useSession()` ya trae el actor con nombre, correo y avatar. No hace falta endpoint, ni hook, ni
estado de carga propio: la pantalla ya está detrás de `requireParent`, así que cuando se pinta el
actor existe y es de padre.

**Alternativa descartada: un `GET /auth/me`.** Sería un segundo camino al mismo dato, con su propia
caché que puede separarse de la del actor. Justo lo que `add-file-storage` corrigió al meter el
avatar del padre dentro de su actor, para que no fuera «el mismo dato en dos sitios comportándose
distinto».

**El correo se enseña entero.** Enmascararlo protegería de quien mira por encima del hombro, pero lo
que la pantalla responde es «¿en qué cuenta estoy?», y un correo con asteriscos no lo responde. Es la
pantalla que solo se abre tras teclear el PIN de adulto.

### 3. Para publicar con foto, la clave cuelga del PADRE

El problema es el conocido: la clave incluye el identificador de lo que todavía no existe.

```
   Editar un premio               Publicar un premio con foto
   ────────────────               ───────────────────────────
   rewards/{rewardId}/…           rewards/pending/{userId}/…
   el premio ya existe            el premio no existe todavía,
                                  pero el PADRE sí
```

Publicar un premio es `requireParent`: **hay actor**, así que hay a quién atribuir la clave. La vía
nueva se conforma con lo mismo que ya exige el alta, y por eso **la lista cerrada de rutas de solo
cuenta no se toca**: sigue en cinco y su test sigue pasando sin editarlo. Eso es lo que separa este
caso del aparcado, donde el alta ocurre **sin perfil activo** y la vía de subida tendría que ser una
sexta ruta de solo cuenta.

La confirmación es la de siempre, `isConfirmableUpload`, contra el prefijo del padre: prefijo **y**
existencia, las dos juntas. Solo el prefijo dejaría guardar una referencia a algo que nunca se subió;
solo la existencia dejaría publicar con la imagen de otro padre, que sí existe.

**La imagen NO se mueve a `rewards/{rewardId}/` después de crear el premio.** Se guarda la clave tal
cual. Lo que se persiste es una clave y las URL de lectura se firman al serializar, así que dónde
viva el objeto no cambia nada de lo que se ve. Copiarla exigiría una operación de copia en
`StorageProvider`, que hoy no existe, para arreglar algo que no está roto. La consecuencia que sí hay
que saber: **el prefijo de una clave deja de identificar al premio dueño**, y por eso el prefijo solo
se usa donde siempre se usó —al confirmar, contra quien está subiendo— y nunca para deducir de quién
es una imagen ya guardada.

**Alternativa descartada: dos momentos**, publicar y aterrizar en la edición del premio. Cero API,
pero convierte «publicar un premio con su foto» en dos pantallas y un viaje, y deja el alta siendo la
única forma de crear algo incompleto a propósito.

**Alternativa descartada: subir el binario en el alta.** Contradice la regla de que el binario nunca
pasa por la API.

### 4. El orden de las rutas es parte del diseño, no un detalle

`/rewards/image/upload-url` tiene que registrarse **antes** que `/rewards/:rewardId`. Al revés,
`image` entraría por `:rewardId`, el servicio buscaría un premio con ese identificador y la respuesta
sería un 404 — **perfectamente plausible**, que es lo que hace el fallo silencioso. Es el mismo
tropiezo que ya llevan comentado y con test `/rewards/mine`, `/tasks/mine` y `/children/me`, y lleva
el suyo por la misma razón.

### 5. El teclado se escucha en el documento, no en un campo oculto

No se añade ningún `<input>`. Un campo invisible tendría que llevar el foco para recibir teclas, y
robárselo a los botones rompe recorrer el teclado en pantalla con el tabulador; hacerlo `sr-only`
además se alcanza tabulando y no se ve, que es el error que `redesign-child-tasks` ya documentó con
el `input[type=file]`.

Se escucha en el documento mientras el teclado de PIN está montado. La pantalla no tiene ningún otro
sitio donde escribir, así que no hay nada a lo que robarle una tecla.

**Se reutiliza la misma función que ya usan los botones.** Digitar y pulsar tienen que ser el mismo
camino, no dos que hagan lo mismo: si fueran dos, el día que uno cambie —la longitud del PIN, el
envío automático— el otro se queda atrás en silencio.

De ahí salen tres condiciones, y las tres ya están resueltas dentro de esa función: no admite más
dígitos con el PIN completo, no cuenta como intento borrar, y no envía dos veces. La única que hay
que añadir es **ignorar el teclado mientras el envío está en curso**, que es lo que en pantalla hace
el `disabled` de los botones.

### 6. El respaldo es un glifo, y esta pantalla no decide cuál

Un premio sin foto dibuja un glifo de regalo en el sitio de la imagen, con las mismas medidas, para
que una fila de premios no se descuadre según quién tenga foto.

Va con `aria-hidden`: no aporta nada que el título del premio no diga ya, y anunciar «regalo» delante
de cada premio sin foto es ruido para quien lo escucha. Es la misma decisión que las teselas del
inicio del niño.

**El respaldo NO se resuelve en la API.** El servidor sigue diciendo que no hay imagen, que es la
verdad; lo que se dibuja cuando no la hay es una decisión de la interfaz. Devolver una imagen de
relleno desde el servidor obligaría a distinguir después «no tiene foto» de «tiene esta», que es
exactamente lo que hoy se sabe gratis.

## Risks / Trade-offs

- **Imágenes huérfanas de quien sube y no publica** → No se borran, por decisión ya cerrada: un
  borrado sin transacción distribuida es siempre a mejor esfuerzo, y equivocarse borrando pesa más
  que guardar de más con este volumen. Lo nuevo es que ahora hay un caso **fácil** de producir
  —elegir foto y cancelar—, así que se dice en la spec en vez de dejarlo implícito.
- **Un oyente de teclado en el documento** → Solo mientras el teclado de PIN está montado, y esa
  pantalla no tiene ningún otro campo. Se limpia al desmontar.
- **La clave publicada se queda bajo el prefijo del padre** → Aceptado en la decisión 3, con la
  consecuencia escrita: el prefijo no identifica al premio dueño y no se usa para eso.
- **Cuatro arreglos en un change** → Comparten el porqué pero no el código, y ninguno depende de
  otro. El riesgo real es que el de la API se lleve el tiempo y los tres de front entren sin sus
  tests; por eso las tareas ponen cada test junto a lo suyo y el del alta con foto va con el resto de
  la API, no al final.

## Migration Plan

Sin migración: `Reward.image` existe desde `add-data-model`. Los premios ya publicados sin foto no
cambian, y el respaldo los dibuja sin tocar ni una fila.

## Decisiones que este change NO toma

- **La foto al crear un perfil de hijo.** Aparcada, y no la desbloquea de pasada: lo que la bloquea
  no es cómo se nombra una clave sin dueño —eso lo resuelve la decisión 3— sino que su alta ocurre
  sin perfil activo.
- **Si el escaparate y el catálogo pasan a rejilla de productos.** Change posterior, dicho por quien
  lo pidió.
- **Si hay que recoger alguna vez las imágenes huérfanas.** Se mira cuando exista un bucket de verdad
  con datos de verdad, no antes.
