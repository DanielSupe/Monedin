# Tareas

## 1. Las medidas

- [x] 1.1 Bajar `Avatar` `xlarge` de `size-36` a `size-28`, y reescribir su comentario para que
      explique por qué sube y por qué vuelve a bajar. Comprobar antes que no lo usa nadie más.
- [x] 1.2 La tesela crece a partir de `sm` (`w-36 sm:w-44`) y su comentario recoge por qué el
      teléfono fija el mínimo y por qué el escalón de al lado sigue descartado.
- [x] 1.3 La marca de «más» del hueco de crear sigue a la cara.

## 2. La altura

- [x] 2.1 Cambiar el alto fijo por un mínimo y dejar que la fila iguale: el `li` pasa a contenedor
      flexible para que la tarjeta llene su altura.
- [x] 2.2 Mover el relleno lateral de la tarjeta al nombre.

## 3. Lo que lo sostiene

- [x] 3.1 Test: la tesela declara un ancho mayor que la talla de la cara. **Inyectar la violación**
      —volver a igualarlas— y ver el test fallar.
- [x] 3.2 Test: la marca de «más» declara la misma talla que la cara.
- [x] 3.3 Abrir la rejilla en el navegador, en los dos temas, y comprobar el equilibrio de la
      tarjeta. Es lo que ningún test puede ver.
- [x] 3.4 Abrirla a 390 px y comprobar que siguen entrando dos columnas, con nombre largo y con
      insignia de bloqueado.

## 4. Cierre

- [ ] 4.1 `pnpm verify` entero.
