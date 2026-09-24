import { createFileRoute } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { AccountScreen } from "../features/parents/AccountScreen.js";

export const Route = createFileRoute("/account")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  component: AccountScreen,
});
