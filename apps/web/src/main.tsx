import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { queryClient } from "./lib/query-client.js";
import { routeTree } from "./routeTree.gen";
import "./styles/tokens.css";

/**
 * El cliente de consultas viaja en el contexto del router.
 *
 * Lo necesitan las guardas: `beforeLoad` corre ANTES de que exista ningún
 * componente, así que no puede usar el hook de sesión. Con el cliente a mano
 * resuelve la sesión con `ensureQueryData`, que además reutiliza la caché en
 * lugar de pedirla otra vez en cada navegación. Ver decisión 1 del design de
 * `add-app-shell`.
 */
const router = createRouter({ routeTree, context: { queryClient } });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("No se encontró el elemento #root en index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
