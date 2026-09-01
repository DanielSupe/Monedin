import { Link, Outlet } from "@tanstack/react-router";
import { messages } from "../lib/messages.js";
import { Drawer, Logo } from "../ui/index.js";
import { MenuButton, Sidebar, SidebarProfile, sidebarItemClasses } from "./Sidebar.js";
import { useDrawer } from "./use-drawer.js";
import {
  IconAccount,
  IconChildren,
  IconHome,
  IconRedemptions,
  IconRewards,
  IconTasks,
} from "./nav-icons.js";

/**
 * El marco del padre: botón de menú, logo y el cajón con todos sus destinos.
 *
 * Declara `data-scale="parent"`, que reasigna la misma escala a densidad alta y
 * escaneo rápido. Es la otra mitad de la doble escala: las piezas son las
 * mismas, el contenedor es lo único que cambia.
 *
 * Hasta `add-sidebar-nav` la navegación era una barra de cuatro enlaces en esta
 * cabecera, y su quinto destino —la cuenta— colgaba del avatar, fuera de la
 * barra. Ahora hay UNA sola navegación y están los cinco dentro.
 *
 * Los destinos llevan sus parámetros de búsqueda por defecto, para que pulsar
 * «Tareas» desde cualquier sitio abra siempre el listado sin filtro y en la
 * primera página, y no en el estado en que quedó la última vez.
 */
export function ParentShell({
  avatar,
  name,
}: {
  avatar: string | null;
  name: string;
}): React.ReactElement {
  const { open, setOpen } = useDrawer();

  return (
    <div data-scale="parent" className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-2">
        <Drawer
          open={open}
          onOpenChange={setOpen}
          label={messages.nav.drawerLabel}
          trigger={<MenuButton />}
        >
          <Sidebar
            profile={
              <Link to="/account" className={sidebarItemClasses()}>
                <SidebarProfile name={name} avatar={avatar}>
                  {messages.nav.parentAccount}
                </SidebarProfile>
                <IconAccount />
              </Link>
            }
          >
            {/* Texto a la izquierda, icono a la derecha. El icono es DECORATIVO:
                lo que nombra al destino es su texto, así que repetirlo en el
                icono se lo diría dos veces a un lector de pantalla. */}
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className={sidebarItemClasses()}
            >
              {messages.nav.parentHome}
              <IconHome />
            </Link>
            <Link
              to="/tasks"
              search={{ page: 1, status: "ALL" }}
              className={sidebarItemClasses()}
            >
              {messages.nav.parentTasks}
              <IconTasks />
            </Link>
            <Link
              to="/rewards"
              search={{ page: 1, status: "ACTIVE" }}
              className={sidebarItemClasses()}
            >
              {messages.nav.parentRewards}
              <IconRewards />
            </Link>
            <Link
              to="/redemptions"
              search={{ page: 1, status: "ALL" }}
              className={sidebarItemClasses()}
            >
              {messages.nav.parentRedemptions}
              <IconRedemptions />
            </Link>
            <Link
              to="/children"
              search={{ page: 1 }}
              className={sidebarItemClasses()}
            >
              {messages.nav.parentChildren}
              <IconChildren />
            </Link>
          </Sidebar>
        </Drawer>

        <Link to="/" className="no-underline">
          <Logo size="medium" />
        </Link>
      </header>

      {/*
        `min-w-0` y `overflow-x-auto` porque las pantallas sin vestir desbordan:
        sus listas usan grid, y un hijo ancho —el selector de archivo nativo—
        estira la columna por el `min-width: auto` de CSS. La causa vive en esas
        pantallas y la arregla su change de rediseño; lo que NO puede pasar
        mientras tanto es que el documento entero se mueva de lado, y eso sí es
        cosa del marco.
      */}
      <main className="min-w-0 flex-1 overflow-x-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
