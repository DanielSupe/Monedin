## Why

La rejilla de perfiles ya tiene marco, tamaño y modo de administración. Lo que le falta es
**presencia**: tres círculos flotando en el centro de la pantalla se leen como una lista de contactos,
no como la portada de un producto para niños.

Y hay una cosa que no se puede saber mirándola: **cuál de los perfiles es el del adulto**. Se
distingue por la foto si el padre puso una, y por nada si no la puso. En una casa donde la tablet la
coge quien sea, el perfil que abre las tareas de todos debería verse distinto de los demás.

## What Changes

- **Cuadrados redondeados** en vez de círculos. `Avatar` gana una variante de forma, porque `cx` no
  fusiona utilidades de Tailwind y pasar el radio por `className` no funciona de forma fiable.
- **De 8 rem a 9 rem.** Un escalón, sin tocar la retícula de dos por fila en móvil.
- **Una corona pequeña** en una esquina de la tesela del padre. Lleva nombre accesible: quien no ve
  la pantalla también tiene que saber cuál es el del adulto.
- **La tesela crece un poco al pasar el ratón**, y solo cuando el movimiento está permitido. Bajo
  movimiento reducido no crece: el realce llega por color, que no es movimiento.

## Capabilities

### Modified Capabilities

- `profile-selection`: la rejilla distingue visualmente el perfil del adulto, y lo anuncia.
- `design-system`: `Avatar` deja de ser siempre redondo.

### New Capabilities

Ninguna.

## Impact

**Código modificado**: `ui/Avatar.tsx`, `features/auth/ProfileGrid.tsx`, `ui-catalog.tsx` y
`lib/messages.ts`.

**API, contratos y base de datos**: **sin tocar**. El rol ya viaja en la respuesta de la rejilla.

**Dependencias**: ninguna.

## No incluye

- **El saldo bajo el nombre.** Se pidió, y **se deja fuera a conciencia**: `profile-selection` tiene
  un requisito cerrado que dice que un perfil se identifica «por su nombre y su avatar, y NO SHALL
  exponer ningún otro dato antes de entrar», con un escenario que nombra el saldo. No es un hueco del
  contrato: `GET /auth/profiles` no lo devuelve porque se decidió que no lo devolviera.

  Abrirlo tiene dos precios que no son técnicos. Uno: cualquiera con la tablet desbloqueada ve todos
  los saldos **sin teclear ningún PIN**. Dos, y es el que pesa: **los hermanos se comparan cada vez
  que se abre la aplicación**, y un niño de siete años viendo que el otro tiene 300 y él 40 es una
  decisión de producto, no un adorno. El saldo sigue siendo lo primero que se ve **al entrar**, que
  es donde el producto ya lo pone en grande.

- **Una segunda familia tipográfica, ilustraciones o el logo definitivo**: `polish-brand-and-a11y`.
- **Vestir el resto de `features/auth/`**: `redesign-access`.
- **Cambiar la forma del avatar en las demás pantallas.** Las listas del padre y los marcos siguen
  con el círculo: ahí es pequeño y funciona.
