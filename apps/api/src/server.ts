import { API_PREFIX } from "@monedin/contracts";
import { createApp } from "./app.js";
import { initConfig } from "./config/index.js";
import { registerGracefulShutdown } from "./shared/database/client.js";
import { configureLogger, logger } from "./shared/logger/index.js";

/**
 * Punto de entrada.
 *
 * La configuración se valida ANTES de crear la app y de abrir el puerto: si algo
 * falta o está mal, el proceso muere aquí y no llega a aceptar ni una petición.
 */
const config = initConfig();
configureLogger(config.LOG_LEVEL);

const app = createApp();

const server = app.listen(config.API_PORT, () => {
  logger.info(`API escuchando en http://localhost:${config.API_PORT}${API_PREFIX}`);
});

// Al recibir la señal de apagado: dejar de aceptar peticiones y después cerrar
// la base de datos, para no dejar conexiones colgadas en cada despliegue.
registerGracefulShutdown(
  () =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
);
