import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";
import reactRefresh from "eslint-plugin-react-refresh";

/**
 * Mensaje unico de la regla que protege el punto de lectura del entorno.
 * Ver `runtime-configuration`, requisito "Punto unico de lectura del entorno".
 */
const ENV_RULE_MESSAGE =
  "Prohibido leer variables de entorno aqui. El unico lugar que lee el entorno " +
  "es apps/api/src/config. Importa el objeto `config` ya validado. Ver CLAUDE.md.";

/** Ignorados globales: nada generado entra al lint. */
export const ignores = {
  ignores: [
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/node_modules/**",
    "**/.turbo/**",
    "**/routeTree.gen.ts",
  ],
};

/**
 * Base comun a todo el monorepo: JS + TS recomendados y la regla del entorno.
 */
export const base = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-restricted-properties": [
        "error",
        { object: "process", property: "env", message: ENV_RULE_MESSAGE },
      ],
      // `no-restricted-properties` no ve la desestructuracion; este selector si.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "VariableDeclarator[init.name='process'] > ObjectPattern > Property[key.name='env']",
          message: ENV_RULE_MESSAGE,
        },
        {
          selector:
            "MemberExpression[object.object.name='import'][object.property.name='meta'][property.name='env']",
          message: ENV_RULE_MESSAGE,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];

/**
 * Levanta la prohibicion de leer el entorno para las rutas indicadas.
 *
 * Lo usa UNICAMENTE el modulo de configuracion de la API. Los globs se resuelven
 * relativos al eslint.config.js que llama, asi que cada paquete declara su propia
 * excepcion y se ve en su propio archivo. Cada llamada nueva debilita la regla:
 * si aparece una segunda, es que algo esta mal.
 */
export function allowEnvAccess(files) {
  return {
    files,
    rules: {
      "no-restricted-properties": "off",
      "no-restricted-syntax": "off",
      "no-console": "off",
    },
  };
}

/**
 * Mensaje de la regla que confina el acceso a la base de datos.
 */
const DATABASE_RULE_MESSAGE =
  "El cliente de base de datos solo se importa desde un archivo *.repository.ts. " +
  "Rutas, controladores y servicios acceden a los datos a traves del repositorio " +
  "de su modulo. Ver CLAUDE.md y la spec `data-access`.";

/**
 * Prohibe importar el cliente de base de datos.
 *
 * Se aplica a todo el paquete y se levanta despues para los repositorios y para
 * el propio modulo que construye el cliente.
 */
export const forbidDatabaseImports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          { group: ["**/generated/prisma", "**/generated/prisma/*"], message: DATABASE_RULE_MESSAGE },
          { group: ["@prisma/client", "@prisma/adapter-pg"], message: DATABASE_RULE_MESSAGE },
          { group: ["**/shared/database", "**/shared/database/*"], message: DATABASE_RULE_MESSAGE },
        ],
      },
    ],
  },
};

/** Levanta la prohibicion anterior para las rutas indicadas. */
export function allowDatabaseImports(files) {
  return { files, rules: { "no-restricted-imports": "off" } };
}

/**
 * Mensaje de la regla que confina el estilo visual.
 */
const INLINE_STYLE_RULE_MESSAGE =
  "Prohibido el estilo en linea. Todo color, espaciado, radio y duracion sale de " +
  "apps/web/src/styles/tokens.css a traves de una utilidad. Si el valor se calcula " +
  "en tiempo de ejecucion y ningun token puede expresarlo, declara la excepcion con " +
  "allowInlineStyles([...]). Ver CLAUDE.md y la spec `design-system`.";

/**
 * Prohibe el prop `style` en elementos y en componentes.
 *
 * Usa las reglas propias de eslint-plugin-react y NO un selector en
 * `no-restricted-syntax`: esa regla ya la ocupa la del entorno con tres
 * selectores, y en configuracion plana la ultima declaracion REEMPLAZA el array
 * entero. Peor todavia, la funcion de excepcion habria tenido que apagar
 * `no-restricted-syntax` completa, y con ella la prohibicion de leer el entorno.
 * Una excepcion de estilo que desactiva en silencio una regla de seguridad es
 * justo la trampa que este proyecto evita. Ver decision 6 del design de
 * `add-design-system`.
 *
 * Del plugin se activan EXACTAMENTE estas dos reglas: se registra por lo que
 * aporta aqui, no para importar el resto de su catalogo.
 */
export const forbidInlineStyles = {
  plugins: { react: reactPlugin },
  rules: {
    "react/forbid-dom-props": ["error", { forbid: [{ propName: "style", message: INLINE_STYLE_RULE_MESSAGE }] }],
    "react/forbid-component-props": [
      "error",
      { forbid: [{ propName: "style", message: INLINE_STYLE_RULE_MESSAGE }] },
    ],
  },
};

/**
 * Levanta la prohibicion anterior para las rutas indicadas.
 *
 * Cada llamada nueva debilita la regla. La legitima es la del valor que se
 * calcula en tiempo de ejecucion y que ningun token puede expresar -el ancho de
 * una barra de progreso depende del saldo de un nino-. La ilegitima es "es que
 * aqui me venia bien".
 */
export function allowInlineStyles(files) {
  return {
    files,
    rules: {
      "react/forbid-dom-props": "off",
      "react/forbid-component-props": "off",
    },
  };
}

/** Configuracion para paquetes y apps que corren en Node. */
export const node = [
  ...base,
  {
    files: ["**/*.{ts,js}"],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
  },
];

/** Configuracion para la app de React. */
export const react = [
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
];

export default {
  ignores,
  base,
  node,
  react,
  allowEnvAccess,
  forbidDatabaseImports,
  allowDatabaseImports,
  forbidInlineStyles,
  allowInlineStyles,
};
