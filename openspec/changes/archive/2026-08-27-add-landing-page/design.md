## Context

Ver `proposal.md` — Why.

Lo que condiciona el cómo y no está en la proposal:

- **La referencia es de otro producto.** El punto de partida fue la maqueta de una landing B2B
  —Marketeam, una plataforma de talento de marketing—, y **todos sus assets son suyos**: la imagen de
  fondo, los retratos que orbitan y los logos de la franja apuntan a `figma.site`, `higgs.ai` y un
  CloudFront ajeno. No se puede usar ninguno.
- **El sistema de diseño ya decide casi todo.** `tokens.css` tiene 22 tokens de color, la doble
  escala y el bloque de movimiento reducido. Una página nueva no debería necesitar inventar nada.
- **`app/` existe desde `add-app-shell`** y es donde viven los marcos. La landing no es un marco ni
  una pantalla de negocio, y hay que decidir dónde cae.
- **El bloque de `prefers-reduced-motion` pone toda duración a 1ms.** Eso funciona para una
  transición, pero **congela** una animación continua a medio recorrido en vez de detenerla bien.
- **Las guardas están centralizadas** en `guards.ts` con tres constantes de destino. Cambiar el de
  «sin sesión» es una línea.

## Goals / Non-Goals

**Goals:**

- Que alguien que no conoce Monedín entienda el producto sin dar un dato.
- Que quien ya es usuario y perdió la sesión entre sin fricción.
- Que la página se construya con lo que ya hay: cero dependencias, cero colores nuevos.
- Que el movimiento explique el producto y desaparezca bien cuando se pide.

**Non-Goals:**

- Convertir esto en un sitio. Es un héroe.
- Traer la identidad visual definitiva: eso es `polish-brand-and-a11y`.
- Tocar la API. La landing no hace una sola petición.

## Decisions

### 1. `/welcome` es una dirección propia, y todo lo demás redirige a ella

**Elegido**: la landing vive en `/welcome`, y el destino de «sin sesión» de las guardas pasa de
`/sign-in` a `/welcome`.

```
                       ANTES                    DESPUÉS
   /          sin sesión → /sign-in     sin sesión → /welcome
   /tasks     sin sesión → /sign-in     sin sesión → /welcome
   /me/tasks  sin sesión → /sign-in     sin sesión → /welcome
   /profiles  sin sesión → /sign-in     sin sesión → /welcome

   /sign-in   sigue existiendo, alcanzable desde la landing
```

**Por qué una constante y no una excepción en `/`**: se consideró que solo la raíz llevara a la
landing y que los enlaces profundos siguieran yendo al formulario, con el argumento de que quien
guardó `/me/tasks` ya conoce el producto. Se descartó: una regla con una excepción hay que recordarla,
y el coste de la excepción —que quien perdió la sesión vea una página que ya conoce— se paga con un
solo toque, mientras que el coste de olvidarla es una ruta que se comporta distinto sin motivo.

**Por qué `/welcome` y no servir la landing en `/`**: `/` es hoy el inicio con actor y el destino al
que redirigen todas las guardas, con nueve enlaces apuntando. Darle una segunda responsabilidad
—landing sin sesión, inicio con ella— haría que su guarda dejara de ser un `requireActor` limpio. Con
una dirección propia, cada página hace una cosa y la redirección es visible en la barra.

**Consecuencia que hay que asumir y diseñar**: la landing recibe a dos públicos opuestos. Ver
decisión 3.

### 2. Qué se toma de la referencia y qué se tira

```
   SE CONSERVA                        SE DESCARTA
   ───────────                        ───────────
   héroe izquierda / visual derecha   imagen de fondo a pantalla completa
   órbitas concéntricas               retratos de profesionales
   cuenta animada en el centro        borde de gradiente cónico rotatorio
   máquina de escribir del titular    Inter + Urbanist de Google Fonts
   aparición escalonada               franja de logos de socios
                                      paleta oscura #060218
```

**El criterio**: se conserva la **estructura**, que es lo que hace que la página se lea de un vistazo,
y se descarta la **estética**, que pertenece a otro producto y a otro público.

**El borde cónico merece explicación** porque es lo más llamativo de la referencia y descartarlo
parece una pérdida. Es el recurso que más marca el tono de herramienta técnica: un anillo de gradiente
girando alrededor de un botón. En una página cuyo público objetivo son padres de niños de seis a once
años, dice exactamente lo contrario de lo que el producto es.

**Las fuentes también**: la referencia pide Inter y Urbanist de Google. El sistema de diseño usa a
propósito la pila del sistema y difiere la tipografía de marca a `polish-brand-and-a11y`. Traerlas
aquí solaparía dos changes y metería una petición de red en la primera pantalla que alguien ve.
Cambiarlas después es **una línea**: `--font-sans` en `tokens.css`.

### 3. La página recibe a dos públicos, y el diseño lo reconoce

Como todo destino sin sesión lleva aquí, la landing recibe a la vez a quien nunca oyó hablar del
producto y a quien lo usa a diario y perdió la sesión.

**Elegido**: dos acciones de primer nivel, no una principal y un enlace pequeño.

```
   [Logo] Monedín                    [ Entrar ]   [ Empezar → ]
                                     ↑            ↑
                                     ya es usuario  todavía no
```

**Por qué**: la proporción se invierte con el tiempo. El primer mes casi todo el mundo es nuevo; a
los seis meses, la mayoría de quien llega a esta página es alguien cuya sesión caducó. Un diseño que
optimiza solo para la conversión inicial envejece mal, y el coste de equivocarse lo paga a diario
quien ya se registró.

### 4. Lo que orbita es el ciclo, no la gente

**Elegido**: tres órbitas alrededor de un saldo central con la cuenta animada.

```
   centro     🪙 340   «tus monedas»        el saldo, que es la fuente de verdad
   órbita 1   tareas                        el esfuerzo
   órbita 2   premios                       la decisión de gasto
   órbita 3   los perfiles de la familia    quién participa
```

**Por qué**: la visualización de la referencia orbita retratos porque su producto **es** gente
—talento de marketing—. El nuestro es un ciclo, y una órbita es exactamente la forma de dibujar algo
que da vueltas: se hace una tarea, se gana una moneda, se gasta en un premio, se vuelve a empezar. La
metáfora encaja por casualidad y sería una pena desperdiciarla decorando.

**Descartado — los doce animales del catálogo**: es lo más reconocible del producto, pero **hoy son
emojis**. Doce emojis girando en la primera pantalla se ve barato, y las ilustraciones de verdad son
del change 12.

**Descartado — fotos de familias**: requiere banco con licencia, y poner caras de niños desconocidos
en la puerta de una app infantil es una decisión que no se toma por defecto.

### 5. `Logo` va en `ui/`, y estrena tres consumidores a la vez

**Elegido**: `apps/web/src/ui/Logo.tsx`, una marca tipográfica con un símbolo de moneda dibujado por
nosotros en SVG.

**Por qué en `ui/` y no en `features/landing/`**: no sabe de dominio, ni de rutas, ni de sesión, así
que cumple la frontera que el test de `add-design-system` comprueba, y el catálogo vivo puede montarlo
sin proveedores. Y sobre todo: **lo usan tres sitios**, no uno. Hoy los dos marcos escriben «Monedín»
como texto suelto; en cuanto exista la pieza, dejan de hacerlo.

**Por qué SVG propio y no una ilustración**: la identidad visual es del change 12. Esto tiene que ser
sustituible sin tocar a quien lo usa, que es justo lo que da tenerlo en una pieza con una interfaz
estable.

**Obligación heredada**: como toda pieza de `ui/`, lleva su test y su entrada en el catálogo vivo, o
falla el test que enumera lo exportado por `ui/index.ts`.

### 6. El movimiento reducido necesita estado final, no duración cero

El bloque de `tokens.css` pone `animation-duration: 1ms !important` en todo. Para una transición está
bien. Para lo de esta página, **no**:

| Animación | Con duración 1ms | Lo que hace falta |
|---|---|---|
| Máquina de escribir | Se queda en el primer carácter | El titular completo |
| Cuenta del saldo | Se queda en 0 | El número final |
| Órbitas | Congeladas donde toque | Quietas en posición estable |

**Elegido**: cada uno de los tres declara su estado final por su cuenta.

- Los dos hooks consultan la preferencia y **devuelven el valor final de entrada**, sin animar.
- Las órbitas se detienen con `animation-play-state: paused` en su posición inicial, no a mitad.

**Por qué en los hooks y no solo en CSS**: la máquina de escribir y la cuenta son estado de React, no
propiedades animadas. Ninguna regla de CSS puede arreglarlas; tienen que saberlo ellas.

### 7. La landing va en `features/`, aunque no sea negocio

**Elegido**: `apps/web/src/features/landing/`.

**Por qué no en `app/`**: esa capa son los marcos —lo que rodea a todo—, y la landing es una pantalla
que se rinde dentro, no alrededor.

**Por qué no en `ui/`**: conoce las rutas a las que enlaza y el mensaje del producto.

**Consecuencia buena**: al ser código nuevo, `features/landing/` **no** entra en la lista de deuda de
estilos en línea. Nace bajo la regla general, igual que `app/` en el change anterior.

### 8. Tres defectos encontrados al implementar

Ninguno se vio en los tests; los tres los cazó abrir la página y mirarla.

**Las órbitas no eran concéntricas.** Cada anillo es `absolute` dentro de un
contenedor con `place-items-center`, y **el centrado de un grid no afecta a un hijo absoluto**: cada
uno caía en el origen del contenedor, así que sus centros quedaban en (96,96), (152,152) y (208,208).
Las piezas se esparcían por la pantalla y una llegó a tapar el botón de la cabecera. Se arregla con
`inset-0 m-auto`, que centra sin tocar `transform` —ocupado por la animación de giro—.

**El titular acaparaba el ancho.** La visualización se quedó en 264px de los ~536 que le tocaban,
porque el `min-width: auto` del flex impide que una columna con texto largo se encoja por debajo de
su contenido. Es **el mismo defecto** que apareció en los marcos de `add-app-shell`, y la misma cura:
`min-w-0` en la columna de texto. Conviene registrarlo porque ya van dos veces.

**La landing estaba dentro del contenedor de lectura.** La raíz envuelve lo previo a tener un rol en
`max-w-(--container-reading)` —640px, correcto para un formulario—, y una página a sangre completa no
puede vivir ahí. Se resuelve con `staticData: { fullBleed: true }` **en la ruta**, y no con un `if`
sobre la dirección en la raíz: una dirección escrita a mano se desincroniza el día que alguien
renombre la ruta, y el typecheck no lo vería.

### 9. Navegar es trabajo de un enlace, y la pieza ahora lo permite

Las llamadas a la acción se escribieron como `<Link><Button/></Link>`, que **anida dos elementos
interactivos**: un lector de pantalla anuncia un enlace que contiene un botón. Es el mismo defecto que
ya había aparecido en el 404 de `add-app-shell`, y volvió a colarse aquí.

La primera vez se arregló al revés —un botón que navega—, y eso pierde lo que un enlace da gratis:
abrir en otra pestaña, copiar la dirección, y que se anuncie como lo que es.

**Elegido**: `Button` exporta `buttonClasses(variant, block)`, y un `Link` se viste igual sin dejar de
ser un enlace. El 404 se corrige también para que las dos pantallas hagan lo mismo.

**Por qué no un componente `LinkButton`**: sería una pieza nueva en `ui/` que solo existe para
combinar dos cosas que ya están, y `ui/` no conoce el router. Una función que devuelve clases no
necesita saber a dónde se navega.

## Risks / Trade-offs

- **Quien perdió la sesión ve una página que ya conoce** → Asumido y mitigado por la decisión 3: la
  entrada es de primer nivel, así que cuesta un toque. Si con el tiempo resulta molesto, la
  alternativa —excepción para los enlaces profundos— sigue estando a una línea.
- **Una landing sin imágenes propias puede quedar sosa** → Lo que la sostiene es la visualización
  orbital, que es contenido y no relleno. Y la alternativa era usar assets de otro producto.
- **Tres animaciones simultáneas en la primera pantalla pueden ir a tirones en un móvil modesto** →
  Se usa `transform` y `opacity`, que la GPU compone, y nunca propiedades que provoquen recálculo de
  disposición. Se comprueba en un viewport de móvil, no de memoria.
- **Cambiar el destino de las guardas toca dos tests existentes** → Es lo correcto: las aserciones
  siguen al comportamiento decidido. Lo que no puede pasar es lo contrario.

## Migration Plan

1. `Logo` en `ui/`, con su test y su entrada en el catálogo. Todavía no lo usa nadie.
2. Los dos marcos pasan a usarlo. Cambio visual mínimo y verificable por separado.
3. Los dos hooks, con sus tests, incluido el caso de movimiento reducido. Sin pantalla aún.
4. La landing y su ruta pública. Alcanzable solo tecleando la dirección.
5. **Y solo entonces** el cambio de destino de las guardas, con sus dos tests. Es el último paso a
   propósito: hasta que la landing exista y esté bien, mandar gente ahí sería mandarla a nada.

**Vuelta atrás**: revertir la constante de las guardas devuelve el comportamiento anterior sin tocar
nada más. La landing quedaría accesible por su dirección y sin tráfico.

## Open Questions

Ninguna.

## Decisiones que este change NO toma

- **La identidad visual definitiva** —tipografía, ilustraciones, logo final—: `polish-brand-and-a11y`.
- **Si `/` debe servir la landing** en lugar de redirigir: se decide cuando la página exista y se
  pueda mirar.
- **Qué más va en la puerta pública** —precios, testimonios, un pie— el día que haga falta un sitio y
  no un héroe.
