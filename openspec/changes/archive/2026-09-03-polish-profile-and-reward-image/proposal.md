## Why

Cuatro huecos que no comparten módulo pero sí forma: **lo que el producto ya sabe hacer no está
donde quien lo usa lo busca**.

```
el niño            puede salir de su perfil, pero el botón está al final del inicio,
                   debajo de la rejilla de teselas. En «Mi perfil» —donde se busca— no hay nada.
el padre           abre su cuenta y no ve de quién es: ni nombre ni correo, teniendo los dos
                   YA en su actor. El niño sí tiene su tarjeta de identidad; el padre no.
el PIN             son diez botones y ni un manejador de teclado. En un portátil hay que
                   teclear cada dígito con el ratón, y el escritorio es un destino real
                   desde que el lateral se fija a partir de `lg`.
un premio          no admite foto al publicarlo, y sin foto no pinta NADA: el catálogo del
                   padre y el escaparate del niño salen con huecos donde debería haber algo.
```

Los tres primeros son de front puro. El cuarto es además el **cimiento de datos** de lo que viene
después —premios como productos de una tienda—, y por eso entra ahora y no con aquel rediseño: una
tienda cuyos productos no tienen imagen no es una tienda.

## What Changes

- **La salida del perfil del niño se pone donde se busca**: en «Mi perfil», que es la pantalla que
  responde a «esto es mío». Sigue estando en el inicio, porque es donde su gemela está en el inicio
  del padre.
- **La cuenta del padre dice de quién es**: nombre, correo y avatar, con la misma forma de tarjeta
  que el niño ya tiene en la suya. `parentActorSchema` ya trae los tres.
- **Y el padre elige su avatar con las mismas opciones que el niño**: el catálogo de animales además
  de subir una foto, con **la misma pieza** y no una copia. Ofrecía solo la foto porque no existía la
  pantalla donde eligiera ilustración; el contrato dejó escrito que ganaría ese campo cuando
  existiera, y existe. El avatar deja además de enseñarse **dos veces** en esa pantalla.
- **El PIN se teclea también con el teclado**: dígitos y retroceso, sin quitarle nada al teclado en
  pantalla, que sigue siendo la vía principal en una tablet.
- **Un premio puede llevar foto desde el alta.** Una vía de subida bajo el prefijo del padre y una
  clave opcional en el alta, confirmada como todas las demás.
- **Un premio sin foto tiene respaldo visible** —un glifo de regalo— en lugar del hueco de hoy.

## Capabilities

### Modified Capabilities

- `child-profiles`: la salida del perfil está en «Mi perfil», y no solo al final del inicio.
- `parent-authentication`: la cuenta del padre dice de quién es antes de dejar cambiar nada, y su
  avatar se elige del catálogo o subiendo una foto, sin repetirse en pantalla.
- `profile-selection`: el PIN se introduce con el teclado físico además de con el de pantalla.
- `rewards`: la foto entra en el alta —el requisito vigente dice justo lo contrario—, y un premio sin
  foto se dibuja con un respaldo en vez de con un hueco.

## No incluye

- **El rediseño de la tienda.** Que los premios se vean como productos, las tareas como tarjetas y
  los canjes como una tabla de historial es un change posterior, dicho así a propósito. Este deja el
  dato —que un premio tenga imagen desde que nace— y no toca la forma de ninguna de esas tres
  pantallas más allá del respaldo que hoy falta.
- **La foto al CREAR un perfil de hijo.** Sigue aparcada, y este change **no la desbloquea de
  pasada**. Lo que sí deja es el precedente de su mitad fácil: cómo se sube una imagen para algo que
  todavía no existe cuando **hay actor**. Lo que aquella tiene y esta no es que su alta ocurre sin
  perfil activo, y ese es exactamente su problema sin resolver.
- **Cerrar sesión para el niño.** No es un olvido: cerrar sesión obliga a teclear correo y
  contraseña, que el niño no tiene. Un niño que cerrase sesión dejaría a la familia fuera hasta que
  apareciese el padre. Lo que se arregla es encontrar la salida que ya existe, no darle una nueva.
- **Borrar las imágenes huérfanas** de quien sube una foto y luego no publica el premio. Ya lo cubre
  una decisión cerrada: los objetos huérfanos no se borran y se acepta que el bucket crezca.

## Impact

- `packages/contracts`: `createRewardSchema` acepta `imageUploadKey` opcional, y
  `updateParentAvatarSchema` gana `avatar` con la regla de exclusión —que **deja de estar copiada**
  en `children.ts` y pasa a `avatar.ts`, que ya decía que el padre la usaría—.
- `apps/api/src/modules/rewards/`: una ruta de subida más —bajo el prefijo del padre, no del
  premio—, su política de prefijo y la confirmación en el alta. **Sin migración**: `Reward.image` ya
  existe desde `add-data-model`.
- **La lista cerrada de rutas de solo cuenta NO cambia.** El alta de un premio es `requireParent`, o
  sea que hay actor: la vía de subida no necesita conformarse con la cuenta, y el test de las cinco
  sigue en cinco.
- **Orden de rutas**: se creía que `/rewards/image/upload-url` tenía que ir ANTES que
  `/rewards/:rewardId`, por el tropiezo que documentan `/rewards/mine`, `/tasks/mine` y
  `/children/me`. **No es así** —distinto método y distinto número de segmentos— y se comprobó
  moviéndola al final sin que cayera ningún test. Corregido en la decisión 4 del design.
- `apps/api/src/modules/auth/`: el servicio del avatar del padre distingue las dos formas.
- `apps/web`: `ChildSettings`, `account.tsx`, `PinPad`, `RewardForm`, `RewardCatalog` y `MyRewards`,
  más `ParentAvatarScreen`. `AvatarPicker` se muda de `features/children/` a `features/profiles/`:
  no sabe qué es un hijo, y bajo `children/` era una etiqueta falsa en cuanto lo montó el padre.
- Cero cambios en el esquema de base de datos.
