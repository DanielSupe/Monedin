import { createFileRoute } from "@tanstack/react-router";
import { requireProfileChoice } from "../app/guards.js";
import { manageSearch } from "../app/search.js";
import { PinPad } from "../features/auth/PinPad.js";

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
