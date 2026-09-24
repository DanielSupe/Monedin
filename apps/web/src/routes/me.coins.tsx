import { createFileRoute } from "@tanstack/react-router";
import { requireChild } from "../app/guards.js";
import { pageSearch } from "../app/search.js";
import { OwnCoinHistory } from "../features/coins/OwnCoinHistory.js";

export const Route = createFileRoute("/me/coins")({
  beforeLoad: ({ context }) => requireChild(context.queryClient),
  validateSearch: pageSearch,
  component: OwnCoinsRoute,
});

function OwnCoinsRoute(): React.ReactElement {
  const { page } = Route.useSearch();

  return <OwnCoinHistory page={page} />;
}
