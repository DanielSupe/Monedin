import { createFileRoute } from "@tanstack/react-router";
import { requireChild } from "../app/guards.js";
import { MyRewards } from "../features/rewards/MyRewards.js";

/** Destino del nino. Un padre que abra esta direccion acaba en su propio inicio. */
export const Route = createFileRoute("/me/rewards")({
  beforeLoad: ({ context }) => requireChild(context.queryClient),
  component: MyRewards,
});
