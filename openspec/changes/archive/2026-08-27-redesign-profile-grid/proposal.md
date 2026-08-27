## Why

La rejilla «¿Quién eres?» es la pantalla que una familia ve **cada vez que abre Monedín**, y es la
menos vestida del producto. Hoy es esto:

```tsx
<ul style={{ display: "flex", gap: "1rem", listStyle: "none", padding: 0, flexWrap: "wrap" }}>
```

Avatares de 3 rem en una fila que envuelve, nombres a 1.1 rem, y «Crear perfil» como un enlace
subrayado debajo. Funciona, y no se parece a un producto.

Hay además un hueco de producto, no solo de aspecto: **desde la rejilla no se puede editar un
perfil**. Para cambiarse la foto hay que entrar, y para saber que se puede hay que haber explorado el
marco. Netflix resolvió exactamente esto hace años con un botón «Administrar perfiles» que pone un
lápiz sobre cada tesela, y es un gesto que la gente de esta casa ya conoce de otra aplicación.

Y hay un defecto que llevamos arrastrando sin verlo: **el teclado de PIN no tiene tecla de borrar**.
Quien se equivoca en el segundo dígito está obligado a teclear dos más y **gastar un intento**. Los
intentos bloquean el perfil. A un niño de siete años eso le pasa, y lo que se lleva es que la
aplicación le echó.

## What Changes

- **La rejilla se viste** con la estructura de Netflix —pregunta centrada, teselas grandes con el
  nombre debajo, todo en una fila que respira— y **nuestros colores**. Ni un valor de color ni una
  medida fuera de `tokens.css`.
- **Modo administrar**: un botón alterna entre «Administrar perfiles» y «Listo». Con el modo puesto,
  cada perfil entrable lleva un lápiz encima y se anuncia como «Editar ‹nombre›».
- **Al tocar un perfil en modo administrar se pide su PIN**, y al acertarlo se aterriza **dentro de
  ese perfil, en su pantalla de edición**: `/account` para el padre, `/me/settings` para un hijo.
  Cada quien edita lo suyo con su propia llave.
- **El modo viaja en la dirección**, no en un `useState`. El botón atrás sale del modo, recargar lo
  conserva, y la intención sobrevive al PIN — que es lo único que hace posible aterrizar en la
  edición, porque después de entrar quien navega es la guarda y no el componente.
- **«Agregar perfil» pasa a ser una tesela** en la misma fila, en vez de un enlace debajo.
- **El teclado de PIN se viste y gana una tecla de borrar.**
- **La lista de deuda declarada se estrecha**: `features/auth/` deja de estar exceptuada en bloque y
  pasa a nombrar los cuatro archivos que siguen sin vestir.

## Capabilities

### Modified Capabilities

- `profile-selection`: la rejilla gana un modo de administración, y entrar a un perfil desde ese modo
  aterriza en su pantalla de edición en lugar de en el inicio.

### New Capabilities

Ninguna. Todo el flujo cabe en los endpoints que ya existen.

## Impact

**Código modificado**: `ProfileGrid.tsx` y `PinPad.tsx` —los dos se reescriben con tokens—,
`app/guards.ts` y `app/search.ts` para el destino tras el PIN, las dos rutas de perfiles, y
`lib/messages.ts`.

**Las dos listas de deuda**: `apps/web/eslint.config.js` y `tests/ui/style-rules.test.ts`.

**API, contratos y base de datos**: sin tocar.

**Dependencias**: ninguna nueva.

## No incluye

- **Dar de baja un hijo desde la rejilla.** Netflix lo pone ahí. Aquí la baja es **definitiva y sin
  reactivación**, así que se queda en `/children`, detrás del contexto que explica lo que significa.
  Ofrecerla a un toque de la pantalla de entrada sería invitar a un accidente irreversible.
- **El resto de `features/auth/`**: acceso, registro, restablecer PIN y la foto del padre siguen
  siendo `redesign-access`.
- **Fondo oscuro.** La rejilla se queda en la superficie clara del sistema: adoptamos la estructura
  de Netflix, no su paleta, y una capa de tokens oscuros es un change en sí misma.
- **Teselas cuadradas.** `Avatar` sigue siendo un círculo y no gana una prop de forma; lo usan cuatro
  pantallas más.
- **Cambiar la API.**
- **Que «Empezar» de la landing abra el registro y no el acceso.** Es un defecto real y anotado, y es
  de `redesign-access`.
