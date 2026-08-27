> El grupo 1 es la corrección y **no se ve**. Va primero: si se deja para el final, la pantalla ya
> vestida sigue llevando a quien se registra al formulario equivocado.

## 1. Dos destinos

- [x] 1.1 Ruta `/sign-up`, con `requireSignedOut` como la de acceso.
- [x] 1.2 Partir `SignInScreen` en dos formularios sin estado compartido. **Muere el
      `useState<"signIn" | "signUp">`** y el botón que alternaba.
- [x] 1.3 Un marco común que recibe el formulario **como hijo** y no decide nada. Si tuviera un `if`
      sobre cuál enseñar, habríamos movido el problema. Ver la decisión 1 del design.
- [x] 1.4 Cada pantalla ofrece la otra con un **enlace** a su dirección.
- [x] 1.5 Repartir los cuatro enlaces de la puerta pública: los dos «Empezar» al registro, los dos
      «Entrar» al acceso. **Es el defecto anotado, y aquí es donde se arregla.**

## 2. La pantalla, vestida

- [x] 2.1 Saludo y subtítulo con tokens, dentro de una tarjeta. Cero estilos en línea, cero colores
      literales, cero valores arbitrarios.
- [x] 2.2 Variante en píldora de `Input`, con hueco para un icono a la izquierda. Va en la pieza y no
      en la pantalla: `cx` no fusiona utilidades.
- [x] 2.3 El icono es **decorativo**; lo que nombra el campo es su etiqueta, que se queda encima.
- [x] 2.4 Envío circular con flecha y **nombre accesible**: una flecha sola no dice si envía, avanza
      o vuelve.
- [x] 2.5 La variante nueva y el botón, al catálogo vivo.
- [x] 2.6 Textos nuevos a `lib/messages.ts`.

## 3. Lo que el formulario no decía

- [x] 3.1 El mínimo de la contraseña, junto al campo y **antes** de enviar. Sale de la constante del
      contrato, no escrito a mano.
- [x] 3.2 En el registro, para qué sirve cada credencial: la contraseña vincula un dispositivo, el
      PIN se teclea cada día.

## 4. La cinta

- [x] 4.1 `@keyframes` nuevo en `tokens.css` junto a `mnd-orbit`, con su `--animate-*`.
- [x] 4.2 La tira duplicada y desplazada la mitad, para que el salto no se vea. **Con clases, sin
      pedir una tercera excepción de `allowInlineStyles()`**: no es geometría calculada como las
      órbitas. Ver la decisión 2 del design.
- [x] 4.3 El movimiento bajo `motion-safe:`. Con movimiento reducido la cinta se para, **y una cinta
      parada ya está completa**: no hace falta un hook como el de la landing.
- [x] 4.4 Para las tecnologías de asistencia, **una sola imagen con su descripción**, como `Orbits`.
- [x] 4.5 A 390 px: que no desborde de lado. Es donde una fila infinita falla.

## 5. La deuda declarada

- [x] 5.1 Sacar `SignInScreen.tsx` de las dos listas y ajustar el `toHaveLength`. Quedan tres.
- [x] 5.2 Comprobar que los tests de estilo cazan solos un color literal en las pantallas nuevas.

## 6. Tests

- [x] 6.1 «Empezar» lleva al registro y «Entrar» al acceso. **Es el test que importa.**
- [x] 6.2 Cada ruta enseña su formulario: el registro pide nombre y PIN, el acceso no.
- [x] 6.3 Atrás desde el registro vuelve a la puerta pública, no saca de la aplicación.
- [x] 6.4 El mínimo de la contraseña se ve sin haber enviado nada.
- [x] 6.5 La cinta: el movimiento bajo `motion-safe` y el conjunto anunciado como una sola imagen.
- [x] 6.6 Comprobar que fallan de verdad inyectando una violación, y no pasan por vacíos.

## 7. Cierre

- [x] 7.1 **Abrir la aplicación** y recorrer las dos entradas desde la puerta pública, comprobando
      que cada botón abre el formulario que anuncia.
- [x] 7.2 **Registrar una cuenta nueva de verdad** y llegar hasta la rejilla. Es el camino que este
      change puede romper de forma cara, y un test no lo cubre entero.
- [x] 7.3 Entrar con la cuenta sembrada, para no dar por bueno solo el camino nuevo.
- [x] 7.4 Con **movimiento reducido**: la cinta quieta y legible, sin saltos.
- [x] 7.5 A 390×844 y en escritorio.
- [x] 7.6 Verificación completa: `pnpm turbo run lint typecheck test build --force --concurrency=1`,
      con Docker arriba. Si se corta, **lo que queda detrás no es verde, es desconocido**.
- [x] 7.7 Actualizar `README.md`, `openspec/config.yaml` y `CLAUDE.md`.
- [x] 7.8 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.
