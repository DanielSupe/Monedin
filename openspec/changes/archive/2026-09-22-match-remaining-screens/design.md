## Context

El método de los changes anteriores era comparar el texto visible y los tamaños
de cada pantalla con los de su artboard. Encontró casi todo — y tiene un punto
ciego que este change documenta: **no ve la forma**.

Una tarjeta vertical y una horizontal llevan el mismo texto y los mismos pasos de
escala. Una lista en columna y unas píldoras en línea, también. La medición dice
que coinciden, y en pantalla son dos cosas distintas.

## Decisions

### 1. La tarjeta de un premio es horizontal, con la foto pequeña

En el catálogo del padre la tarjeta era vertical: foto cuadrada a todo el ancho,
después el título, después las ofertas en columna. Con **el estado normal de una
familia que empieza —sin fotos—** cada premio se comía trescientos píxeles de
alto para enseñar un cuadro vacío, y cuatro premios no cabían en una pantalla.

La maqueta la dibuja horizontal, con una miniatura. Así caben en dos filas.

**El escaparate del niño NO cambia**, y la diferencia es el argumento: allí la
tesela es cuadrada a propósito —se comparan dos precios de un vistazo— y la foto
es lo que se mira. Aquí lo que se mira es a quién se le ofrece y por cuánto.

**La talla la declara `RewardImage`**, no quien la coloca. Es la regla que esa
misma pieza ya llevaba escrita para su tope de ancho: `cx` no fusiona utilidades,
así que un `size-24` pasado desde fuera contra el `w-full` de dentro lo
resolvería el orden del CSS generado.

### 2. Las ofertas son píldoras en línea, y su rótulo se oye pero no se ve

En columna, cada hijo ocupaba un renglón entero para dos datos cortos. En línea,
los tres caben en el ancho de la tarjeta.

El rótulo «Ofrecido a» desaparece de la vista —la maqueta no lo dibuja, porque
las píldoras ya dicen un nombre y un precio— pero **se queda como nombre de la
lista**: leída en voz alta detrás del título del premio, «Mateo 300» sin rótulo
no dice de qué.

### 3. El historial de un hijo dice de quién es

Es el mismo defecto que tenía la edición de un hijo, y se arregla igual: se llega
desde una lista de tres y el título era «Historial de monedas» a secas. Ahora
lleva su nombre y su saldo — que es además el número que trajo a alguien hasta
ahí.

Y la nota que la maqueta lleva y la aplicación no: **el libro no se edita ni se
borra, ni siquiera desde aquí, y un movimiento equivocado se corrige registrando
otro que lo compense**. Sin ella la pantalla parece incompleta —no hay botón de
borrar y no lo va a haber— y quien encuentra un error no sabe qué hacer.

Va **solo en la vista del adulto**: es él quien puede querer corregir algo, y a
un niño «lo impide la base de datos» no le dice nada.

### 4. Dos controles a ancho completo dicen que pesan lo mismo

En el panel del padre, «Gestionar perfiles» y «Cambiar de perfil» eran dos
botones apilados y estirados. La maqueta pone el primero compacto y el segundo
como un enlace.

Es el mismo error, en pequeño, que ya se arregló separando cambiar de perfil de
cerrar sesión: dos cosas del mismo tamaño y una al lado de la otra se leen como
una pareja.

## Risks / Trade-offs

- **La miniatura hace la foto más pequeña** en el catálogo del padre. Se acepta:
  quien quiera verla grande la tiene en el escaparate del niño, que es donde
  cuenta.

## Open Questions

- Ninguna. Las dos diferencias que quedan —el saldo en píldora ámbar y el
  «Retirar» perfilado— están en el apartado de lo que no incluye.
