## Context

Ver `proposal.md` para el porqué, `specs/` para los requisitos y `design/ui/pantallas/` para las siete
pantallas dibujadas. Las restricciones:

1. **Aquí no hay actor.** No hay escala de rol, no hay saldo y no hay perfil: son las pantallas por
   las que se pasa antes de ser alguien.
2. **El marco de entrada ya existe** y no se lista quién lo recibe: es la última rama de la raíz, o
   sea todo lo que llega sin actor. Añadir una lista sería empezar una que alguien tendrá que
   mantener.
3. **Un marco centra; el ancho lo declara cada pantalla.** Ya se intentó imponerlo desde el marco y
   partía la rejilla en dos filas.
4. **El modo administrar vive en la dirección**, no en estado: la intención cruza hasta el teclado de
   PIN, el botón atrás sale del modo y recargar lo conserva.
5. **Las dos rutas de perfiles exigen que no haya perfil activo.** Si la rejilla admitiera uno ya
   dentro, el lápiz sobre otro perfil aterrizaría en sus ajustes sin pedir ningún PIN.

## Goals / Non-Goals

**Goals**

- Que la puerta pública se lea como lo que es, sin deformar las escalas del producto.
- Que el modo administrar diga que el gesto cambió de significado.
- Que la foto que no se puede poner al crear un perfil no se lea como algo roto.

**Non-Goals** (además de lo que excluye el proposal)

- Resolver la deuda de la foto al crear un perfil.
- Cambiar el bloqueo por intentos, el restablecimiento del PIN o la sesión.

## Decisions

### 1. La puerta pública es una tercera audiencia, no una excepción

Sus titulares van a 46 y 58 px. Meterlos en la escala del niño la deformaría para toda la aplicación;
escribirlos a mano sería un valor arbitrario, que un test prohíbe.

Se declara `[data-scale="public"]`, con el mismo mecanismo que las otras dos. Que solo la use una
pantalla no es un argumento en contra: es la razón de que exista aparte.

**Y la raíz de la página sigue sin adoptar la escala de un rol.** Dentro hay maquetas que enseñan las
dos audiencias, y cada una declara la suya — eso es contenido que ilustra la diferencia, no la página
adoptando un rol. La afirmación anterior de que la página «no lleva ninguna escala» era demasiado
amplia y ya se estrechó una vez; se conserva estrechada.

### 2. El acceso va en el color de la marca, no en el del niño

Es la única pantalla del producto que mira SOLO un adulto. La calidez le corresponde al niño —su
inicio, sus tareas, sus premios— y en la puerta se lee como juguete justo donde alguien decide si esto
es de fiar.

El color de la moneda no desaparece: cambia de papel. Pintando media pantalla no decía nada; sobre la
superficie de marca, un punto de ese color **es dinero**.

La rejilla, el PIN y la puerta pública siguen claros: ahí ya no se está decidiendo si fiarse, se está
entrando.

### 3. El modo administrar se anuncia, y no solo con un distintivo

Es la misma pantalla y el mismo gesto con dos destinos. Un lápiz pequeño sobre cada cara dice «esta
tesela se puede editar», no «tocar ya no es entrar».

El anuncio va en la pantalla porque lo que cambió es el MODO, no cada perfil. Ponerlo en cada tesela
repetiría cuatro veces algo que pasó una.

### 4. La deuda de la foto se explica, no se resuelve

Lo que la bloquea no es nombrar la clave —eso se resolvió al desatascar la foto en el alta de un
premio— sino que el alta de un perfil ocurre **sin perfil activo**: es la quinta ruta de solo cuenta,
y su vía de subida sería la sexta.

Que un problema se parezca a otro ya resuelto no significa que le sirva la misma solución. Lo que hay
que comparar es qué tiene cada uno disponible en el momento de actuar, y aquí uno tiene actor y el
otro no.

Así que este change hace lo único que puede hacer sin decidir eso: **decirlo, y decir dónde sí se
puede**. Una limitación sin salida deja a quien la encuentra sin saber qué hacer.

## Risks / Trade-offs

- **Una tercera escala es un eje más que mantener.** Se acepta porque el mecanismo ya existe y porque
  la alternativa —deformar la del niño— es peor.
- **Explicar la limitación de la foto la hace más visible.** Es preferible: hoy se lee como un fallo,
  y un fallo aparente cuesta más que una limitación explicada.
- **La puerta pública es la pantalla más larga del rediseño** y la única que no cabe en una ventana.
  Es correcto para lo que es, y es la única con esa forma.

## Open Questions

- Ninguna que bloquee. La deuda de la foto al crear un perfil sigue abierta y sigue teniendo dueño:
  un change propio, con las dos vías y sus precios ya medidos.
