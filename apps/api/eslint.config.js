import { allowEnvAccess, ignores, node } from "@monedin/config/eslint";

export default [
  ignores,
  ...node,
  // El modulo de configuracion es el unico lugar del proyecto autorizado a leer
  // variables de entorno. Ver la spec `runtime-configuration`.
  allowEnvAccess(["src/config/**"]),
];
