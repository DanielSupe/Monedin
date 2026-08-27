import { REDEMPTION_STATUSES } from "@monedin/contracts";
import { createFileRoute } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { statusSearch } from "../app/search.js";
import { RedemptionInbox } from "../features/redemptions/RedemptionInbox.js";

/** Bandeja de canjes del padre: lo que sus hijos han pedido. */
export const Route = createFileRoute("/redemptions/")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  validateSearch: statusSearch(REDEMPTION_STATUSES),
  component: RedemptionsRoute,
});

function RedemptionsRoute(): React.ReactElement {
  const { page, status } = Route.useSearch();

  return <RedemptionInbox page={page} status={status} />;
}
