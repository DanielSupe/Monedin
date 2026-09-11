## 1. La puerta pública

- [x] 1.1 Montar `[data-scale="public"]` en la página, con los pasos que dejó preparados
      `repaint-design-system`. La raíz no adopta la escala de ningún rol.
- [x] 1.2 Llevar el héroe, la franja de confianza, el ciclo de cuatro pasos y el cierre a las piezas y
      los tokens nuevos.
      **La tesela del ciclo de cuatro pasos NO pasa a `IconTile`**, y se dice en vez de callarlo: esa
      pieza toma su medida del objetivo de toque, y estos son cuadros de 48px que nadie pulsa.
      Imponerle un tamaño por `className` es justo lo que el proyecto prohíbe —`cx` no es `twMerge`,
      así que dos utilidades del mismo grupo las resuelve el orden del CSS generado—. Ya usan los
      tokens, que es lo que esta tarea pide.
- [x] 1.3 Las dos maquetas del producto —el panel del padre y el inicio del niño— **construidas con
      las piezas**, cada una con su `data-scale`. Ninguna captura: una imagen envejece en silencio
      cuando un token repinta lo construido.
- [x] 1.4 Test: la raíz no declara escala de rol, y cada maqueta sí declara la suya. Es el requisito
      que ya se estrechó una vez por ser demasiado amplio; que siga estrecho.
- [ ] 1.5 Mirarla a ancho de móvil: titulares que envuelven, rejillas apretadas y texto pequeño. Es la
      pantalla más larga del rediseño y la única que no cabe en una ventana.

## 2. Entrar y crear cuenta

- [x] 2.1 El panel de marca a media pantalla, con la superficie de color del sistema. Los campos
      componen solos sobre ella: la superficie reasigna también las superficies, no solo la tinta.
- [x] 2.2 Comprobar que los avisos dentro del panel recuperan su fondo claro. Es lo que hace el camino
      de vuelta, y en el tema oscuro se invierte — por eso `repaint-design-system` dejó de escribir
      valores ahí.
- [x] 2.3 Conservar la explicación de las dos credenciales en el registro, que ya es un requisito.
- [x] 2.4 Comprobar que el color de la moneda solo aparece como acento y no pinta ninguna superficie
      del panel.

## 3. La rejilla y el PIN

- [x] 3.1 La rejilla con los doce animales dibujados y el realce de la cabecera. Sigue enseñando
      nombre y avatar y **nada más**: ni saldos.
- [x] 3.2 El teclado de PIN con la cabecera de color y la cara del perfil dentro. La tarjeta centrada
      horizontalmente: la mascota acompaña y no cuenta para el centro.
- [x] 3.3 Conservar el comportamiento del teclado físico: la transición sobre el valor actual, no
      leerlo del cierre. Dos teclas seguidas ven el mismo valor y la segunda pisa a la primera.
- [x] 3.4 Comprobar que tras un PIN incorrecto se limpia y se puede reintentar tecleando. Es el
      escenario que una copia razonable del manejo se dejaría fuera.

## 4. El modo administrar

- [x] 4.1 Anunciar el modo en la pantalla, diciendo qué hará tocar un perfil. No solo con el
      distintivo de cada tesela: lo que cambió es el modo, no cada perfil.
- [x] 4.2 Cada tesela dice a qué perfil corresponde y que la acción es editarlo, para quien no ve la
      pantalla.
- [x] 4.3 Conservar que el modo vive en la dirección: el botón atrás sale de él y recargar lo conserva.
- [x] 4.4 Test: en modo administrar la pantalla lo anuncia; fuera de él, no.

## 5. El alta de un perfil

- [x] 5.1 El formulario con los doce animales dibujados.
- [x] 5.2 **Decir que la foto se pone después**, al editar ese perfil, y no dejar el hueco sin
      explicar. Texto al catálogo de mensajes.
- [x] 5.3 Test: el alta dice dónde sí se puede poner la foto. Que falle si solo dice que aquí no —una
      limitación sin salida deja a quien la encuentra sin saber qué hacer.
- [x] 5.4 Comprobar que editar un perfil ya creado SÍ ofrece la foto. Es la otra mitad de lo que la
      explicación afirma, y sin ella el texto podría estar mintiendo.

## 6. Cierre

- [x] 6.1 Ni un estilo en línea, ni un color literal, ni un valor arbitrario en las siete pantallas.
- [ ] 6.2 Abrir las siete en los dos temas. El acceso es donde el tema oscuro tiene el caso más difícil
      —un componente con fondo propio dentro de una superficie de color—, así que se mira ahí primero.
- [ ] 6.3 Recorrer el camino entero con teclado: puerta pública → crear cuenta → rejilla → PIN →
      dentro, y la vuelta por restablecer el PIN. Es el único camino que le queda a quien ya es usuario
      y se le caducó la sesión.
- [ ] 6.4 `pnpm verify`, y si muere con `allocation failure`, con `--concurrency=1`.
