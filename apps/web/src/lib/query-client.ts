import { QueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "./http-client.js";

/**
 * Cliente de TanStack Query compartido por toda la app.
 *
 * No se reintenta ante un error de la API que ya dijo lo que pasa: reintentar un
 * 403 o un 422 no lo va a arreglar y solo retrasa el mensaje al usuario. Sí se
 * reintenta un fallo de red, que sí puede ser pasajero.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiRequestError && error.status >= 400) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
