# Ajustar las pantallas compartidas a lo que dibujan sus maquetas

## Why

Con la escala ya afinada —`tune-scale-to-mockups`— quedan las diferencias de
**contenido y jerarquía**, que no las arregla ningún token. Comparadas maqueta
contra aplicación, texto por texto, las ocho pantallas compartidas tenían esto:

| pantalla | lo que la maqueta dice y la aplicación no |
| --- | --- |
| Puerta pública | «Dinero de mentira» va **antes** de «Así funciona»; las dos maquetas internas llevan pie; la acción del cierre se llama «Crear mi cuenta» |
| Entrar / Registro | el saludo es el ANTETÍTULO y lo que se viene a hacer el título; falta la frase del producto; la acción lleva su nombre escrito |
| Rejilla | falta la línea que dice que después viene un PIN |
| Nuevo perfil | el PIN va detrás de la edad; la rejilla de animales se nombra «Elige tu animal» |

Y una que no es de aspecto: **la siembra no alcanza a enseñar el producto**. Con
dos hijos no se puede mirar nunca la tesela bloqueada de la rejilla, ningún
reparto tiene estados mezclados, y `dueDate` no aparece en ninguna pantalla
porque no se siembra.

## What Changes

- **El orden de la portada** se invierte en sus dos secciones centrales, y con
  él sus fondos, para que la alternancia siga dando ritmo.
- **Las dos maquetas internas de la portada llevan pie**, diciendo que son un
  ejemplo y que los datos no son de nadie.
- **La jerarquía del acceso se da la vuelta**: «¡Bienvenido!» pasa a antetítulo
  y «Entra a tu cuenta» a título.
- **La acción de las dos pantallas de acceso lleva su nombre escrito** y ocupa
  el ancho, en vez de ser una flecha redonda con el nombre solo en `aria-label`.
- **La rejilla dice su línea** también fuera del modo administrar.
- **El alta de un perfil ordena sus campos** como la maqueta y nombra su rejilla
  de animales por lo que hay que hacer con ella.
- **La siembra crece** hasta que cada pantalla pueda enseñar todos sus casos.

## Impact

- `apps/web/src/features/landing/`, `apps/web/src/features/auth/`,
  `apps/web/src/features/children/ChildForm.tsx` y el catálogo de textos.
- `apps/api/prisma/seed.ts`, y con él un tercer hijo de ejemplo.
- Dos tests de la portada que perseguían la forma anterior.

## No incluye

- **Las quince pantallas del padre y las nueve del niño.** Van después, y por el
  mismo método: comparar texto por texto y tamaño por tamaño contra su maqueta.
- **Las diferencias de COLOR.** La rejilla y el teclado de PIN salen más
  monocromos que sus maquetas, que llevan violeta y ámbar en las tintas. Es otro
  repaso.
- **La edad y el «Adulto» en la rejilla.** La maqueta los dibuja y un requisito
  vigente de `profile-selection` dice que un perfil se identifica «por su nombre
  y su avatar, y NO SHALL exponer ningún otro dato antes de entrar». Es el mismo
  choque que el saldo, y se decide donde se decidió aquel.
- **El contraste del coral**, que es un problema medido y aparte: la rampa
  entera se queda entre 2.54 y 3.38 contra blanco, así que ningún paso llega al
  4.5 que pide un texto normal. Ver la pregunta abierta del design.
