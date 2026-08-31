## Why

El acceso se pintó de ámbar y ahí estuvo el error. No es cuestión de acabado: **es el color**.

La razón es de producto. El acceso es **la única pantalla que mira un adulto**: la calidez le
corresponde al niño —su inicio, sus tareas, sus premios— y en la puerta, donde alguien decide si esto
es de fiar, se lee como juguete.

Debajo había además tres defectos de paleta que este change encontró y que valen para cualquier
superficie de color, no solo para la que se descartó:

| Qué se veía | Por qué pasaba |
| --- | --- |
| El panel se leía plano | Un solo valor pintaba toda la superficie, sin nada intermedio con lo que modelar |
| El texto se leía ajeno | Los neutros del producto son azulados; la superficie no |
| El botón vibraba | El primario y la superficie estaban casi enfrentados en el círculo cromático |

## What Changes

- **La superficie del acceso pasa a índigo profundo.** El mismo matiz que el sistema ya llama «la
  acción», en sus pasos oscuros.
- **El ámbar deja de ser el fondo y pasa a ser el ACENTO**: el botón y la moneda. Pintando media
  pantalla no decía nada; sobre índigo, un punto ámbar **es dinero**.
- **La rampa índigo se completa** con los pasos oscuros para pintar y los claros para lo que va
  encima. En la capa 1, que no genera utilidades.
- **La superficie reasigna los neutros Y las superficies.** Sobre un fondo oscuro no basta con
  invertir la tinta: un campo blanco con texto claro es ilegible. `--color-surface-raised` también se
  reasigna, así que un campo pasa a ser oscuro con texto claro y las piezas componen solas.
- **Una superficie clara anidada se declara como tal.** `Alert` trae su propio fondo suave, así que
  es una superficie clara esté donde esté.
- **`Button` gana la variante `contrast`**, la acción principal cuando el fondo ya es de marca.
- **Los paneles usan el radio de una lámina**, no el de una tarjeta.

## Capabilities

### Modified Capabilities

- `design-system`: la paleta admite una superficie de color con su propia rampa; los neutros y las
  superficies se reasignan según la superficie, igual que los tamaños según la audiencia; y una
  superficie clara anidada dentro de una de color vuelve a los valores claros.

### New Capabilities

Ninguna.

## Impact

**Código modificado**: `styles/tokens.css` —la mayor parte del change—, `ui/Button.tsx`,
`ui/Input.tsx`, `ui/Alert.tsx`, y las dos piezas del acceso, `features/auth/AccessLayout.tsx` y
`CycleDisc.tsx`.

**API, contratos y base de datos**: sin tocar. **Dependencias**: ninguna.

**El resto de la aplicación no cambia.** Todo lo nuevo entra como primitivo —que no genera
utilidades— o dentro de un selector de superficie. Hay que comprobarlo, no suponerlo.

## No incluye

- **La rejilla, el teclado de PIN, el alta de perfil y la puerta pública.** Siguen claros, que es lo
  que se decidió al vestirlos.
- **Cambiar el índigo del resto de la aplicación**: `--color-primary` no se toca.
- **Las ilustraciones, el logo definitivo, el favicon y el manifest**: `polish-brand-and-a11y`.
- **Las tres pantallas de credenciales** que siguen en la lista de deuda declarada.
- **Subir una foto al crear un perfil.** Sigue pendiente y sin decidir.
