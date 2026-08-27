import { createFileRoute } from "@tanstack/react-router";
import { requireChild } from "../app/guards.js";
import { MyRedemptions } from "../features/redemptions/MyRedemptions.js";

/** Destino del nino. Un padre que abra esta direccion acaba en su propio inicio. */
export const Route = createFileRoute("/me/redemptions")({
  beforeLoad: ({ context }) => requireChild(context.queryClient),
  component: MyRedemptions,
});
