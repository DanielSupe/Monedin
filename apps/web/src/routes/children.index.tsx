import { createFileRoute } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { pageSearch } from "../app/search.js";
import { ChildrenList } from "../features/children/ChildrenList.js";

/**
 * Los hijos del padre, paginados.
 *
 * La página viaja en la dirección para que volver desde el formulario no
 * reinicie el listado.
 */
export const Route = createFileRoute("/children/")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  validateSearch: pageSearch,
  component: ChildrenRoute,
});

function ChildrenRoute(): React.ReactElement {
  const { page } = Route.useSearch();

  return <ChildrenList page={page} />;
}
