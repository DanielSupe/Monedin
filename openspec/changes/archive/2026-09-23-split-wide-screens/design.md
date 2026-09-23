# Diseño

## 1. Una pieza y no cinco veces la misma rejilla

`ui/SplitLayout`: recibe el contenido y un `aside`, y decide la banda. Cinco
pantallas con el mismo reparto es el caso para el que existe una pieza — la regla 3
del proyecto, «una sola fuente de verdad», y la forma por defecto en que esto se
degrada es que cada pantalla escriba su `lg:grid-cols-…`.

Vive en `ui/` y no en `features/` porque no sabe de negocio: recibe dos huecos y los
coloca. Es la misma frontera que le permite a `Pagination` recibir sus enlaces.

**La proporción es 3/2 y no la de la maqueta.** Las maquetas usan `1.5fr` y `1.55fr`
—dos números distintos para la misma intención—, y escribirlos pide un valor
arbitrario de Tailwind, que un test prohíbe. `lg:grid-cols-5` con `col-span-3` y
`col-span-2` da exactamente 1,5 y sale de la escala. La diferencia con 1,55 es de
seis píxeles en un monitor de 1600.

**Apilado por debajo de `lg`.** Una tablet en vertical no tiene ancho para dos
columnas, y es el dispositivo más probable del producto. `align-items: start`, para
que el panel de apoyo no se estire hasta el alto de una lista larga.

## 2. El aside va DESPUÉS en el documento, y eso importa

En las cinco pantallas el panel de la derecha es apoyo: explica, resume o remata.
Quien recorre con teclado o con lector llega primero a lo que hay que hacer y
después a lo que lo explica, en los dos anchos — porque apilado queda debajo y en
ancho queda al lado, pero el orden del documento no cambia.

Es lo contrario de lo que haría colocar el panel con `order`, que separaría lo que se
ve de lo que se recorre.

## 3. El inicio del niño pierde su tope de lectura

`max-w-reading` son 640 px. Con una columna era un tope razonable; con dos es una
jaula que deja la mitad del monitor vacía y las dos columnas a 300 px. Pasa al tope
del marco, que es el que usan las otras cuatro.

**Lo que NO se mueve**: el saldo. La maqueta lo sube a una píldora de la cabecera y
hay un requisito vigente que dice que es el elemento más grande del inicio del niño.
Se decidió en `match-role-screens` y sigue decidido: una referencia visual no revoca
una decisión de producto.

## 4. Los canjes del niño reciben contenido, no solo forma

Es la única de las cinco donde falta algo de verdad. Dos piezas:

- **Monedín explica lo que una tabla no dice**: que las monedas se van al aprobar y
  no al pedir, y que un rechazo no cuesta nada. Es la mitad del ciclo que un niño no
  puede deducir de una lista de estados, y el producto ya la explica en las dos
  pantallas que reparten — contárselo solo a quien reparte deja suponiendo a quien
  pide, que es donde se lleva el chasco.
- **Tres contadores por estado**, para repasar de un vistazo sin leer la tabla.

Las cuentas salen de las filas que la pantalla ya tiene. **No se piden al servidor**,
y por eso cuentan lo de la PÁGINA y no el total: `GET /redemptions/mine` pagina por
fila, así que su `total` es el número de canjes, no el de cada estado. Un contador
que dijera «3 aprobados» de un total de 40 estaría mintiendo sobre lo que enseña.
El rótulo lo dice.

**Descartado**: añadir el desglose por estado a la API. Sería un cambio de contrato
para tres números que se pueden contar donde ya están, y el primero de esta etapa.

## 5. Qué test lo sostiene

jsdom no aplica CSS, así que «se ve en dos columnas» no se prueba. Se prueba la
declaración y la estructura, que es lo que decide el resultado:

- Que las cinco pantallas montan `SplitLayout` con su panel dentro, y no suelto.
- Que el panel va **después** del contenido en el orden del documento.
- Que los contadores de canjes cuentan las filas por estado, con un caso donde los
  tres números son distintos entre sí **y** distintos del total — si no, un contador
  equivocado pasaría.

Lo que queda como tarea manual: abrir las cinco a 1600 y comprobar que la banda se
ve, y a 390 que se apila. Ningún test lo ve.
