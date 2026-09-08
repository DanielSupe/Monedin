## Context

Ver `proposal.md` para el porqué y `specs/` para los requisitos. Lo que este documento tiene que
establecer son las restricciones que descartan la solución directa:

1. **El ámbar estaba reservado**, y la maqueta de referencia lo usa para cada respuesta. La reserva
   vive en dos comentarios de `tokens.css` y en un párrafo de CLAUDE.md — en ningún test.
2. **ESLint prohíbe el prop `style`**, con cuatro excepciones declaradas. Esta pantalla no puede
   pedir la quinta: ni el globo ni el panel necesitan una medida calculada.
3. **Ningún valor arbitrario de Tailwind y ningún color literal.** Los dos los caza un test que
   escanea el archivo entero, no solo los `className`.
4. **Dos formas de una misma cosa no se montan a la vez** con una escondida por CSS. Es la regla que
   `pin-sidebar-on-desktop` pagó y que `useIsWide()` existe para cumplir.

## Goals / Non-Goals

**Goals**

- Que se vea quién habla sin leer nada.
- Que cambiar de tema no exija escribir.
- Que la reserva del ámbar deje de depender de que alguien recuerde un comentario.

**Non-Goals** (además de lo que excluye el proposal)

- Tocar el módulo de la API, el contrato o los guiones.
- Extraer piezas nuevas al sistema de diseño. Ver la decisión 5.

## Decisions

### 1. El ámbar se reasigna, y se dice qué regla se rompe

**Lo que había escrito**, en `tokens.css`: *«Ámbar: la MONEDA, y solo la moneda»* y *«Reservada: si el
ámbar también pinta botones genéricos, deja de significar monedas»*. Y en CLAUDE.md: *«sobre índigo,
un punto ámbar es dinero»*.

**Lo que se hace**: los globos de Monedín van en ámbar suave, como la maqueta.

**El argumento, que es lo que hace que esto no sea saltarse la regla sino reescribirla**: la reserva
existía para que el ámbar no se gastara en cosas que no son dinero. Monedín **es** una moneda —lo es
literalmente, es el personaje— así que su voz llevando el color del dinero no lo diluye: apunta al
mismo referente. Lo que la regla prohibía sigue prohibido, palabra por palabra: un botón cualquiera,
una tarjeta cualquiera, un aviso cualquiera.

**Y la reversión se paga con una mejora, no con una excepción**: la reserva pasa de comentario a
**test con lista cerrada de archivos autorizados**. Antes decía «no pintes botones de ámbar» y nada lo
comprobaba; ahora un archivo no listado que use la utilidad hace fallar la verificación. La regla sale
de este change más fuerte que entró, que es la única forma honesta de relajarla.

**Alternativa descartada**: globos neutros y ámbar solo en el avatar pequeño. Respeta la letra sin
tocar nada y se parece menos a la referencia. Se descarta porque el argumento de arriba **es cierto**,
y esconderse detrás de la letra para no tener que escribirlo habría dejado la regla intacta y el
razonamiento sin hacer.

### 2. El globo es posición **y** color **y** etiqueta, no una de las tres

Tres señales a la vez, y cada una cubre lo que las otras no:

- **Posición** —lo propio a la derecha, lo de Monedín a la izquierda— es lo que se lee de un vistazo,
  sin procesar color ni texto.
- **Color** distingue con la pantalla en blanco y negro, o para quien no separa bien dos tonos.
- **La etiqueta escrita se QUEDA**, aunque ahora no haga falta mirarla: es lo único de las tres que
  oye quien no ve la pantalla. El requisito vigente de que la respuesta se atribuya *«y no solo
  distinguida por un color»* seguía valiendo, y hay que no romperlo por hacerlo más bonito.

**Y el globo no ocupa el ancho completo**: se ciñe a su texto con un tope. Un bloque de borde a borde
no se lee como algo que alguien dijo.

### 3. El panel se queda, y en estrecho NO EXISTE

**CORREGIDO AL VER LA PANTALLA MONTADA.** Este design decía «al lado con ancho, DEBAJO sin él». Al
mirarlo en un teléfono se vio que debajo no cabe: la mascota y las tres píldoras se comen el alto que
necesita lo único que se va a leer ahí, que es la conversación. En estrecho la pantalla es el chat y
nada más.

Se **NO MONTAN**, no se esconden con CSS: seguirían existiendo para quien recorre el documento con
teclado. Lo decide `useIsWide()`, el mismo valor que ya elige la forma del lateral.

De regalo, la decisión simplifica lo que la anterior complicaba: al no haber dos formas, tampoco hay
que probar que solo se monta una.

**Elegir una sugerencia PREGUNTA**, no rellena el campo. Rellenarlo obliga a un segundo gesto para
algo que ya estaba decidido al pulsar.

### 4. La mascota está SIEMPRE, arriba de las sugerencias

**CORREGIDO AL VER LA PANTALLA MONTADA.** Este design decía «solo con el hilo vacío», con el argumento
de que su alto es la diferencia entre ver dos mensajes o cinco. El argumento era correcto **para el
teléfono** y se aplicó a los dos anchos, que es donde estaba el error: en la columna de la derecha no
compite con nada, y retirarla al empezar a conversar dejaba la pantalla sin la cara que le da nombre
justo cuando alguien está hablando con ella.

Así que la regla queda partida por donde de verdad iba: **en estrecho no está** —ahí sí gastaría el
alto del hilo— y **en ancho está siempre**, antes y después de los mensajes.

Sube a `idea` y no `saluda`: un saludo se agota al segundo mensaje, y esta ilustración está en
pantalla toda la conversación.

### 5. Cero piezas nuevas en `ui/`

El globo se compone con utilidades dentro de la pantalla. Extraerlo al sistema con **un solo
consumidor** sería inventar una pieza adivinando su segundo uso, y además obligaría a su entrada en el
catálogo vivo. Cuando aparezca la segunda pantalla con globos, se extrae con dos casos reales
delante. Es el mismo criterio con el que `buttonClasses` se extrajo **después** de caer dos veces en
el mismo error, no antes.

### 6. El campo, en una fila

El rótulo encima gastaba una línea para decir lo único que se puede hacer en la pantalla. Se retira de
la vista y **se conserva para quien no la ve**: el campo sigue teniendo nombre accesible. La acción va
en la misma fila.

**El `<form>` se queda**, porque es lo que hace que Enter envíe: *una pantalla donde se escribe es un
`<form>`*.

### 7. La pantalla gestiona su alto, y lo declara la RUTA

El campo de escribir tiene que quedarse abajo haya cero mensajes o cincuenta, y para eso la
conversación tiene que desplazar **por dentro**. Es la única pantalla del producto que lo hace: en
todas las demás desplaza el documento.

**Se declara con `staticData: { fullHeight: true }` en la ruta**, exactamente como `/welcome` declara
`fullBleed`. No con un `if` sobre la dirección en la raíz: una dirección escrita a mano ahí se
desincroniza el día que alguien renombre la ruta, y el typecheck no lo vería.

Lo que cambia en el marco son tres cosas, y hacen falta las tres:

1. Se ata a la ventana **también en estrecho** —hoy solo lo hacía con ancho—.
2. El `<main>` recibe `min-h-0`. Sin eso, `flex-1` le deja `min-height: auto` y un hijo alto lo
   empuja: el desplazamiento se escapa al marco.
3. El envoltorio que desplaza pasa a `overflow-y-hidden`. **Esto lo destapó un test**, y es el error
   que más costaba ver: con el marco en `auto` había DOS contenedores de desplazamiento anidados, y
   el de fuera se llevaba el campo de escribir igualmente. Los dos ejes siguen declarados en el mismo
   elemento, que es la lección que `polish-home-layout` ya pagó.

Y el hilo **baja al mensaje nuevo**, con `scrollTop = scrollHeight`. Sin eso la respuesta que se
acaba de pedir aparece fuera de la vista — se vio abriendo la aplicación, no en un test, porque el
nodo SÍ está en el documento. Salto instantáneo y no desplazamiento suave: así no hay movimiento que
apagar con la preferencia del sistema.

## Risks / Trade-offs

**La reversión del ámbar sienta un precedente** → Es el riesgo real de este change: la próxima
persona puede leerlo como «las reglas de color se negocian». Lo acota que la reserva salga **más
fuerte**, con un test y una lista cerrada. Añadir un archivo a esa lista es visible en una revisión;
recordar un comentario, no.

**El panel al lado empuja la conversación a la izquierda** → En pantallas muy anchas el hilo queda
estrecho. Se acota con el tope de ancho que el marco ya impone, y se mira abriendo la aplicación.

**Que los globos se lean bien a 390 px en la escala del niño no lo prueba jsdom** → No aplica CSS. Va
como comprobación manual, con eso dicho, en vez de un test que aparente cubrirlo.

**Los tests que ya existen del chat miran textos, no forma** → Los cinco de
`tests/app/assistant.test.tsx` siguen valiendo tal cual: preguntan, comprueban el hilo enviado y el
aviso de fallo. Hay que ejecutarlos y no reescribirlos por costumbre.

## Migration Plan

Ninguna. Es una pantalla del front.

Marcha atrás: revertir el componente. Los tokens y el test del ámbar pueden quedarse — no dependen de
esta pantalla y valen igual sin ella.
