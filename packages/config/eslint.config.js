import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";
import reactRefresh from "eslint-plugin-react-refresh";

const ENV_RULE_MESSAGE =
  "Prohibido leer variables de entorno aqui. El unico lugar que lee el entorno " +
  "es apps/api/src/config. Importa el objeto `config` ya validado. Ver CLAUDE.md.";

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

export const base = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-restricted-properties": [
        "error",
        { object: "process", property: "env", message: ENV_RULE_MESSAGE },
      ],

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

const DATABASE_RULE_MESSAGE =
  "El cliente de base de datos solo se importa desde un archivo *.repository.ts. " +
  "Rutas, controladores y servicios acceden a los datos a traves del repositorio " +
  "de su modulo. Ver CLAUDE.md y la spec `data-access`.";

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

export function allowDatabaseImports(files) {
  return { files, rules: { "no-restricted-imports": "off" } };
}

const INLINE_STYLE_RULE_MESSAGE =
  "Prohibido el estilo en linea. Todo color, espaciado, radio y duracion sale de " +
  "apps/web/src/styles/tokens.css a traves de una utilidad. Si el valor se calcula " +
  "en tiempo de ejecucion y ningun token puede expresarlo, declara la excepcion con " +
  "allowInlineStyles([...]). Ver CLAUDE.md y la spec `design-system`.";

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

export function allowInlineStyles(files) {
  return {
    files,
    rules: {
      "react/forbid-dom-props": "off",
      "react/forbid-component-props": "off",
    },
  };
}

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
