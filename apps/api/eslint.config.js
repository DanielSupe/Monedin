import {
  allowDatabaseImports,
  allowEnvAccess,
  forbidDatabaseImports,
  ignores,
  node,
} from "@monedin/config/eslint";

export default [
  ignores,

  { ignores: ["src/generated/**"] },
  ...node,

  allowEnvAccess(["src/config/**", "prisma.config.ts"]),

  forbidDatabaseImports,
  allowDatabaseImports([
    "src/shared/database/**", 
    "src/**/*.repository.ts", 
    "src/server.ts", 

    "tests/**", 
    "prisma/seed.ts", 
    "prisma.config.ts",
  ]),

  {
    files: ["prisma/**/*.ts"],
    rules: { "no-console": "off" },
  },
];
