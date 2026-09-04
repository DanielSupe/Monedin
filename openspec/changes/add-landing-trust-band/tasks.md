## 1. Los textos

- [x] 1.1 Tres entradas en `landing` del catálogo: el título y los dos párrafos. **Ninguna cifra
      dentro de una cadena** — hay un test del proyecto que lo caza.

## 2. La franja

- [x] 2.1 Sección entre `<main>` y `<Promises>`, con la ilustración a la izquierda y el texto a la
      derecha, apilándose en estrecho con el mismo `lg:flex-row` que ya usa el héroe.
- [x] 2.2 Importar `explica.png` desde `src/assets/tutorial/`, no referenciarla por cadena.
- [x] 2.3 `alt=""`: la ilustración no aporta nada que el texto no diga.
- [x] 2.4 Sin `Card`: va sobre el fondo, como el héroe. Cuatro tarjetas seguidas competirían.

## 3. Tests

- [x] 3.1 El título y los dos párrafos están en la puerta pública.
- [x] 3.2 La ilustración NO se anuncia. Se comprueba **contando** las imágenes con nombre —dos, el
      logo y las órbitas— y no mirando el atributo: comprobar que «no tiene nombre» pasaría igual si
      la ilustración no estuviera.
- [x] 3.3 La franja va ANTES que las tarjetas. Comprobar solo que existe dejaría pasar ponerla al
      final, que es lo contrario de lo pedido.
- [x] 3.4 **Inyectar la violación**: la ilustración con un `alt` de texto. Tiene que tumbar el 3.2.

## 4. Cerrar

- [x] 4.1 `pnpm lint` y `pnpm typecheck` del web, y su batería. En serie si la máquina está cargada.
- [x] 4.2 Comprobar que la API no se toca antes de saltarse su batería.

## 5. Lo que ningún test cubre

- [ ] 5.1 **Abrir `/welcome`** a ancho de escritorio y de móvil: que la ilustración no se coma la
      columna del texto ni quede minúscula.
