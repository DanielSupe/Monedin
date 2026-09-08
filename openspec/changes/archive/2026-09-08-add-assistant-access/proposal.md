## Why

`add-family-assistant` dejó a Monedín capaz de responder con los datos reales de una familia, y **no
dejó ni una forma de llegar a él**: `/assistant` se alcanza escribiendo la dirección. Eso estaba
declarado en su «No incluye» y este change es la otra mitad.

Pero el problema es mayor que poner un enlace. El producto **no tiene ayuda de ninguna clase**: ni una
pregunta frecuente, ni un «¿cómo funciona esto?», ni nada que responda por qué aprobar dos veces da
error. Lo único que explica algo es el recorrido de bienvenida, que se ve **una vez** y después
desaparece para siempre. Quien no entendió a la primera —o quien lo saltó— no tiene a dónde ir.

Y hay una segunda cosa que arreglar de paso: **hoy dos capas flotantes se solapan en el mismo píxel y
ninguna declara quién va encima**. El aviso emergente vive en la esquina inferior derecha con un
número de apilado escrito a mano, el único del proyecto. Poner ahí la mascota obliga a decidirlo, y
esa deuda ya existía.

## What Changes

- **Un widget flotante de Monedín** en la esquina inferior derecha de los dos marcos, con una
  ilustración y un bocadillo que **rotan según la pantalla y el rol**: en el escaparate del niño
  habla de precios, en la bandeja del padre habla de aprobar. Al pulsarlo lleva al chat.
- **Un icono de ayuda en la cabecera**, junto al avatar, que lleva a una ruta nueva de **preguntas
  frecuentes** con secciones colapsables — una sola lista para los dos roles.
- **Un acceso al chat desde el pie de las preguntas frecuentes**: «¿Más dudas? Pregúntale a Monedín».
- **Una pieza colapsable nueva** en el sistema de diseño, que hoy no existe. Es la primera revelación
  del sistema que no es un diálogo ni un panel lateral.
- **Una escala de orden de apilado en los tokens**, y el aviso emergente migra a ella. El widget va
  **por debajo** del aviso: una mascota tapada es inofensiva, un aviso tapado esconde información.
- **El widget no aparece durante el recorrido de bienvenida.** Ahí ya hay un Monedín en pantalla, y
  el segundo saldría apagado detrás del velo compitiendo con él.

## Capabilities

### New Capabilities
- `help-center`: cómo encuentra ayuda quien la necesita — el widget que la ofrece sin que nadie la
  busque, el icono que la deja siempre a mano, y las preguntas frecuentes con su salida hacia el
  chat cuando la respuesta corta no basta.

### Modified Capabilities
- `app-navigation`: el requisito de que dentro de un perfil hay **una sola navegación** habla hoy de
  «todos los destinos del rol». La ayuda no es un destino del rol: no es un sitio donde se hace
  trabajo, es meta. El requisito tiene que distinguir las dos cosas, o el icono de la cabecera lo
  incumple al pie de la letra.
- `design-system`: el requisito de que todo valor visual sale de un origen único **enumera** cuáles
  —color, espaciado, radio, sombra, tipografía y duración— y el orden de apilado no está en esa
  lista. Por eso hay hoy un número escrito a mano sin que ninguna verificación se queje.

## Impact

**Front, y solo el front.** Cero cambios en la API, cero migraciones, cero contratos nuevos.

- `apps/web/src/app/`: el widget, su fuente de bocadillos, el icono de ayuda extraído para los dos
  marcos, y un lector de la preferencia de movimiento reducido.
- `apps/web/src/ui/`: la pieza colapsable, su entrada en el catálogo vivo, y el aviso emergente
  migrado a la escala de apilado.
- `apps/web/src/styles/tokens.css`: la escala de apilado.
- `apps/web/src/routes/` y `features/help/`: la ruta de ayuda y su pantalla.
- `apps/web/src/lib/messages.ts`: los bocadillos y las preguntas frecuentes.
- Los dos marcos reciben además si al perfil ya se le explicó el producto, para no montar el widget
  encima del recorrido.

**Dependencias**: una entrada más del proveedor de accesibilidad que el sistema ya usa para el
diálogo, las pestañas y los avisos. No es un proveedor nuevo.

## No incluye

- **Cambiar el chat.** La pantalla, el contrato y el módulo de la API se quedan como están. Este
  change solo construye caminos hacia ellos.
- **Preguntas frecuentes distintas por rol.** Una sola lista, decidido a conciencia. Si al usarla se
  ve que un niño no encuentra su duda entre las de su padre, se parte entonces y con el motivo
  medido.
- **Editar las preguntas sin desplegar.** Viven en el catálogo de mensajes, no en la base de datos.
  Un pequeño gestor de contenidos pediría migración, endpoints y una pantalla de edición, y todavía
  no hay ninguna pregunta que haya cambiado.
- **Buscar dentro de la ayuda.** Con una lista corta, un buscador es más ruido que ayuda.
- **Que el widget diga datos de la familia** —«te faltan 20 monedas para la bici»—. Sería lo más
  vivo, y cada bocadillo dependería de una consulta con su carga y su fallo. El bocadillo depende de
  la pantalla y del rol, que se saben sin pedir nada.
- **Poder cerrar el widget.** No lleva aspa. Es un acceso permanente, como el avatar de la cabecera;
  si molesta, lo que hay que revisar es cada cuánto rota o qué dice, no darle un botón de apagado que
  después nadie sabe volver a encender.
- **Ayuda dentro de cada pantalla**, del tipo «¿qué es esto?» junto a un control. Es otro producto y
  otro change.
