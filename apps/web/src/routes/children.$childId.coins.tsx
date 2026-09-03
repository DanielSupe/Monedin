import { createFileRoute } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { pageSearch } from "../app/search.js";
import { ChildCoinHistory } from "../features/coins/ChildCoinHistory.js";

/**
 * El historial de un hijo, por su identificador.
 *
 * Una dirección solo puede llevar el identificador, y de quién es ese hijo lo
 * comprueba el SERVICIO: un hijo ajeno responde 404 y nunca 403, para no
 * confirmar que existe.
 */
export const Route = createFileRoute("/children/$childId/coins")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  validateSearch: pageSearch,
  component: ChildCoinsRoute,
});

function ChildCoinsRoute(): React.ReactElement {
  const { childId } = Route.useParams();
  const { page } = Route.useSearch();

  return <ChildCoinHistory childId={childId} page={page} />;
}
