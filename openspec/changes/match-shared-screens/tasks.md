# Tareas

## 1. Comparar antes de tocar

- [x] 1.1 Extraer el texto visible de cada maqueta y de su pantalla, en orden, y ponerlos al lado.
      Sin esto, «se ve distinto» no dice qué falta — y lo que falta es justo lo que no se ve.
- [x] 1.2 Hacerlo con las OCHO compartidas, no con una muestra: `Bienvenida`, `Entrar`, `Registro`,
      `ResetPin`, `Perfiles`, `Pin`, `NuevoPerfil`, `Administrar`.

## 2. La puerta pública

- [x] 2.1 Intercambiar «Dinero de mentira» y «Así funciona», e intercambiar también sus FONDOS: el
      fondo lo decide el sitio en la alternancia, no la sección.
- [x] 2.2 Poner pie a las dos maquetas internas, compuesto de la clave que ya las nombra más el
      aviso de que los datos no son de nadie. Una sola clave para las dos cosas.
- [x] 2.3 Darle a la acción del cierre su propio nombre.
- [x] 2.4 Arreglar el test del orden, que llevaba su intención escrita en el comentario y comprobaba
      lo contrario. Y el del cierre, que perseguía la última «Empezar» de la página.

## 3. El acceso

- [x] 3.1 Invertir la jerarquía: el saludo al antetítulo, lo que se viene a hacer al título.
- [x] 3.2 Reescribir los dos textos del catálogo para que funcionen como títulos.
- [x] 3.3 Añadir la frase del producto al panel de presentación, tomada de donde ya vive.
- [x] 3.4 Darle a la acción principal su nombre escrito y el ancho del panel.
- [x] 3.5 Borrar `ArrowRight`, que se queda sin uso. Una pieza sin uso es la invitación a volver a
      poner el botón sin palabra.

## 4. La rejilla y el alta

- [x] 4.1 La línea de la rejilla normal, distinta de la del modo administrar.
- [x] 4.2 Un test que la cace: los dos que había se cumplen igual con la rejilla MUDA, porque dicen
      que el aviso del modo no se queda puesto y no que sin modo se diga algo.
- [x] 4.3 Inyectar la violación y ver fallar ese test. **Hecho**: quitada la línea, falla solo él.
- [x] 4.4 Reordenar los campos del alta y renombrar la rejilla de animales.

## 5. La siembra

- [x] 5.1 Un tercer hijo, que nace BLOQUEADO y sin edad: dos estados válidos que los otros dos no
      pueden dar a la vez.
- [x] 5.2 Un reparto de TRES con estados mezclados, que es donde se ve que el listado pagina por
      reparto y devuelve el grupo entero al filtrar.
- [x] 5.3 Dos tareas con fecha límite, una por vencer y otra pasada. `dueDate` es opcional y sin
      sembrarlo no sale en ninguna pantalla.
- [x] 5.4 Ofertas y una tarea aprobada para el tercer hijo, o su pantalla de monedas sale vacía.
- [x] 5.5 Repasar que todo lo sembrado sea un estado que el producto pudiera haber alcanzado, con
      los invariantes del motor delante. Es lo que `add-coin-history` pagó.

## 6. Cierre

- [x] 6.1 Volver a comparar las ocho, texto y tamaños, y dejar escrito lo que sigue sin cuadrar y por
      qué.
- [ ] 6.2 Mirarlo en los dos temas.
- [ ] 6.3 `pnpm verify` entero.
