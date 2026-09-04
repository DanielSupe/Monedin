## Why

**La puerta pública se construyó por partes y nunca se compuso como página.**

`add-landing-page` puso el héroe y las tres tarjetas; `add-landing-trust-band` metió una franja
después. Cada pieza está bien resuelta por dentro y ninguna se decidió mirando a las otras:

```
   hoy                                    lo que falla
   ───                                    ────────────
   cabecera                               —
   héroe        [ texto ] [ órbitas ]     hueco en medio; la acción pesa como un botón de formulario
   franja       [ foto ] [ texto ]        —
   tarjetas     [ ] [ ] [ ]               dicen lo mismo que un «cómo funciona» diría
   (nada)                                 quien llega al final tiene que subir para actuar
```

Cinco bloques seguidos sobre **el mismo fondo**, sin nada que marque dónde acaba uno y empieza otro.

Y dos cosas concretas que la página desaprovecha:

- **Las órbitas son lo mejor que hay y están de adorno.** Dibujan el ciclo que el producto entero
  existe para enseñar, a 20rem en una esquina, tratadas como una ilustración de relleno.
- **No enseña la aplicación ni una vez.** Quien duda si esto le sirve no ve nunca lo que va a usar —
  ni lo que va a usar su hijo, que es de lo que va el producto.

## What Changes

- **El flujo de «cómo funciona» SUSTITUYE a las tres tarjetas**, no se suma a ellas: dicen las
  mismas tres ideas, y tenerlas las dos es decirlo dos veces. Al fundirlas, el flujo gana el paso que
  a las tarjetas les faltaba en el orden — aprobar va **entre** la tarea y las monedas, que es donde
  ocurre.
- **Las órbitas pasan a protagonistas**: más grandes y apoyadas en la composición del héroe en vez
  de flotando a su lado.
- **La página enseña la aplicación**, con las dos caras a la vez —el panel del padre y el inicio del
  niño—, construidas con las piezas y los tokens reales.
- **Un cierre con la acción principal**, para quien ha leído hasta el final.
- **Ritmo por superficies**: las secciones alternan las superficies que el sistema ya tiene, y el
  cierre usa la de marca.
- **La acción principal gana una talla** en el sistema de diseño: una llamada a la acción de una
  puerta pública no puede pesar lo mismo que el botón de un formulario.

## Capabilities

### Modified Capabilities

- `public-entry`: la página cuenta el ciclo como un flujo, enseña la aplicación y cierra con su
  acción.
- `design-system`: la acción principal admite una talla mayor.

## No incluye

- **La aplicación de verdad.** Esto es la puerta pública; las maquetas que enseña son eso, maquetas.
- **Cifras, testimonios y logos de terceros.** No los hay, e inventarlos en una página pública es
  poner un aval falso — la misma razón por la que las tarjetas ocupaban el sitio donde la referencia
  ponía socios.
- **Las otras diecinueve ilustraciones** y el tutorial de entrada, que es su change.
- **Cambiar la identidad**: los colores, la mascota, la tipografía y las piezas son los que hay.

## Impact

- `apps/web/src/features/landing/`: `LandingPage.tsx` pasa a montar secciones, y tres archivos
  nuevos las dibujan.
- `apps/web/src/ui/Button.tsx`: una talla más, con su entrada obligatoria en el catálogo vivo.
- `apps/web/src/styles/tokens.css`: las medidas nuevas. Ningún color nuevo.
- `apps/web/src/lib/messages.ts`: los textos.
- **Cero cambios en la API, en los contratos y en la base de datos.** La puerta pública sigue sin
  hacer ni una petición.
