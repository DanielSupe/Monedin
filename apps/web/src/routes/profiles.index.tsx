import { createFileRoute } from "@tanstack/react-router";
import { requireProfileChoice } from "../app/guards.js";
import { manageSearch } from "../app/search.js";
import { ProfileGrid } from "../features/auth/ProfileGrid.js";

export const Route = createFileRoute("/profiles/")({
  beforeLoad: ({ context }) => requireProfileChoice(context.queryClient),
  validateSearch: manageSearch,
  component: ProfileGridRoute,
});

function ProfileGridRoute(): React.ReactElement {
  const { manage } = Route.useSearch();

  return <ProfileGrid manage={manage ?? false} />;
}
