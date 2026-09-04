## Context

Ver `proposal.md` — Why. El estado que condiciona el cómo:

- `LandingPage.tsx` dibuja hoy las cinco secciones dentro del mismo archivo.
- `Orbits.tsx` mide `--container-orbit` (20rem) con `lg:scale-110`. Su geometría —radio de cada
  anillo, ángulo de cada pieza— es la **segunda excepción de estilo en línea** del proyecto y está
  concentrada ahí a propósito.
- `buttonClasses(variant, block)` no tiene talla.
- `[data-surface="brand"]` ya reasigna tinta, bordes y superficies para un panel oscuro. Lo estrenó
  el acceso en `polish-brand-surface`.
- El proyecto prohíbe, y lo comprueban tests: colores literales, utilidades con valor arbitrario,
  `style` en línea fuera de tres archivos declarados, textos fuera del catálogo y cifras dentro de
  una cadena del catálogo.

## Goals / Non-Goals

**Goals:**

- Que la página se lea como una, con ritmo y un final.
- Que las órbitas dejen de ser un adorno lateral.
- Que se vea la aplicación, y las dos caras.
- No inventar ni un color: todo sale de lo que ya hay.

**Non-Goals:**

- Cambiar la identidad —colores, mascota, tipografía, piezas—.
- Que la puerta pública pida algo al servidor. Sigue sin pedir nada.

## Decisions

### 1. El flujo SUSTITUYE a las tarjetas, y gana un paso

Las tres tarjetas dicen «Haz tus tareas», «Elige tu premio» y «Tú apruebas». Un «cómo funciona» con
tarea, monedas y premio dice lo mismo. Tenerlos los dos es decirlo dos veces, así que se funden.

Y al fundirlos aparece lo que a la lista le faltaba: **el orden**. Aprobar no es el tercero de tres
cosas, va **entre** la tarea y las monedas —aprobar es lo que acredita—, y otra vez entre pedir un
premio y gastarlas:

```
   TAREA  ──▶  TÚ APRUEBAS  ──▶  MONEDAS  ──▶  PREMIO
     ▲                                            │
     └────────────────────────────────────────────┘
```

Cuatro pasos y no tres, y el de aprobar rompe la simetría a propósito: es el único del padre.

**Alternativa descartada: dejar las tarjetas y añadir el flujo encima.** Es lo que pedía el encargo
al pie de la letra, y produce una página que dice sus tres ideas dos veces seguidas.

### 2. Las órbitas crecen, y su geometría NO se toca

Sube la medida del escenario a un token propio; los radios de dentro siguen siendo los que son. Es lo
que permite agrandarlas sin ampliar la excepción de estilo en línea, que cubre exactamente nueve
transformaciones y ninguna más.

**Alternativa descartada: recalcular los radios para el tamaño nuevo.** Multiplica por tres la
superficie de la excepción a cambio de nada que se note.

### 3. Las maquetas se construyen con las piezas reales, no se capturan

`Card`, `Coins`, `Badge`, `Avatar` y los tokens. Dos razones, y la segunda es la que decide:

1. Una captura envejece **en silencio** cuando el sistema de diseño cambia. Un token nuevo repinta
   una maqueta construida y no repinta un PNG, y nadie se entera hasta que alguien mira la landing.
2. Cada maqueta lleva su `data-scale` de verdad, así que la diferencia entre las dos audiencias que
   la página enseña **es** la del producto y no una imitación a ojo.

**Y esto choca con un test que existe.** `page.test.tsx` afirma que la puerta pública no lleva
`[data-scale]`, «porque todavía no se sabe de quién sería». La intención sigue valiendo —la PÁGINA no
adopta el marco de un rol— pero una maqueta que enseña las dos escalas la contradice literalmente. El
test pasa a comprobar que **la raíz** no lleva escala, que es lo que el requisito quiere decir; lo de
dentro sí puede llevarla. Queda escrito aquí y no colado en un `expect`.

Las maquetas se anuncian **como ejemplos**: sin eso, quien recorre la página sin verla oye un saldo y
dos nombres de niño y no tiene forma de saber que no son de nadie.

### 4. El ritmo sale de las superficies que hay

`surface` y `surface-sunken` se turnan, y el cierre va en `[data-surface="brand"]`. Ningún color
nuevo: el índigo profundo del cierre es el mismo del acceso, que es la otra pantalla que mira un
adulto, así que la página termina con el color al que lleva.

`data-surface` reasigna además la tinta y las superficies **hacia dentro**, así que el `Card` y el
botón del cierre componen solos. Es para lo que se construyó.

### 5. La talla del botón se declara en la pieza

`buttonClasses(variant, block, size)` y una prop en `Button`. No desde fuera con utilidades: `cx` no
fusiona Tailwind, así que un `px-6 text-title` junto a los de la pieza lo resuelve el orden del CSS
generado, no el del código. Es la misma razón por la que la forma del `Avatar` es una prop.

El enlace la pide igual que el botón —`buttonClasses("primary", false, "large")`—, porque navegar
sigue siendo trabajo de un enlace y las dos acciones de esta página son enlaces.

## Risks / Trade-offs

- **La página crece bastante** → Es el encargo. El riesgo real es que crezca en texto, y contra eso
  van las decisiones 1 y 3: la sección más grande que se añade no lleva ni un párrafo.
- **`LandingPage.tsx` se parte en cuatro archivos** → Es lo que ya hace `features/` en el resto del
  proyecto; el archivo estaba dibujando cinco secciones y era el único sitio donde eso pasaba.
- **Una talla más en una pieza compartida** → Entra con su entrada obligatoria en el catálogo vivo y
  su test. Y solo la usa la puerta pública hoy, que es donde el problema existe.
- **Cómo se ve a tres anchos no lo cubre jsdom** → Va como tarea de abrir la aplicación. Igual que el
  comportamiento con movimiento reducido, que sí tiene test de hooks pero no de composición.

## Migration Plan

Sin migración: es una página pública que no consulta nada.

## Decisiones que este change NO toma

- **Si el resto de la aplicación quiere la talla mayor del botón.** Se decide cuando aparezca el
  segundo caso, no antes.
- **Si las maquetas deberían moverse o responder.** Hoy son estáticas; animarlas es otra
  conversación, y el movimiento de esta página ya lo llevan las órbitas.
