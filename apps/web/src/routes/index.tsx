import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { fetchHealth, healthQueryKey } from "../api/health.js";
import { ApiRequestError } from "../lib/http-client.js";
import { messages } from "../lib/messages.js";

export const Route = createFileRoute("/")({
  component: HealthView,
});

/**
 * Prueba de extremo a extremo del contrato compartido.
 *
 * Esta vista existe para demostrar que la cadena completa funciona: la API sirve
 * `health`, Vite lo reenvía por el proxy, el cliente HTTP lo valida contra el
 * esquema de `@monedin/contracts` y el tipo que se pinta aquí es el mismo que la
 * API declara. No es una pantalla de producto.
 */
function HealthView() {
  const { data, error, isPending } = useQuery({
    queryKey: healthQueryKey,
    queryFn: fetchHealth,
  });

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  if (error) {
    // El front decide qué mostrar por el CÓDIGO, nunca por el texto del mensaje.
    const code = error instanceof ApiRequestError ? error.code : "DESCONOCIDO";

    return (
      <section>
        <h2>{messages.health.heading}</h2>
        <p>{messages.health.failed}</p>
        <p>
          <code>{code}</code>
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2>{messages.health.heading}</h2>
      <p>{messages.health.ok}</p>
      <dl>
        <dt>{messages.health.service}</dt>
        <dd>
          <code>{data.service}</code>
        </dd>
        <dt>{messages.health.version}</dt>
        <dd>
          <code>{data.version}</code>
        </dd>
      </dl>
    </section>
  );
}
