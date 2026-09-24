import { createFileRoute } from "@tanstack/react-router";
import { requireChild } from "../app/guards.js";
import { MyRewards } from "../features/rewards/MyRewards.js";

export const Route = createFileRoute("/me/rewards")({
  beforeLoad: ({ context }) => requireChild(context.queryClient),
  component: MyRewards,
});
