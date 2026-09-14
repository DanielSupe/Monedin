## Why

Las siete pantallas por las que se pasa **antes de ser alguien** pasan a la forma de `design/ui/`: la
puerta pública, entrar, crear cuenta, la rejilla de perfiles, el teclado de PIN, el alta de un perfil
y la rejilla en modo administrar.

Son el camino de entrada entero, y tienen un problema propio que los otros dos changes no tienen:
**aquí todavía no se sabe quién está delante.** No hay escala del niño ni del padre, no hay saldo, no
hay actor. Lo único que hay es una decisión: ¿esto es de fiar, y quién soy yo aquí?

Tres cosas concretas:

- **La puerta pública no cabe en ninguna escala.** Sus titulares van a 46 y 58 px porque se leen de
  pie y de un vistazo. Meterlos en la escala del niño la deformaría para toda la aplicación por una
  sola pantalla.
- **El modo administrar cambia lo que hace tocar una cara**, y no lo dice. En modo normal, tocar un
  perfil es entrar; en modo administrar es editarlo, y pide el PIN de ESE perfil. La misma pantalla,
  el mismo gesto, dos destinos.
- **El alta de un perfil no puede ofrecer foto**, y hoy no lo explica. Se hace sin perfil activo, así
  que no hay dónde colgar la clave de subida. Un hueco sin explicación se lee como una función rota.

## What Changes

- **La puerta pública se declara como una tercera escala**, `[data-scale="public"]`, con los pasos que
  `repaint-design-system` dejó preparados. Es la única pantalla que la usa, y esa es la razón de que
  exista aparte.
- **Las siete pasan a las piezas del sistema**, con el marco de entrada que ya tienen: logo arriba a
  la izquierda y contenido centrado.
- **El acceso y el registro se pintan con el color de la marca**, no con el del niño. Es la única
  pantalla del producto que mira solo un adulto: la calidez le corresponde al niño, y en la puerta se
  lee como juguete justo donde alguien decide si esto es de fiar.
- **El modo administrar se anuncia en la propia pantalla** y dice qué va a pasar al tocar una cara.
- **El alta de un perfil explica por qué solo ofrece ilustración**, en vez de dejar el hueco.
- **Los doce animales se eligen dibujados**, con la pieza de `add-design-pieces`.

## Capabilities

### Modified Capabilities

- `public-entry`: la página gana una escala propia, distinta de las dos audiencias del producto.
- `profile-selection`: el modo administrar se anuncia y dice qué cambia, y el alta explica lo que no
  puede ofrecer.

## No incluye

- **Resolver la deuda de la foto al crear un perfil.** Sigue sin resolverse, y este change solo la
  EXPLICA. Lo que la bloquea no es nombrar la clave —eso ya está resuelto desde
  `polish-profile-and-reward-image`— sino que el alta ocurre sin perfil activo. Darle una vía de
  subida sería la sexta ruta de solo cuenta, y eso es un change con su propia decisión.
- **Tocar la autenticación, el bloqueo por intentos o el restablecimiento del PIN.** Cambia cómo se
  ven, no qué hacen.
- **Añadir una pantalla de error o de vacío** a este camino. Las que faltan van juntas en su momento,
  no repartidas por los changes de rediseño.
