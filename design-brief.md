# Monedín — brief de diseño completo

> Documento para rediseñar la interfaz de Monedín de punta a punta. Está sacado del código real: las
> 22 pantallas, sus permisos y sus tokens son los que hay hoy, no una propuesta.

---

## 1. Qué es el producto

Monedín es una aplicación de **educación financiera familiar** para Latinoamérica hispanohablante.
Enseña un ciclo completo y muy corto:

```
el padre reparte una tarea  →  el niño la hace y la marca  →  el padre la aprueba
      ↑                                                              ↓
   el padre entrega  ←  el padre aprueba el canje  ←  el niño pide un premio
                                                        con sus monedas
```

Las monedas **no son dinero real**. Pero para un niño de 6 a 11 años son su primera experiencia con
la idea de saldo, y ahí está el criterio de diseño que manda sobre todos los demás: **una tarea que
parece acreditar dos veces, o un canje que parece descontar sin entregar, rompe justo lo que el
producto enseña**.

**Idioma: todo en español.**

### Las dos personas que lo usan

| | **El padre** | **El niño (6–11)** |
| --- | --- | --- |
| Qué hace | reparte, aprueba, publica premios | hace tareas, ahorra, pide premios |
| Cuánto tiempo | ráfagas cortas, varias al día | ratos, con calma |
| Qué necesita ver | qué le espera, y resolverlo rápido | cuánto tiene y cuánto le falta |
| Densidad | alta, escaneo rápido | grande, pocas cosas, todo tocable |

**El dispositivo principal es una tablet compartida por toda la familia.** No hay un móvil por
persona. Eso tiene consecuencias de diseño reales:

- Se cambia de perfil varias veces al día — no es un caso raro, es el uso normal.
- Cualquiera puede coger la tablet desbloqueada, así que **cada perfil se protege con un PIN de 4
  dígitos**.
- Hay hermanos mirando la misma pantalla. **Un niño nunca puede ver los datos de su hermano.**

---

## 2. Cómo se entra: tres marcos distintos

Esto no es un detalle técnico, es la estructura de la aplicación. Hay **tres envoltorios** y una
pantalla pertenece a uno solo:

### Marco A — la puerta pública

Una sola pantalla, a sangre (ancho completo), sin navegación. Es lo único que ve alguien que todavía
no es nadie.

### Marco B — el camino de entrada (`EntryShell`)

Logo arriba a la izquierda, contenido centrado en los dos ejes, **sin navegación**. Son las pantallas
por las que se pasa *antes de ser alguien*. Cada una declara su propio ancho: un formulario estrecho
y una rejilla de caras no quieren lo mismo.

### Marco C — dentro de un perfil

Aquí sí hay navegación: **un lateral izquierdo** con todos los destinos del rol, texto a la izquierda
e icono a la derecha de cada uno.

- **En pantalla ancha (≥1024px)**: el lateral está SIEMPRE visible, y se puede contraer a solo
  iconos con un botón en su pie.
- **En pantalla estrecha**: se esconde detrás de un botón de menú y se abre como cajón; se cierra
  solo al llegar al destino.
- **Cabecera**: botón de menú (solo en estrecho) + logo a la izquierda, **avatar del perfil activo a
  la derecha** — que además de llevar al perfil responde a *quién está usando esta tablet*.

Este marco viene en **dos escalas** según quién esté dentro (ver §5).

---

## 3. Las 22 pantallas

### Marco A — pública (1)

**1. `/welcome` — La puerta.**
Recibe a DOS personas distintas y las dos acciones pesan **igual**: quien no conoce el producto
(«Empezar») y quien ya es usuario y se le caducó la sesión («Entrar»). Titular, explicación del
ciclo, una visualización animada del ciclo (tareas → moneda → premio) y tres promesas cortas:
*«Haz tus tareas» · «Elige tu premio» · «Tú apruebas»*. Lleva su propio encabezado con la marca.

### Marco B — camino de entrada (5)

**2. `/sign-in` — Entrar.** Correo y contraseña.
**3. `/sign-up` — Crear cuenta.** Nombre, correo, contraseña **y PIN de adulto**.

> Las dos van sobre **índigo profundo**, y son las únicas del producto que lo hacen. La razón es de
> producto: son las únicas pantallas que mira un adulto que aún no confía. La calidez le corresponde
> al niño; aquí, el ámbar pintando media pantalla se lee como juguete justo donde alguien decide si
> esto es de fiar. El ámbar se queda como **acento** — el botón y la moneda —, que es donde significa
> «dinero».
>
> El registro pide **dos credenciales** y **tiene que explicar para qué sirve cada una**: la
> contraseña solo al vincular un dispositivo nuevo; el PIN, cada vez que entras a tu perfil. Sin esa
> explicación parece un error del producto.

**4. `/profiles` — La rejilla de perfiles.** Estilo Netflix: cuadrados redondeados de 9rem con el
avatar, el nombre debajo, y una **corona** que distingue al del padre. Realce al pasar por encima.
Un modo «administrar» (un lápiz sobre cada perfil) que vive en la dirección, no en el estado.

> **Decisión cerrada: el saldo NO se ve aquí.** Se propuso y se descartó por dos razones —cualquiera
> con la tablet desbloqueada vería todos los saldos sin teclear un PIN, y **los hermanos se
> compararían cada vez que se abre la aplicación**—. No se reabre sin un argumento nuevo sobre lo
> segundo.

**5. `/profiles/$id/pin` — El teclado de PIN.** Cuatro dígitos, botones grandes. Un niño de seis años
lo usa varias veces al día.

**6. `/profiles/new` — Crear un perfil de hijo.** Nombre, PIN, edad (opcional) y **elegir un animal**
del catálogo. Se llega desde la rejilla, sin haber entrado a ningún perfil: una familia recién
registrada tiene que poder añadir a sus hijos sin trámites.

**7. `/profiles/reset-pin` — Restablecer el PIN de adulto.** La vía de rescate de un padre bloqueado
fuera de su propio perfil. Pide contraseña + PIN nuevo, y **tiene que explicar cada una**.

### Marco C — el padre (10)

**8. `/` — Panel.** *Lo primero que ve.* No es un menú: dice **qué le espera**.
- «N tareas por aprobar» y «N canjes esperando respuesta» — solo si son > 0; con las dos a cero, una
  frase: *«Todo al día»*.
- El **saldo de cada hijo**, en una lista con su avatar.
- Cambiar de perfil.

**9. `/tasks` — Bandeja de tareas.** Agrupadas por **reparto** (las tareas que nacieron del mismo
acto: «Recoger la mesa» para tres hijos = un reparto con tres filas). Filtro por estado: Todas ·
Pendientes · Por aprobar · Aprobadas. Cada fila: avatar del hijo, sus monedas, su estado. **Si la
tarea trae foto, la foto va ANTES de los botones** — es para decidir con ella, no después.
Aprobar/rechazar solo en las que esperan; borrar solo en las pendientes.

**10. `/tasks/new` — Repartir una tarea.** Título, detalles, fecha límite, y **a quién y por cuánto**:
elegir hijos con casillas, y o bien el mismo valor para todos o uno por hijo.

**11. `/rewards` — Catálogo de premios.** Filtro Activos · Retirados. Cada premio es una tarjeta con
foto, título, y **a quién se le ofrece y a qué precio** (un mismo premio puede costar distinto a cada
hijo). Se edita **en línea**, dentro de la tarjeta. Retirar se confirma en diálogo.

**12. `/rewards/new` — Publicar un premio.** Igual que repartir una tarea, con precio en vez de valor.

**13. `/redemptions` — Bandeja de canjes.** Lo que los hijos han pedido. Filtro Todos · Pendientes ·
Aprobados · Rechazados. Aprobar **descuenta**; rechazar es terminal y **no devuelve nada**, porque el
descuento solo ocurre al aprobar.

**14. `/children` — Perfiles de la familia.** Cada hijo con avatar, nombre, edad, saldo y estado.
Acciones: editar, reponer su PIN, desbloquear (solo si está bloqueado), dar de baja. **La baja no se
deshace y se confirma en diálogo.**

**15. `/children/new` y 16. `/children/$id/edit`** — Alta y edición de un perfil.

**17. `/account` — Mi cuenta.** Su foto, cambiar su PIN de adulto, y **cerrar sesión**.

> Cerrar sesión vive aquí y **no** junto a «cambiar de perfil». Se parecen y no lo son: cambiar de
> perfil vuelve a la rejilla varias veces al día y sin credenciales; cerrar sesión obliga a teclear
> correo y contraseña. Juntas y del mismo tamaño es como un padre acaba tecleando su contraseña
> porque solo quería pasarle la tablet a su hijo.

### Marco C — el niño (5)

**18. `/` — Su inicio.** **Su saldo, en grande y lo primero** (4rem). Es lo que el producto entero
existe para enseñar. Debajo, cuatro destinos como tarjetas grandes con su emoji.

**19. `/me/tasks` — Mis tareas.** Sus tareas y nada más: **sin repartos y sin hermanos**. Tres
estados que tienen que **verse distintos**: pendiente · hecha, esperando revisión · aprobada. Solo la
pendiente ofrece «Ya la hice», y puede adjuntar una foto — opcional a propósito: es para enseñar el
trabajo, no un peaje.

**20. `/me/rewards` — Mis premios.** Lo que se le ofrece a él, a SU precio. Si no le alcanza, **una
barra de progreso con cuánto le falta** — ver la distancia a una meta es la mitad del ciclo que el
producto enseña. Si le alcanza, «Pedirlo». Si ya lo pidió, lo dice y no deja pedirlo otra vez.

**21. `/me/redemptions` — Mis canjes.** Sus solicitudes con su estado. **Rechazado va en ámbar, no en
rojo**: que su padre le diga que no a un premio no es un error suyo.

**22. `/me/settings` — Mi perfil.** Su foto o su animal, y cambiar su PIN.

---

## 4. Reglas de interacción que el diseño tiene que respetar

Estas no son preferencias: salen de cómo funciona el producto por dentro.

1. **Lo que se ve y lo que se puede hacer van juntos.** Nunca se ofrece un botón que la operación va
   a rechazar. Una tarea aprobada no ofrece aprobarla; un canje resuelto no ofrece resolverlo; un
   perfil sin bloquear no ofrece desbloquearlo.

2. **Un niño con una tablet lenta va a tocar dos veces.** Si dos toques compiten, el segundo recibe
   «alguien se adelantó» — y eso se cuenta en **ámbar (advertencia), nunca en rojo**. Nadie hizo nada
   mal. El rojo se reserva para «algo falló».

3. **La ceremonia se mide contra lo que cuesta deshacer.** Dar de baja un perfil no se deshace →
   diálogo modal. Retirar un premio se revierte publicándolo → también diálogo. Marcar una tarea →
   un botón.

4. **Estados en tres niveles, no dos.** Todo listado necesita: cargando (esqueleto), vacío (una frase
   con salida, nunca un hueco) y error. **El vacío es frecuente y significa cosas distintas**: un
   niño sin tareas no es lo mismo que un catálogo sin premios.

5. **El color nunca lleva el significado solo.** Todo estado se lee también sin distinguir colores.

6. **El movimiento, siempre opcional.** Cualquier animación respeta «reducir movimiento», y **siempre
   queda un realce que no es movimiento** (color) encendido en los dos casos.

7. **El rol equivocado redirige en silencio.** Un niño que abre una dirección del padre aterriza en su
   inicio, **sin mensaje**: a los siete años «no tienes permiso» se lee como «hiciste algo mal».

---

## 5. Sistema visual actual

> Lo puedes cambiar entero. Va aquí para que sepas qué estructura tiene que salir del rediseño.

### La doble escala — la idea central

**Las mismas piezas sirven a las dos audiencias cambiando solo el contenedor.** No hay componentes
«de niño» y «de padre»: hay un atributo en el marco que reasigna tamaños, radios y áreas de toque.

| | **Padre** | **Niño** |
| --- | --- | --- |
| Cifra grande | 1.75rem | **4rem** |
| Título | 1.375rem | 1.75rem |
| Cuerpo | 1rem | 1.125rem |
| Radio de tarjeta | 0.75rem | **1.5rem** |
| Área de toque mínima | 2.5rem | **2.75rem** |

**Si aparecen dos piezas cuya única diferencia es la audiencia, es un defecto.**

### Paleta (formato OKLCH)

```
Superficies    fondo    oklch(98.5% 0.003 265)     casi blanco, frío
               tarjeta  oklch(100% 0 0)            blanco
               hundido  oklch(96.5% 0.005 265)
Tinta          normal   oklch(25% 0.024 265)
               apagada  oklch(58% 0.018 265)
Bordes         suave    oklch(92% 0.008 265)
               fuerte   oklch(85% 0.012 265)

Acción         índigo   oklch(55% 0.19 275)        botones, enlaces, activo
               suave    oklch(94% 0.03 275)        fondo del destino activo

Marca          profundo oklch(31% 0.11 272)        SOLO acceso y registro
                        oklch(40% 0.15 273)        pie del degradado

MONEDA         ámbar    oklch(80% 0.16 80)         ← el color del dinero
               tinta    oklch(45% 0.11 70)
               suave    oklch(96% 0.05 85)

Avisos         info     oklch(52% 0.15 245)  fondo oklch(95% 0.03 240)
               éxito    oklch(52% 0.14 150)  fondo oklch(95% 0.04 150)
               aviso    oklch(52% 0.14 55)   fondo oklch(96% 0.04 65)   ← el 409, el rechazo
               peligro  oklch(52% 0.2 27)    fondo oklch(95% 0.03 25)   ← solo fallos de verdad
```

**El ámbar es el dinero.** No se usa para nada más. Es la razón de que el acceso lo quitara del
fondo: pintando media pantalla no significaba nada.

### Tipografía

**Nunito variable**, autoalojada. Una sola familia — la doble escala ya distingue a las dos
audiencias por tamaño y peso. **Las cantidades de monedas se dibujan con cifras tabulares** para que
una columna de saldos alinee.

### Piezas que ya existen

`Alert` · `Avatar` · `Badge` · `Button` · `Card` · `Coins` · `Dialog` · `Drawer` · `EmptyState` ·
`Field` · `Input` · `Logo` · `Pagination` · `ProgressBar` · `Select` · `Skeleton` · `Tabs` · `Toast`

- `Button`: primario · secundario · fantasma · peligro · contraste (para fondos de marca)
- `Badge` y `Alert`: neutro · info · éxito · aviso · peligro
- `Avatar`: círculo o cuadrado redondeado; catálogo de animales o foto subida
- `Coins`: la cantidad + su unidad, siempre juntas

### Restricciones técnicas que afectan al diseño

- **Nada viene de un tercero.** Ni una tipografía de CDN, ni un icono remoto. Todo se sirve desde la
  propia aplicación.
- **Todo valor visual sale de un token.** Nada de colores ni medidas sueltas en una pantalla.
- **Las fotos son URLs firmadas de vida corta**: se pueden mostrar, pero caducan.

---

## 6. Qué necesito de ti

Un rediseño completo de **las 22 pantallas**, en los **dos tamaños**: escritorio/tablet y móvil
(390px). Para cada una:

1. **Los tres estados**: con datos, vacía, y cargando. Y el de error donde tenga sentido.
2. **Las dos escalas** donde aplique: las pantallas del niño y las del padre no se ven igual.
3. **El sistema antes que las pantallas**: paleta, escala tipográfica, radios, sombras, espaciado y
   los estados de cada pieza (reposo, hover, foco, pulsado, deshabilitado, cargando). Si dos
   pantallas necesitan algo parecido, tiene que ser **la misma pieza**.
4. **Iconografía propia**, coherente, para los destinos de la navegación (inicio, tareas, premios,
   canjes, hijos, cuenta, perfil) y para los estados.
5. **Las ilustraciones que faltan**: los estados vacíos usan hoy emojis de relleno.

### Lo que más me importa, en orden

1. **Que el niño entienda su saldo y cuánto le falta** de un vistazo, sin leer.
2. **Que el padre resuelva lo que le espera en pocos toques**, sin buscarlo.
3. **Que el acceso transmita que esto es serio** — es lo único que ve un adulto antes de decidir si
   se fía.
4. **Que se pueda usar con el dedo, en una tablet, por alguien de seis años.**

### Lo que NO quiero

- Que las pantallas del niño y las del padre acaben siendo **componentes distintos** en vez de la
  misma pieza a otra escala.
- Que el ámbar deje de significar «dinero» y se convierta en un color decorativo más.
- Que un estado se distinga **solo** por el color.
- Que el saldo de un niño aparezca en la rejilla de perfiles (ver la decisión cerrada en §3).
