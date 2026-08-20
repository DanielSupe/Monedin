import { Outlet, createRootRoute } from "@tanstack/react-router";
import { messages } from "../lib/messages.js";

/**
 * Ruta raíz.
 *
 * Es el andamio mínimo que pide este change: sin sistema de diseño ni
 * componentes. Lo único que demuestra es que el router está cableado y que
 * cuelga de aquí el árbol de rutas que crearán los changes siguientes.
 */
export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "40rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>{messages.app.title}</h1>
        <p style={{ margin: "0.25rem 0 0", color: "#555" }}>{messages.app.tagline}</p>
      </header>
      <Outlet />
    </main>
  );
}
