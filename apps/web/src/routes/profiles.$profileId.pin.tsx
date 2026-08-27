import { createFileRoute } from "@tanstack/react-router";
import { requireProfileChoice } from "../app/guards.js";
import { PinPad } from "../features/auth/PinPad.js";

/**
 * Teclado de PIN de un perfil concreto.
 *
 * De solo cuenta: entrar a un perfil es lo que crea el actor, asi que la ruta
 * que lo hace no puede exigirlo de antemano.
 */
export const Route = createFileRoute("/profiles/$profileId/pin")({
  beforeLoad: ({ context }) => requireProfileChoice(context.queryClient),
  component: PinPadRoute,
});

function PinPadRoute(): React.ReactElement {
  const { profileId } = Route.useParams();

  return <PinPad profileId={profileId} />;
}
