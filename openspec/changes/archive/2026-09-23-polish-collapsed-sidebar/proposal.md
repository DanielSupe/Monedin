# El lateral contraído se ve como lo que es

## Por qué

Contraer la columna deja tres cosas rotas, y las tres son del mismo tipo: piezas
pensadas para la forma ANCHA que nadie volvió a mirar en la estrecha.

1. **Las insignias de cuenta se salen.** La columna contraída mide 71 px y la
   insignia lleva `ml-auto`: el icono y el número se separan hasta los dos bordes,
   así que el icono deja de estar centrado y el número queda medio cortado contra
   el borde. Se ve en la captura que lo reportó.
2. **El pie del perfil dibuja DOS glifos.** El avatar y el icono del destino
   comparten una fila de 47 px de contenido, uno pegado al otro. El icono es
   decorativo y en ancho aclara a dónde va la fila; contraído solo compite con la
   cara.
3. **El control de contraer está abajo del todo.** Es el control del marco y está
   al final de una lista de destinos, debajo del perfil, que es lo último que se
   mira.

## Qué cambia

- **El control de contraer sube a una cabecera propia del lateral**, arriba y
  separada por su borde, como lo pone shadcn. Deja de vivir en el pie.
- **Contraída, la insignia deja de dibujar el número y pasa a ser un punto** en la
  esquina del icono. El número no se pierde: sigue entero para quien no ve la
  pantalla, que es quien ya lo recibía por ahí.
- **Contraído, el glifo del final de una fila se oculta.** Se declara con una
  pieza, `SidebarTrailing`, como ya se declara el nombre con `SidebarLabel`.
- **El aspecto de la insignia se muda al lateral**, `sidebarBadgeClasses()`, que es
  donde vive el de sus hermanos. Estaba escrito dentro de un componente de
  `features/`, que no sabe nada de contraer.

## No incluye

- La cabecera del lateral no lleva título ni logo: el logo ya está en la cabecera
  de la aplicación, justo encima, y repetirlo sería un segundo sitio para el mismo
  hecho.
- No se toca la forma estrecha: allí el lateral es un cajón y no se contrae, así
  que no recibe ni cabecera ni control.
- El estado contraído sigue sin sobrevivir a una recarga. Persistirlo pediría
  almacenamiento del navegador, y la tablet es compartida — la decisión ya está
  tomada y no cambia aquí.
