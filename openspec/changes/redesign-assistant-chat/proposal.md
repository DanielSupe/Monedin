## Why

`add-family-assistant` construyó el chat entero —contexto de la familia, dos guiones, el 503 honesto—
y lo vistió con lo mínimo: una columna de tarjetas iguales, una debajo de otra, con una etiqueta de
texto encima diciendo quién habla. Funciona y no se parece a una conversación.

Tres cosas concretas fallan:

- **Los turnos no se distinguen de un vistazo.** Son tarjetas del mismo ancho y el mismo color; lo
  único que separa una pregunta de una respuesta es leer «Tú» o «Monedín» encima. En una conversación
  de seis mensajes hay que leerlo seis veces.
- **Monedín no está.** La pantalla se llama «Pregúntale a Monedín» y no aparece por ninguna parte,
  justo donde la mascota es el motivo de que alguien entre.
- **Las sugerencias desaparecen al preguntar.** Son lo que resuelve el folio en blanco y están solo
  cuando el hilo está vacío; en cuanto hay conversación, cambiar de tema exige escribir. Para un niño
  de seis años eso es la diferencia entre seguir preguntando y cerrar.

## What Changes

- **Los turnos pasan a globos**, alineados por quien habla: lo de quien pregunta a la derecha, lo de
  Monedín a la izquierda con su avatar al lado. Se distingue por posición, forma y color, y la
  etiqueta escrita se queda como respaldo para quien no ve la pantalla.
- **Monedín aparece**, grande, mientras el hilo está vacío. Se retira en cuanto hay conversación: en
  un móvil su alto es la diferencia entre ver dos mensajes o cinco.
- **Las sugerencias se quedan siempre**, como panel «Explora con Monedín»: en columna al lado cuando
  hay ancho, y bajo el hilo cuando no. Dejan de ser solo un arranque y pasan a ser un atajo para
  cambiar de tema sin escribir.
- **El campo pasa a una fila en píldora** con su acción al lado, en vez de un campo con etiqueta
  encima y un botón suelto.
- **BREAKING para una regla de color declarada**: los globos de Monedín van en ámbar suave. El ámbar
  estaba reservado a la moneda y solo a la moneda. La regla no se salta en silencio — se reescribe,
  con su argumento, y por primera vez se hace **cumplible con un test** en vez de vivir en un
  comentario.

## Capabilities

### Modified Capabilities
- `family-assistant`: la pantalla del chat gana requisitos de forma que hoy no tiene. Que los turnos
  se distingan sin leer la etiqueta, que las sugerencias sigan disponibles con la conversación
  empezada, y que la mascota no gaste alto cuando lo que importa es el hilo.
- `design-system`: el ámbar deja de estar reservado a la moneda para estarlo a **la moneda y la
  mascota**, y esa reserva pasa de un comentario a un requisito verificable. Hasta hoy nada impedía
  que alguien pintara un botón de ámbar; el comentario que lo prohibía no lo lee un test.

## Impact

**Solo el front, y solo una pantalla.** Cero API, cero contratos, cero migraciones, cero
dependencias nuevas.

- `apps/web/src/features/assistant/AssistantChat.tsx`: reescrito.
- `apps/web/src/lib/messages.ts`: el título del panel de sugerencias y los textos que cambian.
- `apps/web/src/styles/tokens.css`: la reserva del ámbar, reescrita donde está declarada.
- `apps/web/tests/ui/style-rules.test.ts`: el test nuevo que la hace cumplir.
- `CLAUDE.md`: la decisión del ámbar, corregida donde está escrita.

**Piezas del sistema**: se reutilizan las que hay. Si alguna forma nueva —el globo— resulta que la
necesita una segunda pantalla, se extrae entonces; extraerla ahora sería inventar una pieza para un
solo uso.

## No incluye

- **Dictado por voz.** La maqueta de referencia lleva un micrófono junto al campo y NO se dibuja: un
  botón que no hace nada es peor que ninguno, y para un niño que lo pulsa y no pasa nada, mucho peor.
  Es la función que más le serviría a quien todavía escribe despacio, y por eso merece su propio
  change: permisos del navegador, un idioma que declarar, y qué hacer donde la API no existe.
- **Cambiar qué responde Monedín.** El módulo de la API, los guiones y el contrato se quedan igual.
  Esto es cómo se ve lo que ya dice.
- **Guardar la conversación.** Sigue viviendo en la pantalla y muriendo con la navegación, como
  declaró `add-family-assistant`. Un hilo más bonito no cambia esa decisión.
- **Sugerencias que dependan de los datos de la familia** —«te faltan 20 monedas para la bici»—.
  Serían mejores y cada una pediría una consulta con su carga y su fallo. Las tres de ahora se saben
  sin preguntar nada.
- **Indicador de «escribiendo…» animado.** El esqueleto que ya hay dice lo mismo y no pide una
  animación más que después haya que apagar con movimiento reducido.
- **Extraer una pieza `Bubble` al sistema de diseño.** Con un solo consumidor sería una pieza
  inventada para adivinar el segundo uso. Se extrae cuando aparezca.
