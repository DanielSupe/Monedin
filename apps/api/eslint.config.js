import {
  allowDatabaseImports,
  allowEnvAccess,
  forbidDatabaseImports,
  ignores,
  node,
} from "@monedin/config/eslint";

export default [
  ignores,
  // El cliente de Prisma se genera como codigo fuente; no se revisa ni se lintea.
  { ignores: ["src/generated/**"] },
  ...node,
  // Lista CERRADA de excepciones a la prohibicion de leer el entorno.
  //
  //  - src/config/**      el modulo de configuracion, unico lector en tiempo
  //                       de peticion.
  //  - prisma.config.ts   herramienta de linea de comandos: la ejecuta el CLI
  //                       de Prisma antes de que exista un proceso de API que
  //                       pueda validar nada.
  //
  // Ningun archivo que participe en atender una peticion entra aqui.
  // Ver la spec `runtime-configuration`.
  allowEnvAccess(["src/config/**", "prisma.config.ts"]),

  // El cliente de base de datos solo se toca desde la capa de repositorio.
  forbidDatabaseImports,
  allowDatabaseImports([
    "src/shared/database/**", // el modulo que lo construye
    "src/**/*.repository.ts", // la capa de repositorio de cada modulo
    "src/server.ts", // la raiz de composicion: cablea el cierre ordenado, no
    //                  hace acceso a datos
    "tests/**", // los tests montan sus propios clientes
    "prisma/seed.ts", // la siembra de desarrollo
    "prisma.config.ts",
  ]),

  // La siembra es un script de linea de comandos: su salida ES para la consola.
  {
    files: ["prisma/**/*.ts"],
    rules: { "no-console": "off" },
  },
];
