## 1. Reescribir la reserva del ámbar, y hacerla cumplible

- [x] 1.1 Corregir los dos comentarios de `apps/web/src/styles/tokens.css` —el de la paleta y el del
      semántico— para que digan la regla nueva: la moneda **y la mascota**, porque Monedín ES una
      moneda. Y que lo prohibido sigue siendo lo mismo: botones, tarjetas y avisos genéricos.
- [x] 1.2 Corregir el párrafo de `CLAUDE.md` §8 donde está escrito que el ámbar es solo la moneda.
      Decir que se reasignó, cuándo y con qué argumento — una reversión que no se explica se lee como
      que la regla no valía.
- [x] 1.3 Test en `apps/web/tests/ui/style-rules.test.ts`: solo los archivos de una lista cerrada
      pueden usar una utilidad del color de la moneda. Que la lista no pueda quedarse vacía sin que se
      note —se afirma que tiene al menos un archivo—, o vaciarla haría pasar la comprobación por no
      encontrar nada que revisar.
- [x] 1.4 **Inyectar la violación**: usar `bg-coin-soft` en un archivo que no esté en la lista —por
      ejemplo `ui/Button.tsx`— y ver caer 1.3. Revertir.

## 2. La conversación en globos

- [x] 2.1 Reescribir el turno en `AssistantChat.tsx`: alineado por quien habla, ceñido a su texto con
      un tope de ancho, y con la superficie de cada rol. **Las tres señales a la vez**: posición,
      color y la etiqueta escrita, que se QUEDA porque es lo único que oye quien no ve la pantalla.
- [x] 2.2 El avatar pequeño de Monedín junto a cada respuesta, decorativo y oculto a los lectores: lo
      que dice quién habla es la etiqueta.
- [x] 2.3 Test: los dos roles no comparten superficie ni alineación, y **cada turno sigue diciendo de
      quién es** aunque no se vea nada. Sin esta segunda mitad, un rediseño que se apoyara solo en el
      color pasaría en verde.

## 3. Monedín da la bienvenida y deja sitio

- [x] 3.1 La ilustración grande en la cabecera, **solo con el hilo vacío**. Elegir entre las libres de
      `assets/tutorial/` la que salude.
- [x] 3.2 Test: con el hilo vacío está; tras la primera pregunta ya no, **y el avatar pequeño sí**.
      Comprobar las dos mitades: que desaparezca del todo sería otro defecto.

## 4. El panel «Explora con Monedín»

- [x] 4.1 Los textos en `messages.assistant`: el título del panel. Las tres preguntas ya existen y se
      reutilizan; **ninguna cadena nueva con una cifra dentro**.
- [x] 4.2 El panel al lado con ancho y debajo sin él, decidido con `useIsWide()` — el MISMO valor que
      elige la forma del lateral, no una segunda fuente. Se monta UNA de las dos formas.
- [x] 4.3 Que sigan disponibles con la conversación empezada, y que elegir una **pregunte** en vez de
      rellenar el campo.
- [x] 4.4 Tests: siguen ahí después de preguntar; pulsar una envía esa pregunta y aparece como del
      usuario; y en estrecho **no existen además otras escondidas al lado** —se cuentan, no se mira si
      se ven, porque jsdom no aplica CSS—.

## 5. El campo en una fila

- [x] 5.1 Campo y acción en la misma fila, sin rótulo dibujado encima pero **con nombre accesible**.
      El `<form>` se queda: es lo que hace que Enter envíe.
- [x] 5.2 Comprobar que los cinco tests que ya existen en `tests/app/assistant.test.tsx` siguen
      pasando SIN tocarlos. Miran textos y comportamiento, no forma; si hay que reescribirlos, es
      señal de que se rompió algo que no tocaba.

## 6b. Lo que cambió al ver la pantalla montada

- [x] 6b.1 **La mascota pasa a estar SIEMPRE**, no solo con el hilo vacío. El argumento de que gasta
      alto era correcto para el TELÉFONO y se había aplicado a los dos anchos: en la columna de la
      derecha no compite con nada, y retirarla dejaba la pantalla sin la cara que le da nombre justo
      cuando alguien habla con ella. Sube a `idea` en vez de `saluda` —un saludo se agota al segundo
      mensaje— y más grande.
- [x] 6b.2 **En estrecho no hay ni mascota ni sugerencias.** El design decía «debajo sin ancho» y
      debajo no cabe. En un teléfono la pantalla es el chat y nada más.
- [x] 6b.3 **La pantalla desplaza por dentro y el campo se queda abajo.** Ruta con
      `staticData: { fullHeight: true }`, como `/welcome` con `fullBleed`; el marco se ata a la
      ventana también en estrecho y su `<main>` recibe `min-h-0`.
- [x] 6b.4 **El envoltorio del marco pasa a `overflow-y-hidden` con `fullHeight`.** Lo destapó un
      test: con `auto` había DOS contenedores de desplazamiento anidados y el de fuera se llevaba el
      campo de escribir igual.
- [x] 6b.5 **El hilo baja al mensaje nuevo.** Sin eso la respuesta recién pedida aparecía fuera de la
      vista. Se vio abriendo la aplicación y no en un test, porque el nodo SÍ está en el documento.
      Con test propio y su violación inyectada.
- [x] 6b.6 **El hueco vacío invita**, en tinta atenuada y sin acción.

## 6. Comprobar y cerrar

- [x] 6.1 Typecheck y lint. **No pedir una quinta excepción de estilos en línea**: ni el globo ni el
      panel necesitan una medida calculada.
- [x] 6.2 Batería del front con `pnpm vitest run --no-file-parallelism`.
- [x] 6.3 Abrir la aplicación con los dos roles y mirar lo que jsdom no puede: que los globos se lean
      a 390 px en la escala del niño, y que el panel al lado no deje el hilo demasiado estrecho en una
      pantalla ancha.
- [x] 6.4 Con movimiento reducido: que nada de lo nuevo se mueva.
- [x] 6.5 Abrir pantallas del padre y del niño tras tocar `tokens.css`, para confirmar que no se
      enteraron.
- [x] 6.6 Actualizar `openspec/config.yaml` con lo que este change deja construido, incluida la
      reasignación del ámbar.
