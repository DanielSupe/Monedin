import { createFileRoute } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { AccountScreen } from "../features/parents/AccountScreen.js";

/**
 * La cuenta del padre.
 *
 * El archivo de ruta MONTA el destino y no lo dibuja: la pantalla vive en
 * `features/parents/`. Estuvo aquí dentro hasta `redesign-parent-screens`, que
 * es la última que quedaba con ese defecto.
 */
export const Route = createFileRoute("/account")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  component: AccountScreen,
});
