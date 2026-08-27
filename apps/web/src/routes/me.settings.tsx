import { createFileRoute } from "@tanstack/react-router";
import { requireChild } from "../app/guards.js";
import { ChildSettings } from "../features/children/ChildSettings.js";

/** Destino del nino. Un padre que abra esta direccion acaba en su propio inicio. */
export const Route = createFileRoute("/me/settings")({
  beforeLoad: ({ context }) => requireChild(context.queryClient),
  component: ChildSettings,
});
