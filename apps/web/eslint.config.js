import { allowInlineStyles, forbidInlineStyles, ignores, react } from "@monedin/config/eslint";

export default [
  ignores,
  ...react,
  forbidInlineStyles,

  /*
   * La excepción LEGÍTIMA: el ancho de la barra de progreso depende del saldo de
   * un niño y de lo que cuesta un premio, así que no hay token que lo exprese.
   * Ver la spec `design-system`, escenario «Una excepción legítima».
   */
  allowInlineStyles([
    "src/ui/ProgressBar.tsx",
    // La SEGUNDA, y por eso conviene justificarla: el radio de cada órbita y el
    // ángulo de cada pieza son geometría que se calcula —nueve veces
    // `rotate(a) translate(r) rotate(-a)`—, y no hay token que exprese eso. La
    // alternativa era meter doce utilidades de una sola pantalla en el archivo
    // de tokens. Toda la geometría está concentrada en ese archivo para que
    // esta excepción cubra lo mínimo.
    "src/features/landing/Orbits.tsx",
  ]),

  /*
   * `react-refresh` vigila las fronteras de recarga en caliente, y eso solo
   * tiene sentido en los módulos de ruta y de pantalla.
   *
   * `src/ui/` es una biblioteca de piezas: exportar `useField` junto a `Field`
   * es el patrón correcto, no un descuido. Y `ui-catalog.tsx` es un PUNTO DE
   * ENTRADA, así que no es frontera de nada.
   *
   * Se apaga aquí y no en toda la app: en `features/` y `routes/` la regla sigue
   * diciendo algo. Un aviso que nunca hay que atender le quita credibilidad a
   * los que sí.
   */
  {
    files: ["src/ui/**/*.{ts,tsx}", "src/ui-catalog.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },

  /*
   * DEUDA CON FECHA DE CADUCIDAD, no una excepción.
   *
   * Las pantallas de producto siguen con los estilos en línea del andamio.
   * `add-design-system` no las viste a propósito —mezclarlo lo habría hecho
   * irrevisable—, y vestirlas es lo que hacen los nueve changes siguientes.
   *
   * Cada uno de esos changes BORRA su línea de esta lista. Cuando la lista quede
   * vacía, se borra este bloque entero y `features/` queda cubierto por la regla
   * general. Si algún día una línea sigue aquí sin change que la reclame, es que
   * alguien se saltó el plan.
   */
  allowInlineStyles([
    "src/routes/**/*.tsx",
    /*
     * `features/auth` ya no entra entero: `redesign-profile-grid` vistió la
     * rejilla y el teclado de PIN, y `redesign-access` el acceso y el registro.
     * Los tres que quedan son pantallas de credenciales fuera del camino de
     * entrar por primera vez. Se nombran uno a uno para que la excepción no
     * tape lo que ya está hecho.
     */
    "src/features/auth/ResetPinScreen.tsx",
    "src/features/auth/ChangePinScreen.tsx",
    "src/features/auth/ParentAvatarScreen.tsx",
    "src/features/children/AvatarPicker.tsx",
    "src/features/children/ChildForm.tsx",
    "src/features/children/ChildSettings.tsx",
    "src/features/children/ChildrenList.tsx",
    "src/features/children/CreateProfileScreen.tsx",
    "src/features/children/EditChildScreen.tsx",
    "src/features/redemptions/**/*.tsx",
    "src/features/rewards/**/*.tsx",
    "src/features/tasks/**/*.tsx",
    "src/features/uploads/**/*.tsx",
  ]),
];
