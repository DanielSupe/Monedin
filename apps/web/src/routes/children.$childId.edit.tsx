import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { EditChildScreen } from "../features/children/EditChildScreen.js";

/**
 * Editar un hijo por su identificador.
 *
 * La direccion solo puede llevar el identificador, asi que la entidad se obtiene
 * de la consulta que ya existe en vez de venir dentro de una propiedad. El
 * precio es una peticion al abrirla en frio; a cambio, la direccion se puede
 * recargar y compartir. Ver decision 5 del design.
 */
export const Route = createFileRoute("/children/$childId/edit")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  component: EditChildRoute,
});

function EditChildRoute(): React.ReactElement {
  const { childId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <EditChildScreen
      childId={childId}
      onSettled={() => void navigate({ to: "/children", search: { page: 1 } })}
    />
  );
}
