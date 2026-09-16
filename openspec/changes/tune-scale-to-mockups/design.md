## Context

Las maquetas son la fuente de verdad del aspecto, y se pueden medir: son HTML con
estilos en línea, así que cada `font-size` y cada `font-weight` se cuenta sin
abrir un navegador. Eso convierte «se ve distinto» en cifras.

La restricción que decide la forma de la solución: **una pieza solo usa la capa
semántica**. Ninguna escribe un tamaño ni un peso crudo, así que corregir el
sistema es corregir dos bloques de valores — y corregirlo pieza por pieza sería
tocar treinta archivos para el mismo resultado peor.

## Goals / Non-Goals

**Goals**

- Que el texto de cada pantalla mida y pese lo que mide y pesa en su maqueta.
- Que el arreglo viva en un solo sitio, para que la siguiente comparación se
  pueda hacer contra un sistema y no contra treinta pantallas.

**Non-Goals**

- Tocar una sola pieza o pantalla.
- Resolver las diferencias de estructura, que son de cada pantalla.

## Decisions

### 1. Los pasos salen de contar, no de mirar

Para cada grupo de pantallas se cuenta cuántas veces aparece cada tamaño y se
asigna el paso de la escala al valor que domina. El cuerpo del padre es 14px
porque aparece 261 veces; el del niño, 15px, porque 14 y 15 se reparten el peso y
el niño lee más grande que su padre por decisión del sistema.

**Alternativa descartada: copiar el tamaño de cada elemento.** Las maquetas usan
veinticuatro tamaños distintos; el sistema tiene siete pasos a propósito. Copiar
los veinticuatro sería volver al problema que la escala existe para resolver.

### 2. El registro de pesos se declara, y no se reescribe en cada pieza

En las 32 maquetas no hay **ni una** declaración de peso 400. El texto normal del
diseño son 700, el énfasis 800, y los titulares 900. La aplicación pinta 400
porque es lo que trae el navegador, y 600 donde una pieza pide `font-semibold`.

Se redefine el vocabulario de pesos en la capa de tokens. Una pieza que pide
«semibold» sigue pidiendo lo mismo; lo que cambia es a qué apunta esa palabra en
este producto, igual que `--color-primary` cambió de valor sin que ninguna pieza
se enterara.

**Alternativa descartada: cambiar la clase en cada pieza.** Son más de cien
puntos de uso, el resultado es idéntico, y la próxima vez que el diseño ajuste el
registro habría que volver a recorrerlos todos. Es exactamente lo que la capa de
tokens existe para evitar.

**La consecuencia que hay que aceptar**: `font-normal` deja de significar 400 en
este proyecto. Se declara con todas las letras en `tokens.css`, porque una
palabra que significa otra cosa sin decirlo es peor que un valor raro.

### 3. El `--text-hero` del niño NO se toca

La maqueta pone el saldo como píldora de la cabecera, a 34px. La aplicación lo
pone como el elemento más grande del inicio, a 64px, porque lo exige un requisito
vigente que la maqueta contradecía.

Bajarlo aquí resolvería una diferencia de cifras cambiando una decisión de
producto por la puerta de atrás. Se deja, se dice, y si hay que revisarla se
revisa donde se decidió.

## Risks / Trade-offs

- **Todo el texto se vuelve más pesado de golpe.** Es el objetivo, y es lo que
  las maquetas piden; pero es el cambio más visible que ha tenido el producto en
  una sola línea, así que se mira en pantalla antes de darlo por bueno.
- **Un tamaño más pequeño aprieta las pantallas densas.** Las del padre son las
  que más contenido llevan y son justo las que menos bajan.

## Open Questions

- Ninguna. La del saldo está fuera de alcance a conciencia.
