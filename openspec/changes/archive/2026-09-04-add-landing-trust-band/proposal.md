## Why

**La puerta pública no responde la pregunta que decide si alguien se registra.**

Tiene tres bloques —cabecera, héroe con las órbitas al lado, y las tres tarjetas de promesa— y entre
el héroe y las tarjetas no hay nada. El héroe dice qué hace el producto; las tarjetas resumen el
ciclo en tres golpes. Ninguno despeja lo primero que piensa un padre al leer «monedas» y «premios»:

> ¿esto mueve dinero de verdad?

Es una duda razonable, y la página no la contesta en ningún sitio. Quien se la hace y no encuentra
respuesta cierra la pestaña — y quien no se la hace tampoco pierde nada por leerlo.

Y hay algo más que decir y no está dicho: **lo que el niño aprende de verdad** no es a tener un
saldo, sino a mirar cuánto le falta para lo que quiere y qué pasó con lo que gastó. Eso lo permite el
historial desde `add-coin-history`, y la página pública no lo menciona.

## What Changes

- **Una franja entre el héroe y las tarjetas**, con una ilustración de la mascota a la izquierda y
  el texto a la derecha.
- **Dice dos cosas y nada más**: que la moneda es cerrada a la familia y no toca dinero real, y qué
  aprende el niño con ella.
- **La ilustración es decorativa** y no se anuncia: no aporta nada que el texto no diga.

## Capabilities

### Modified Capabilities

- `public-entry`: la página despeja además que la moneda no es dinero real.

## No incluye

- **Tocar el héroe, las órbitas, las tarjetas o la cabecera.** La franja se añade entre dos bloques
  que se quedan como están.
- **Las otras diecinueve ilustraciones.** Entran con el tutorial de entrada, que es su change.
- **Cifras, testimonios o logos.** No hay terceros que respalden nada, y ponerlos sería inventarlos —
  la misma razón por la que las tres promesas ocupan el sitio donde la referencia ponía socios.

## Impact

- `apps/web/src/features/landing/LandingPage.tsx`: la sección nueva.
- `apps/web/src/lib/messages.ts`: tres textos más en `landing`.
- `apps/web/src/assets/tutorial/explica.png`: pasa a estar en uso. De las veinte, solo entra al
  paquete la que se importa.
- **Cero cambios en la API, en los contratos y en la base de datos.** La puerta pública sigue sin
  hacer ni una petición.
