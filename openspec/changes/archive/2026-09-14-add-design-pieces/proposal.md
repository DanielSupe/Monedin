## Why

`repaint-design-system` deja el sistema con los colores nuevos y ninguna pantalla tocada. Falta la
capa de en medio: **las piezas**. Sin ellas, los tres changes de pantallas siguientes tendrían que
inventar lo mismo tres veces.

El riesgo no es teórico y tiene nombre. El panel de realce con degradado **sale en 13 de las 32
pantallas**. Si cada pantalla lo escribe, en dos meses hay trece degradados distintos, ninguno es el
correcto y nadie puede decir cuál manda. Es exactamente la historia de las tres pantallas del niño
que acabaron siendo `<ul className="flex list-none flex-col gap-3 p-0">` idénticas: cada una se vistió
por separado resolviendo bien SU contenido, y lo que ninguna pudo decidir sola fue el contraste con
las otras.

Y hay una deuda que este change cobra: **los doce avatares son emojis**, así que el mismo perfil se ve
distinto en la tablet compartida y en el portátil del padre. A un niño de seis años su cara es cómo se
reconoce. El comentario de `ui/avatars.ts` lo anticipa con todas las letras desde que se escribió:
«hoy son emojis; cuando haya ilustraciones de verdad, cambia este archivo y nada más».

## What Changes

- **Cuatro piezas nuevas de marca**, que son las que ninguna librería puede dar: el panel de realce
  con su degradado y sus círculos, la tesela de icono, el anillo de progreso, y la mascota con su
  globo.
- **Seis componentes traídos de shadcn/ui**: el lateral, el cajón, la casilla, el grupo de opción, el
  deslizador y el calendario con su emergente. Los cuatro últimos son controles que en las maquetas
  están **dibujados, no funcionando**: el «acercar» del recorte es una barra falsa y la fecha límite
  es un campo de texto.
- **Los doce avatares pasan de emoji a SVG**, sin tocar `AVATAR_KEYS` ni el contrato: la base de datos
  y la validación siguen sin saber cómo se pinta un avatar.
- **Lo traído entra como pieza propia**: catálogo vivo, sin dominio, sin estilos en línea y con sus
  estados. Un componente copiado no es «de shadcn»: es nuestro desde el primer minuto.
- **La mascota deja de elegir su pose en cada punto de uso.** Hoy el mapa vive en
  `app/widget-lines.ts`; la pieza lo lee de ahí y no se escribe un segundo.

## Capabilities

### Modified Capabilities

- `design-system`: gana cuatro piezas y tres garantías que hoy no tiene — que un realce de color sea
  una pieza y no una receta, que la mascota salga de un solo mapa, y que un avatar del catálogo lo
  dibuje el producto y no el dispositivo.

## No incluye

- **Ninguna pantalla.** Este change construye y cataloga; las pantallas las consumen en los tres
  siguientes. Que una pieza exista sin usarse todavía es correcto: es lo que permite que las ocho
  pantallas del niño se escriban sin inventar nada.
- **`CoinPill`, la píldora del saldo en la cabecera.** Su existencia depende de una decisión abierta
  —si el saldo se queda arriba o vuelve al inicio en grande—, y esa decisión se resuelve donde se ve,
  en `redesign-child-screens`. Construir la pieza antes sería decidirlo por la puerta de atrás.
- **Las ilustraciones de la mascota.** Ya están en `apps/web/src/assets/tutorial/` desde
  `add-onboarding-tour`: veinte poses, de las que el rediseño usa nueve. No se dibuja ninguna nueva.
- **`react-hook-form` y el `form` de shadcn.** Los formularios de este producto son de tres a cinco
  campos; traer un gestor de formularios para eso es más superficie de la que ahorra.
