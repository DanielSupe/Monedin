import { createFileRoute } from "@tanstack/react-router";
import { requireChild } from "../app/guards.js";
import { pageSearch } from "../app/search.js";
import { OwnCoinHistory } from "../features/coins/OwnCoinHistory.js";

/**
 * De dónde salieron las monedas de un niño.
 *
 * Se llega desde su SALDO, no desde un quinto destino en la navegación: tocar
 * el número y ver de dónde viene es el gesto natural, y añadirle un destino más
 * a una barra de cuatro le cuesta a alguien de seis años. Ver la decisión 6 del
 * design de `add-coin-history`.
 */
export const Route = createFileRoute("/me/coins")({
  beforeLoad: ({ context }) => requireChild(context.queryClient),
  validateSearch: pageSearch,
  component: OwnCoinsRoute,
});

function OwnCoinsRoute(): React.ReactElement {
  const { page } = Route.useSearch();

  return <OwnCoinHistory page={page} />;
}
