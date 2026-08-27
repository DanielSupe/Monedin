## Why

**Monedín no tiene puerta.** Quien llega sin sesión aterriza directamente en un formulario de acceso:
ni una frase sobre qué es el producto, para quién, ni por qué un padre querría instalarlo. La
aplicación entera está construida y funciona, y aun así **nadie que no la conozca ya puede entender
qué hace**.

Eso deja el producto sin su primer eslabón. Lo que enseña es el ciclo esfuerzo → ingreso → decisión
de gasto, y ese ciclo hay que poder contarlo **antes** de pedirle a alguien un correo y una
contraseña. Un formulario no cuenta nada: da por hecho que ya te convencieron.

Y hay una segunda razón, menos obvia y más urgente: hoy **el mismo formulario recibe a dos personas
distintas**. Al que nunca ha oído hablar de Monedín y al padre cuya sesión caducó el lunes por la
mañana. A la primera no le dice nada; a la segunda le sobra todo salvo dos campos. Separar la puerta
del cerrojo permite atender a las dos.

## What Changes

- **Una página pública en `/welcome`**, que en dos segundos dice de qué va el producto: sus tareas
  valen monedas, sus premios cuestan monedas, y el padre aprueba.
- **Sin sesión, todo lleva a la landing.** El destino de «sin sesión» de las guardas pasa de
  `/sign-in` a `/welcome`, y es **una constante**, no una excepción por ruta. `/sign-in` sigue
  existiendo y siendo alcanzable: lo que cambia es quién lleva hasta él.
- **«Entrar» es acción de primer nivel**, al lado de «Empezar». Es la consecuencia directa de lo
  anterior: si la landing recibe también a quien ya es usuario, esconder la entrada en un enlace
  pequeño convierte una caducidad de sesión en un problema diario.
- **Lo que orbita es el ciclo del producto** —tareas, monedas y premios alrededor de un saldo
  central— y no retratos de gente. La visualización explica el producto en lugar de decorarlo.
- **La franja inferior son las tres promesas**, no logos de socios: Monedín no tiene socios, e
  inventarlos sería poner respaldos falsos en una página pública.
- **Componente `Logo` nuevo**, en `ui/`, con **tres consumidores desde el primer día**: la landing y
  los dos marcos de la aplicación, donde hoy «Monedín» es un `<span>` con texto suelto.
- **Dos hooks probables por separado**: la cuenta animada del saldo y la máquina de escribir del
  titular. Están en la referencia como efectos; aquí son lógica con test.

## Capabilities

### New Capabilities

- `public-entry`: qué ve alguien que llega a Monedín sin sesión, qué tiene que poder entender antes
  de dar un dato, y por dónde entra quien ya es usuario.

### Modified Capabilities

- `app-navigation`: el requisito que decide el acceso a un destino cambia su destino para el caso
  «sin sesión». Antes llevaba a la pantalla de acceso; ahora lleva a la puerta pública, y desde ahí
  se llega a la de acceso.

## Impact

**Código nuevo**: `apps/web/src/ui/Logo.tsx`, `apps/web/src/features/landing/` con la página y sus
dos hooks, `apps/web/src/routes/welcome.tsx` y `apps/web/tests/landing/`.

**Código modificado**: `apps/web/src/app/guards.ts` (una constante), los dos marcos para usar `Logo`
en lugar de texto, el catálogo de mensajes, el catálogo vivo con la pieza nueva, y las dos
aserciones de `tests/app/navigation.test.tsx` que siguen al comportamiento decidido.

**API, contratos y base de datos**: sin tocar. La landing no hace una sola petición.

**Deuda declarada**: no se borra ninguna entrada, porque no se viste ninguna pantalla existente.
`features/landing/` **no** entra en esa lista: es código nuevo y nace bajo la regla de estilos, como
`app/` en el change anterior.

**Sin dependencias nuevas.** Ni fuentes remotas, ni librerías de animación, ni imágenes de terceros.

## No incluye

- **La tipografía de marca.** La referencia pide dos fuentes de Google; el sistema de diseño usa a
  propósito la pila del sistema y deja la tipografía de marca para `polish-brand-and-a11y`. Añadirla
  aquí se solapa con ese change y mete una dependencia de red en la primera pantalla que alguien ve.
  Cambiarla después es **una línea** en `tokens.css`.
- **Las ilustraciones.** Lo que orbita se dibuja con lo que ya hay. El conjunto de marca es del mismo
  change 12.
- **La imagen de fondo a pantalla completa** de la referencia: necesita un asset propio que no
  existe, y el de la maqueta original no es nuestro.
- **El borde de gradiente cónico rotatorio.** Es el recurso que más marca el tono de herramienta B2B
  de la referencia, y este producto es para familias con niños de 6 a 11 años.
- **Segunda pantalla, precios, testimonios y pie de página.** Esto es un héroe, no un sitio.
- **SEO, metadatos sociales y analítica.** Merecen su propio change el día que haya dominio, y sin
  dominio no se pueden ni comprobar.
- **Traducción.** El texto va al catálogo de mensajes, que es exactamente lo que hará mecánica la
  traducción cuando llegue un segundo idioma.
- **Cambiar dónde vive el inicio de la aplicación.** `/` sigue siendo el inicio con actor y no se
  toca: lo que cambia es a dónde va quien llega ahí **sin** sesión.
