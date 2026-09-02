## Why

**Queda una pantalla, y con ella se va la maquinaria entera.**

`add-design-system` no vistió las pantallas de producto a propósito —mezclarlo lo habría hecho
irrevisable— y dejó dos listas de excepciones con la instrucción escrita de que cada change borrara
su línea, y de que **cuando quedaran vacías se borrara el bloque entero**. Nueve changes después
queda una entrada: `ResetPinScreen`, la vía de rescate de un padre bloqueado fuera de su perfil.

Vestirla no es lo importante. Lo importante es que la excepción deja de existir: la regla que prohíbe
estilos en línea y colores a mano pasa a cubrir **todo `src`**, sin lista que mantener y sin una
puerta por la que se cuele la próxima pantalla.

Y dentro de esa pantalla hay dos defectos que no son de aspecto:

- **Pide DOS credenciales y no explica ninguna.** La contraseña —para demostrar que eres tú— y el PIN
  nuevo —lo que vas a teclear a partir de ahora— van juntas y sin una palabra. Es exactamente lo que
  `redesign-access` arregló en el registro, con la regla escrita: si no se explica, parece un error
  del producto.
- **Escribe a mano el 4 del PIN.**

Ese último resultó ser sistemático:

```
la constante existe        y aun así el número está escrito a mano en
─────────────────────      ──────────────────────────────────────────
PIN_LENGTH = 4             maxLength={4}            ×3
                           "PIN de 4 dígitos"       ×2
CHILD_AGE_MIN/MAX = 6/11   "…de 6 a 11 años"        ×1
```

Son **exactamente** las tres cadenas del catálogo que contienen cifras, y las tres son constantes de
dominio. `CLAUDE.md` lo prohíbe dos veces —«impórtalo» y «tenerlo en dos sitios acaba con uno de los
dos mintiendo»— y ningún test lo comprueba.

## What Changes

- **`ResetPinScreen` se viste**, y explica para qué sirve cada una de las dos credenciales.
- **La lista de deuda queda vacía y su maquinaria se BORRA**: el bloque de `allowInlineStyles` que la
  sostenía en `eslint.config.js`, y la constante `SIN_VESTIR` con su filtro en el test de estilos. La
  excepción LEGÍTIMA —tres archivos con su justificación— se queda, que es distinta.
- **Los seis números vuelven a su constante**, y las cadenas del catálogo componen la cifra en el
  punto de uso, como ya hace el mínimo de la contraseña.
- **Dos tests nuevos** lo hacen cumplible: ninguna cadena del catálogo lleva cifras, y ningún
  `maxLength` lleva un literal. Hoy los dos dan cero falsos positivos.

## Capabilities

### Modified Capabilities

- `design-system`: que la regla de estilos cubra todo el código sin lista de excepciones, y que un
  número de negocio no se escriba a mano ni dentro de un texto.

## Impact

- **Front, y solo front.** Cero cambios en la API, en los contratos o en la base de datos.
- `ResetPinScreen.tsx` se reescribe.
- `apps/web/eslint.config.js` pierde un bloque entero.
- `tests/ui/style-rules.test.ts` pierde `SIN_VESTIR`, su filtro y el test que contaba su longitud, y
  gana los dos nuevos.
- `messages.ts` compone tres cifras en vez de escribirlas.
- `ChangePinScreen.tsx` y las pantallas que muestran el PIN usan la constante.
