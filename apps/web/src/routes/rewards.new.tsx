import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { RewardForm } from "../features/rewards/RewardForm.js";

/** Publicar un premio y ponerle precio a cada hijo. */
export const Route = createFileRoute("/rewards/new")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  component: NewRewardRoute,
});

function NewRewardRoute(): React.ReactElement {
  const navigate = useNavigate();
  const alCatalogo = (): void =>
    void navigate({ to: "/rewards", search: { page: 1, status: "ACTIVE" } });

  return <RewardForm onSaved={alCatalogo} />;
}
