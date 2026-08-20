import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
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

export default { ignores, base, node, react, allowEnvAccess };
