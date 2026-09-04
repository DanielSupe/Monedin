## Context

Ver `proposal.md` — Why. Lo que condiciona el cómo:

- La puerta pública son tres bloques en `LandingPage.tsx`: `<header>`, un `<main>` con el héroe y
  `Orbits`, y `<Promises>`. Entre los dos últimos no hay nada.
- El héroe va **texto a la izquierda, visual a la derecha**, con `lg:flex-row`.
- `Orbits` lleva nombre accesible (`orbitLabel`) porque comunica el ciclo. El logo también.
- Las veinte ilustraciones están en `src/assets/tutorial/` y no las usa nadie todavía.
- `vite/client` está en los `types` del tsconfig del web, así que importar un `.png` está tipado sin
  tocar configuración.

## Goals / Non-Goals

**Goals:**

- Contestar en la página la duda que hoy no se contesta.
- Que la franja se distinga del héroe y de las tarjetas, y no compita con ninguno.
- Estrenar una ilustración sin que las otras diecinueve pesen en el paquete.

**Non-Goals:**

- Tocar el héroe, las órbitas, las tarjetas o la cabecera.
- Hacer que la puerta pública pida algo al servidor. Sigue sin pedir nada.

## Decisions

### 1. La ilustración a la IZQUIERDA, en espejo del héroe

```
   héroe        [ texto ............ ] [ órbitas ]
   franja       [ ilustración ] [ texto ........ ]     <- nueva
   promesas     [ tarjeta ] [ tarjeta ] [ tarjeta ]
```

Es lo que pidió el usuario y además lo que evita que las dos franjas se lean como la misma: dos
bloques seguidos con el visual del mismo lado se leen como uno repetido.

En estrecho se apilan, con la ilustración arriba — el mismo `lg:flex-row` que ya usa el héroe, sin
inventar un punto de corte nuevo.

### 2. La franja NO es una `Card`

Va sobre el fondo, como el héroe. Meterla en una tarjeta pondría una tarjeta justo encima de tres
tarjetas, y las cuatro competirían: el lector no sabría si la primera es una promesa más.

### 3. La ilustración es DECORATIVA, y esto es lo contrario de `Orbits`

`Orbits` lleva `orbitLabel` porque comunica el ciclo: sin nombre, quien no la ve pierde información
que no está en otro sitio. Aquí pasa lo contrario — el texto de al lado lo dice todo, así que
anunciar la ilustración es decir la misma frase dos veces.

Se declara con `alt=""`, que es lo que la saca del árbol de accesibilidad. Es la misma decisión que
los glifos de las teselas del inicio del niño y la del respaldo de un premio sin foto.

**El test lo comprueba contando**, no mirando el atributo: las imágenes anunciadas de la página son
dos —el logo y las órbitas— y tienen que seguir siendo dos. Comprobar que la ilustración «no tiene
nombre» pasaría igual si la ilustración no estuviera.

### 4. La imagen se IMPORTA, no se referencia por cadena

`import ilustracion from "../../assets/tutorial/explica.png"` en vez de una ruta en `public/`. Un
nombre mal escrito es un error de compilación y no una imagen rota en producción, y Vite le pone
hash para la caché. Es la misma razón por la que las ilustraciones se guardaron en `src/assets/`.

De las veinte, **solo entra al paquete la que se importa**: las otras diecinueve están en el
repositorio pero no en el `dist` hasta que algo las use.

### 5. `explica.png`, y por qué esa

Es la pose que señala mientras sonríe. La franja explica; la ilustración explica. Las alternativas
—`presenta`, `propone`— dicen lo mismo con menos claridad, y las expresivas (`celebra`, `duerme`,
`enfado`) contarían una emoción que el texto no cuenta.

### 6. Dos párrafos, sin lista

Las tarjetas de debajo ya son una lista de tres. Si la franja también fuera una lista, las dos
compiten y el lector no sabe cuál resume a cuál. Prosa corta arriba, lista abajo.

## Risks / Trade-offs

- **Una franja más alarga la página** → Son un título y dos párrafos, y contestan la pregunta que
  decide un registro. La alternativa es que quien se la hace no encuentre respuesta.
- **La ilustración es un PNG rasterizado** → ~50 KB, una sola, y el resto de la página es SVG y
  tipografía. No cambia el peso de forma apreciable.
- **Cómo se ve a los dos anchos no lo cubre jsdom** → Va como tarea de abrir la aplicación, no se
  finge con un test que mire clases.

## Migration Plan

Sin migración: es una sección de una página pública que no consulta nada.

## Decisiones que este change NO toma

- **Si la puerta pública necesita más franjas.** Se mira cuando haya algo más que decir, no para
  llenar.
- **Qué ilustración usa cada paso del tutorial.** Es su change.
