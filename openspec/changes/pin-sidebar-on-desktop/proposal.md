## Why

`add-sidebar-nav` entregó un cajón y lo dejó **detrás de un botón en todos los tamaños**. Se declaró
como consecuencia aceptada en su design, y al verlo no lo es: en escritorio y en tablet sobra ancho
de sobra para tener la navegación delante, y esconderla cuesta un toque cada vez sin ganar nada.

Además, aquel change se llevó el avatar de la cabecera. Era la única cosa siempre visible que
respondía **quién está usando esta tablet**, que en un dispositivo compartido por toda una familia no
es un adorno.

Las dos cosas se corrigen aquí.

## What Changes

- **En pantalla ancha el lateral está SIEMPRE visible**, como una columna del marco, y se puede
  **contraer a solo iconos** con un botón en su pie.
- **En pantalla estrecha se queda como está**: el cajón que abre y cierra el botón de menú, con su
  trampa de foco. El botón de menú deja de verse en ancho, donde no hace falta.
- **Se monta UNA sola de las dos formas**, no las dos con una escondida por CSS: dos navegaciones en
  el documento serían dos para quien lo recorre con teclado.
- **El avatar vuelve a la cabecera, a la derecha**, como enlace al perfil.
- **La regla de «ningún destino dos veces» se enmienda**, con el perfil como excepción declarada: el
  avatar responde además a quién está usando el dispositivo, que la lista no responde. La excepción
  es **una**, va nombrada en la spec y el test la comprueba en vez de taparla.

## Capabilities

### Modified Capabilities

- `app-navigation`: que la navegación esté delante cuando hay sitio, y la excepción del perfil.

## Impact

- **Front, y solo front.** Cero cambios en la API, en los contratos o en la base de datos.
- Nace `apps/web/src/app/use-wide.ts` —`matchMedia`, para montar una sola de las dos formas— y su
  relleno en `tests/setup.ts`.
- `Sidebar.tsx` gana el modo contraído y el botón que lo alterna.
- `ParentShell.tsx` y `ChildShell.tsx` montan la columna o el cajón, y devuelven el avatar a la
  cabecera.
- `tests/app/sidebar.test.tsx` gana los dos modos; el test de destinos duplicados nombra la
  excepción.
