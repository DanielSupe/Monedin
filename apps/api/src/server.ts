import { API_PREFIX } from "@monedin/contracts";
import { createApp } from "./app.js";
import { initConfig } from "./config/index.js";
import { registerGracefulShutdown } from "./shared/database/client.js";
import { configureLogger, logger } from "./shared/logger/index.js";

const config = initConfig();
configureLogger(config.LOG_LEVEL);

const app = createApp();

const server = app.listen(config.API_PORT, () => {
  logger.info(`API escuchando en http://localhost:${config.API_PORT}${API_PREFIX}`);
});

registerGracefulShutdown(
  () =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
);
