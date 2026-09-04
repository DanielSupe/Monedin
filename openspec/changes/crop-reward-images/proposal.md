## Why

**La foto de un premio se sube tal como venga, y desde ayer eso se ve.**

`redesign-child-surfaces` puso el escaparate en rejilla. Una rejilla con imágenes de proporciones
distintas no es una rejilla: cada tesela crece o mengua según la foto que le tocó, y la fila queda
dentada. La misma foto que en una lista de una columna no molestaba, ahora descuadra a su vecina.

Recortar existe ya y funciona: es lo que hacen los avatares. Lo que falta es que el premio lo use.

**Y hay un obstáculo que no se ve hasta tocarlo.** En `ImageUploadField`, la prop `aspect` decide
**dos cosas a la vez**:

```
   aspect definido  ->  monta el recortador   Y   prepareImage({ forAvatar: true })
                                                        ->  AVATAR_MAX_DIMENSION = 512 px
   aspect ausente   ->  solo comprime         Y   PHOTO_MAX_DIMENSION = 1280 px
```

Así que pasarle `aspect` a un premio **también le encogería la foto a tamaño de avatar**: 512 px para
una tesela que ocupa media tablet. Las dos decisiones —qué forma tiene la imagen y cuánto detalle
guarda— son independientes y hoy viajan en la misma prop. Separarlas es el trabajo de verdad.

## What Changes

- **La foto de un premio se recorta al elegirla**, con el mismo recortador de los avatares, a
  proporción cuadrada.
- **Se separa la forma del tamaño**: recortar y cuánto detalle guardar dejan de ser la misma prop.
  Un premio recorta **y** conserva la resolución de foto.
- **La tesela del escaparate y la del catálogo pasan a una caja de proporción fija**, que es lo que
  el recorte hace posible: sin fotos dispares, ninguna fila se descuadra.
- **Se reescribe la decisión que decía lo contrario** en `ImageUploadField`, con el argumento nuevo.

## Capabilities

### Modified Capabilities

- `file-storage`: recortar y redimensionar son dos decisiones distintas, y la foto de un premio se
  recorta.
- `rewards`: la imagen de un premio tiene una proporción conocida, y la rejilla ya no depende de con
  qué foto se subió.

## No incluye

- **La evidencia de una tarea.** Sigue **sin recortar**, y por la razón original, que ahí sí aguanta:
  lo que hay que ver es la cama hecha o la mesa recogida, y un cuadrado se comería la mitad. Además
  nadie la pone en rejilla — se mira de una en una, en la bandeja del padre.
- **Recortar las fotos ya subidas.** Las que hay se quedan como están; la caja de proporción fija las
  encuadra sin tocar el archivo. Reprocesar imágenes en el almacén es otra cosa y no hace falta.
- **Cambiar el catálogo de doce animales** ni cómo se elige un avatar.
- **Tocar la API.** El servidor recibe una clave y firma; qué forma tiene el binario nunca ha sido
  asunto suyo, y sigue sin serlo.

## Impact

- `apps/web/src/features/uploads/ImageUploadField.tsx`: `aspect` deja de decidir el tamaño.
- `apps/web/src/features/uploads/prepare-image.ts`: recibe el tamaño que se le pida, no lo deduce.
- `apps/web/src/features/rewards/RewardForm.tsx` y `RewardCatalog.tsx`: piden recorte.
- `apps/web/src/features/rewards/RewardImage.tsx`: caja de proporción fija.
- **Cero cambios en la API, en los contratos de datos y en la base de datos.** `PHOTO_MAX_DIMENSION`
  y `AVATAR_MAX_DIMENSION` siguen siendo las dos medidas y siguen viviendo donde viven.
