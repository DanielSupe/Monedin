## Why

El token de familia tipográfica dice esto:

```css
--font-sans: ui-rounded, "SF Pro Rounded", "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
```

Se escribió con una intención clara —«redondeada, que es lo más cerca de amable que se llega sin
cargar una fuente»— y el resultado real es que **la marca se ve distinta en cada dispositivo de la
familia**:

| Dónde | Qué resuelve de verdad | ¿Redondeada? |
| --- | --- | --- |
| iPhone, iPad, Mac | SF Pro Rounded | sí |
| Windows 11 | Segoe UI Variable | **no** |
| Android y Linux | `system-ui`, o sea Roboto | **no** |

Elegimos una cosa y en la mitad de los casos se entrega otra. Y no en cualquier mitad: **la tablet
Android compartida de la casa es el escenario más probable del producto**, y es precisamente donde no
llega nada de lo que se decidió.

No es una cuestión de gusto. Es que un valor de diseño que el sistema declara como suyo lo está
resolviendo el sistema operativo de cada quien, y por tanto no es nuestro. La misma razón por la que
un color no se deja a discreción del navegador.

`add-design-system` lo dejó anotado a propósito, en el propio archivo: *«la tipografía de marca llega
en `polish-brand-and-a11y`; cambiarla será editar esta línea»*.

## What Changes

- **Nunito, variable**, como familia de la marca. Redondeada de verdad y en todas partes, cálida sin
  caer en infantil, y con los acentos y la `ñ` que el primer mercado necesita.
- **Autoalojada**: los archivos los sirve nuestro propio origen. **Ni una petición a un tercero**, que
  es como está el front hoy y como debe seguir.
- **Una sola familia** para las dos audiencias. La doble escala ya las distingue por tamaño y peso;
  añadir una segunda familia sería una decisión más que tomar en cada pantalla nueva.
- **La pila del sistema se queda detrás**, como respaldo. Si la fuente tarda o falla, se ve lo de hoy
  y no la serif por defecto del navegador.
- **Cifras tabulares en `Coins`**: en una lista de hijos, `120` y `1.250` tienen que alinear sus
  dígitos. Es la pieza donde vive el número más importante del producto, así que le toca a ella.
- **Ni un peso, ni un tamaño, ni un color cambian.** Solo con qué formas se dibujan.

## Capabilities

### Modified Capabilities

- `design-system`: la familia tipográfica deja de depender del dispositivo y pasa a ser un valor que
  el sistema entrega. Se añade además la exigencia de que ningún recurso visual venga de un tercero, y
  que las cifras de una columna de saldos alineen.

### New Capabilities

Ninguna. Esto cumple una promesa que el sistema de diseño ya se había hecho.

## Impact

**Dependencia nueva**: `@fontsource-variable/nunito` en `apps/web`. Es una dependencia npm normal, no
un CDN: en tiempo de ejecución no sale nada a la red.

**Código modificado**: `apps/web/src/styles/tokens.css` —el import de la fuente y la línea del token,
que es casi todo el change— y `apps/web/src/ui/Coins.tsx` para las cifras tabulares.

**API, contratos y base de datos**: sin tocar.

**Lo que se lleva de `polish-brand-and-a11y`**: solo la tipografía. Ese change conserva las
ilustraciones de los doce animales, el logo definitivo, el favicon, el manifest y la auditoría de
accesibilidad.

**Aspecto**: **toda la aplicación cambia en Windows y Android**, y es el objetivo, no un efecto
colateral. En Apple el cambio será leve, y eso es buena señal: significa que lo que se entrega ahora
en todas partes es lo que ya se veía donde salía bien.

## No incluye

- **Una segunda familia de display** para el saldo. Tentador, porque el número es el elemento más
  importante del producto, pero la escala ya lo diferencia y una familia más es una regla más que
  recordar en cada pantalla.
- **Precarga con `<link rel="preload">`.** Vite pone un hash en el nombre del archivo, así que la ruta
  no se puede escribir a mano en el HTML sin romperse en cada compilación. Con `font-display: swap`,
  la primera pintura usa el respaldo del sistema y cambia al cargar.
- **Subconjuntos más allá de `latin-ext`.** El primer mercado es Latinoamérica hispanohablante;
  cirílico y griego se añaden el día que hagan falta, y no antes.
- **Cambiar pesos, tamaños o interlineados.** Los tokens de la escala no se tocan.
- **Las ilustraciones, el logo definitivo, el favicon y el manifest**: siguen donde estaban.
- **Tipografía distinta para el niño y para el padre.** Sería duplicar por audiencia, que es
  exactamente lo que la doble escala existe para evitar.
