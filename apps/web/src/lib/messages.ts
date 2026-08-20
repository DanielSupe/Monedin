/**
 * Catálogo de textos visibles del front.
 *
 * Mismo criterio que en la API: ni un string visible incrustado en un
 * componente. Ver decisión 10 del design.
 */
export const messages = {
  app: {
    title: "Monedín",
    tagline: "Educación financiera para chicos de 6 a 11 años",
  },

  health: {
    heading: "Estado del servicio",
    loading: "Consultando la API…",
    ok: "La API responde correctamente.",
    failed: "No se pudo contactar con la API.",
    service: "Servicio",
    version: "Versión",
  },

  errors: {
    /** La respuesta no se pudo interpretar como el cuerpo de error estándar. */
    unreadableResponse: "La respuesta del servidor no se pudo interpretar.",
    /** La respuesta correcta no cumple el contrato compartido. */
    unexpectedShape: "La respuesta del servidor no tiene la forma esperada.",
    /** No hubo respuesta: red caída o API apagada. */
    network: "No se pudo contactar con el servidor.",
  },
} as const;
