## Context

Las teselas del inicio del niño se ven enormes y vacías. Al mirarlo, el tamaño de las teselas no es
el problema: el `<main>` de los dos marcos no tiene tope de ancho, así que con el lateral fijo desde
`pin-sidebar-on-desktop` el contenido se reparte por todo lo que sobra.

Es un defecto de una línea con tres síntomas visibles y muchos más invisibles: afecta a todas las
pantallas de dentro de un perfil.

## Goals / Non-Goals

**Goals**

- Ponerle tope al contenido, que es lo que arregla los tres síntomas a la vez.
- Que el inicio del niño recupere una proporción en la que su glifo se lea.

**Non-Goals**

- **Quitar las teselas del inicio del niño.** Ver la decisión 3.
- **Rediseñar nada.** El rediseño externo viene aparte; esto es que lo que hay se vea como se
  diseñó.
- **Tocar la API.**

## Decisions

### 1. El tope va en el marco, no en cada pantalla

Podría ponerse en el inicio y arreglar lo que se ve en la captura. Sería tapar el síntoma: el mismo
estirado le pasa a los listados del padre, y la siguiente pantalla que se escriba volvería a
heredarlo.

Va en el `<main>` de los dos marcos, con `--container-wide` (72rem), que ya existe y ya se usa en la
puerta pública. Ningún valor nuevo.

### 2. El inicio del niño se ciñe MÁS, y por qué no es lo mismo que un listado

Un listado gana con sitio: cada fila lleva avatar, texto, cifra y acciones, y a 72rem respira. El
inicio del niño es **un número y cuatro destinos**; a 72rem son cuatro bandas de 560px con un emoji
de 28px flotando.

Se ciñe a `--container-reading` (40rem), que también existe. Ahí las dos columnas dan teselas de unos
310px: una proporción en la que el glifo se ve como un icono y no como una mota.

**No se toca el tamaño del glifo ni el relleno de la tesela.** Es tentador y sería el arreglo
equivocado: sus medidas ya salen de la escala del niño, y agrandarlas para compensar un contenedor
mal puesto las dejaría desproporcionadas en cuanto el contenedor se arreglara — que es justo lo que
este change hace.

### 3. Las teselas se QUEDAN, aunque el lateral repita sus destinos

Hay que decirlo porque salta a la vista en la captura: el lateral tiene Inicio · Tareas · Premios ·
Canjes, y el inicio repite esos cuatro. Es exactamente la forma del defecto que
`redesign-parent-home` quitó del panel del padre.

Y aun así se quedan, por dos razones que allí no se daban:

- **En pantalla estrecha el lateral no está**: está detrás de un botón. Para el niño, las teselas son
  la única navegación visible en el dispositivo en el que más se usa.
- **Quien las usa tiene seis años.** Cuatro objetivos grandes con su dibujo en la pantalla a la que
  siempre vuelve no es lo mismo que cinco palabras en un menú.

Si algún día el lateral se queda fijo también en estrecho, esta decisión hay que volver a mirarla.

## Risks / Trade-offs

- **El tope cambia el aspecto de TODAS las pantallas de dentro de un perfil**, que es el objetivo
  pero también el riesgo: hay que abrirlas. No lo cubre ningún test.
- **72rem es una elección.** Si acaba quedándose corto para el listado de repartos, se sube el token
  y se sube en todas a la vez, que es la ventaja de que sea un token.

## Migration Plan

Sin migración.

## Open Questions

Ninguna.

## Decisiones que este change NO toma

- **Si el inicio del niño debería dejar de repetir el lateral.** Decisión 3: hoy no, y queda escrito
  qué la haría cambiar.
