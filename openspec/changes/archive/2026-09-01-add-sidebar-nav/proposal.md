## Why

Hoy hay **dos navegaciones distintas y ninguna completa**.

```
                        padre                       niño
la barra          <nav> en la cabecera        <nav> inferior
                  4 enlaces                   4 destinos
fuera de ella     /account, colgando          /me/settings, colgando
                  del avatar                  del avatar
```

Cada rol aprendió a moverse de una forma distinta, y en los dos casos hay **un destino que no está en
la barra**: cuelga del avatar de la cabecera, donde solo lo encuentra quien ya sabe que está ahí.

Un lateral con **todas** las opciones resuelve las dos cosas a la vez: los dos marcos pasan a
navegarse igual, y ningún destino queda fuera de la lista.

Y hay una razón para hacerlo **ahora** y no al final: `redesign-parent-home` acaba de retirar del
inicio del padre una lista que repetía su barra, y quedan tres changes de rediseño por delante.
Cuanto más tarde llegue el lateral, más pantallas se habrán vestido contra una navegación que va a
cambiar.

## What Changes

- **Nace un cajón lateral izquierdo con todos los destinos del rol activo**, con su icono a la
  derecha del texto, abierto desde un botón de menú en la cabecera.
- **Se van las dos barras** —la de la cabecera del padre y la inferior del niño— y **el enlace del
  avatar**. El lateral es la ÚNICA navegación: dejar cualquiera de ellas sería ofrecer los mismos
  destinos dos veces.
- **El perfil pasa al pie del cajón**, con su avatar y su nombre, donde no compite con los destinos.
- **Nace `ui/Drawer`** sobre Radix Dialog, que ya es dependencia: trampa de foco, cierre con Escape,
  fondo inerte y retorno del foco al botón.
- **El cajón se cierra al cambiar de dirección**, lo que cubre también el botón atrás.
- Solo con **perfil activo**: `EntryShell` no lo recibe.

## Capabilities

### Modified Capabilities

- `app-navigation`: cómo se llega a cada destino una vez dentro de un perfil, y que la navegación sea
  una sola.
- `design-system`: la pieza de cajón lateral.

## Impact

- **Front, y solo front.** Cero cambios en la API, en los contratos o en la base de datos.
- Nace `apps/web/src/ui/Drawer.tsx`, con su entrada en el catálogo vivo.
- Nacen `apps/web/src/app/Sidebar.tsx` y `apps/web/src/app/nav-icons.tsx`.
- `ParentShell.tsx` y `ChildShell.tsx` pierden su `<nav>` y el enlace del avatar.
- `tests/app/shells.test.tsx` cambia de sondeo: la navegación se muda dentro del cajón, así que lo
  que se comprueba que sobrevive pasa a ser la cabecera.
- `messages.ts` gana las etiquetas del menú y del cajón.
