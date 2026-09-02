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
    // La TERCERA, y cierra la pregunta que dejó abierta el design de
    // `add-design-system`: `react-easy-crop` monta su lienzo dentro de un
    // contenedor y necesita que tenga posición y una altura resuelta para medir
    // su área. No hay token que exprese «lo que esa librería necesita para
    // medir», y la alternativa era meter una utilidad de una sola pantalla en el
    // archivo de tokens.
    //
    // Cubre lo MÍNIMO: de los tres estilos que traía ese archivo, el color
    // —un `#333` literal— se fue a un token y solo quedan la altura y la
    // posición.
    "src/features/uploads/ImageUploadField.tsx",
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
    /*
     * Se añaden dos archivos de fuera de `ui/` en `redesign-parent-authoring`, y
     * es el MISMO patrón, no una excepción nueva: exportar el aspecto junto a la
     * pieza que lo define —`sidebarItemClasses`, como `buttonClasses`— y exportar
     * el hook junto al componente que lo consume —`useChildrenPicker`, como
     * `useField` junto a `Field`—.
     *
     * Se nombran uno a uno en vez de tapar `app/` y `features/` enteros: ahí el
     * aviso sigue diciendo algo, y uno que nunca hay que atender le quita
     * credibilidad a los que sí.
     */
    files: [
      "src/ui/**/*.{ts,tsx}",
      "src/ui-catalog.tsx",
      "src/app/Sidebar.tsx",
      "src/features/children/ChildrenPicker.tsx",
    ],
    rules: { "react-refresh/only-export-components": "off" },
  },

];
