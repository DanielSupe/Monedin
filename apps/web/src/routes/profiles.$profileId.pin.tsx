import { createFileRoute } from "@tanstack/react-router";
import { requireProfileChoice } from "../app/guards.js";
import { manageSearch } from "../app/search.js";
import { PinPad } from "../features/auth/PinPad.js";

/**
 * Teclado de PIN de un perfil concreto.
 *
 * De solo cuenta: entrar a un perfil es lo que crea el actor, asi que la ruta
 * que lo hace no puede exigirlo de antemano.
 *
 * Lleva el mismo parámetro que la rejilla, y no por simetría: al acertar el PIN
 * la guarda se reevalúa sobre ESTA dirección, así que es aquí donde tiene que
 * estar escrito si el destino es editar el perfil en vez del inicio.
 */
export const Route = createFileRoute("/profiles/$profileId/pin")({
  validateSearch: manageSearch,
  beforeLoad: ({ context, search }) =>
    requireProfileChoice(context.queryClient, search.manage ?? false),
  component: PinPadRoute,
});

function PinPadRoute(): React.ReactElement {
  const { profileId } = Route.useParams();
  const { manage } = Route.useSearch();

  return <PinPad profileId={profileId} manage={manage ?? false} />;
}
