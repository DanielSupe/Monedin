## Why

**La navegación fija no está fija: se va con la página.**

El marco es `min-h-dvh` y quien desplaza es el DOCUMENTO. La columna lateral no tiene altura propia,
así que **crece hasta donde llegue la página**, y su pie —el perfil y el control de contraer— acaba
al final del documento en vez de al final de la pantalla.

```
   pantalla corta              pantalla larga
   ──────────────              ──────────────
   ┌────┬──────────┐           ┌────┬──────────┐
   │nav │ contenido│           │nav │ contenido│
   │    │          │           │    │          │
   │pie │          │           │    │   ↓ ↓ ↓  │   el pie se fue
   └────┴──────────┘           │    │          │   con el scroll
                               │pie │          │
                               └────┴──────────┘
```

El síntoma se ve en la cuenta del padre y en cualquier listado largo: se desplaza para leer y el
perfil desaparece por abajo. Es lo contrario de lo que `pin-sidebar-on-desktop` fue a construir — una
columna fija que está siempre delante.

El `overflow-y-auto` que la navegación ya declara **nunca llega a usarse**, porque el contenedor que
lo tiene tampoco está acotado: sin una altura que respetar, no hay nada que desbordar.

## What Changes

- **La columna lateral se ata a la altura de la pantalla** cuando está delante, para que su pie esté
  siempre a la vista.
- **El contenido pasa a ser lo que se desplaza**, en lugar del documento entero, mientras la columna
  esté delante.
- **Los destinos se desplazan dentro de la propia columna** si algún día no caben, que es lo que el
  `overflow-y-auto` de la navegación siempre quiso decir.
- **En pantalla estrecha no cambia nada**: ahí la navegación es un cajón y el documento se desplaza
  como hasta ahora.

## Capabilities

### Modified Capabilities

- `app-navigation`: una navegación que está delante lo está también después de desplazar.

## No incluye

- **La forma estrecha.** El cajón no tiene este problema —se abre encima y se cierra— y atar la
  altura de la pantalla en un móvil pelea con la barra del navegador, que aparece y desaparece.
- **Cambiar qué destinos hay, cómo se contrae la columna o dónde vive el perfil.** Esto es dónde
  queda el pie al desplazar, y nada más.
- **La cabecera**, que sigue desplazándose con el contenido.

## Impact

- `apps/web/src/app/ParentShell.tsx` y `ChildShell.tsx`: los dos marcos tienen el mismo defecto y lo
  arreglan igual.
- `apps/web/src/app/Sidebar.tsx`: puede que no haga falta tocarlo — su `overflow-y-auto` ya está
  puesto y solo le faltaba un contenedor acotado por encima.
- **Cero cambios en la API, en los contratos y en la base de datos.**
