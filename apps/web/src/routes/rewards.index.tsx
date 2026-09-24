import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireParent } from "../app/guards.js";
import { pageSearch } from "../app/search.js";
import { RewardCatalog } from "../features/rewards/RewardCatalog.js";

export const Route = createFileRoute("/rewards/")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  validateSearch: pageSearch.extend({
    status: z.enum(["ACTIVE", "RETIRED"]).catch("ACTIVE"),
  }),
  component: RewardsRoute,
});

function RewardsRoute(): React.ReactElement {
  const { page, status } = Route.useSearch();

  return <RewardCatalog page={page} status={status} />;
}
