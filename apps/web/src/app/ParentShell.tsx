import { Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { messages } from "../lib/messages.js";
import { Avatar, Drawer, Logo } from "../ui/index.js";
import {
  MenuButton,
  Sidebar,
  SidebarLabel,
  SidebarProfile,
  sidebarItemClasses,
} from "./Sidebar.js";
import { cx } from "../ui/cx.js";
import { useDrawer } from "./use-drawer.js";
import { useIsWide } from "./use-wide.js";
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
  const ancho = useIsWide();
  // Sobrevive a la navegación porque el marco no se desmonta; se pierde al
  // recargar, y eso se acepta: persistirlo pediría almacenamiento que el
  // proyecto no usa hoy.
  const [contraido, setContraido] = useState(false);

  const lateral = (
    <Sidebar
      collapsed={ancho && contraido}
      {...(ancho ? { onToggleCollapse: () => setContraido((v) => !v) } : {})}
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
          <SidebarLabel>{messages.nav.parentHome}</SidebarLabel>
          <IconHome />
        </Link>
        <Link
          to="/tasks"
          search={{ page: 1, status: "ALL" }}
          className={sidebarItemClasses()}
        >
          <SidebarLabel>{messages.nav.parentTasks}</SidebarLabel>
          <IconTasks />
        </Link>
        <Link
          to="/rewards"
          search={{ page: 1, status: "ACTIVE" }}
          className={sidebarItemClasses()}
        >
          <SidebarLabel>{messages.nav.parentRewards}</SidebarLabel>
          <IconRewards />
        </Link>
        <Link
          to="/redemptions"
          search={{ page: 1, status: "ALL" }}
          className={sidebarItemClasses()}
        >
          <SidebarLabel>{messages.nav.parentRedemptions}</SidebarLabel>
          <IconRedemptions />
        </Link>
        <Link
          to="/children"
          search={{ page: 1 }}
          className={sidebarItemClasses()}
        >
          <SidebarLabel>{messages.nav.parentChildren}</SidebarLabel>
          <IconChildren />
        </Link>
    </Sidebar>
  );

  return (
    /*
      La altura se ATA a la ventana cuando la columna está delante, y solo
      entonces.

      Era `min-h-dvh` —altura MÍNIMA— y quien desplazaba era el documento, así
      que el `<aside>`, sin altura propia, se estiraba hasta la altura de la
      fila: la de la página entera. Su pie —el perfil y el control de contraer—
      acababa al final del DOCUMENTO en vez de al final de la pantalla, y
      desaparecía al leer cualquier listado largo.

      En ESTRECHO no se toca: `100dvh` con desplazamiento interior pelea con la
      barra del navegador de un móvil, que aparece y desaparece al desplazar y
      cambia la altura de la ventana mientras se lee. Y allí la navegación es un
      cajón, que se abre encima y no tiene este problema.

      Lo decide `useIsWide()`, el MISMO valor que elige qué forma se monta: una
      segunda fuente podría separarse de la primera. Ver las decisiones 1 y 2 del
      design de `pin-sidebar-footer`.
    */
    <div
      data-scale="parent"
      className={cx(
        "flex flex-col bg-surface text-ink",
        ancho ? "h-dvh overflow-hidden" : "min-h-dvh",
      )}
    >
      <header className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-2">
        {/* El botón solo en la forma ESTRECHA: con la columna delante no tiene
            qué abrir. Van juntos porque son la misma decisión. */}
        {!ancho && (
          <Drawer
            open={open}
            onOpenChange={setOpen}
            label={messages.nav.drawerLabel}
            trigger={<MenuButton />}
          >
            {lateral}
          </Drawer>
        )}

        <Link to="/" className="flex-1 no-underline">
          <Logo size="medium" />
        </Link>

        {/*
          El avatar vuelve a la cabecera en `pin-sidebar-on-desktop`. No es solo
          un atajo: en una tablet que comparte toda la familia responde a QUIÉN
          está usando esto, que la lista de destinos no responde. Es la única
          excepción declarada a «ningún destino dos veces».
        */}
        <Link to="/account" aria-label={messages.nav.parentAccount}>
          <Avatar value={avatar} size="small" />
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
      <div className="flex min-h-0 flex-1">
        {/*
          Se monta UNA de las dos formas, nunca las dos con una escondida por
          CSS: dos listas de destinos son dos para quien recorre el documento
          con teclado, aunque una no se vea.
        */}
        {ancho && (
          <aside
            className={cx(
              "flex shrink-0 flex-col border-r border-border bg-surface-raised transition-all duration-normal",
              contraido ? "w-sidebar-collapsed" : "w-sidebar",
            )}
          >
            {lateral}
          </aside>
        )}

        {/*
          Con el marco atado a la ventana, lo que se desplaza es el CONTENIDO y
          no el documento: es lo que deja la columna —y su pie— quieta. En
          estrecho sigue desplazando el documento, así que aquí no se acota nada.
        */}
        {/*
          Quien desplaza es este ENVOLTORIO y no el `<main>`.

          Estaba en el `<main>`, que lleva `mx-auto max-w-wide`: la barra salía
          en el borde del ancho máximo —a 72rem— y no en el de la ventana, con
          un palmo de página muerta a su derecha. El envoltorio ocupa el ancho
          entero, así que la barra cae donde se espera; el `<main>` conserva su
          tope y su centrado, que es lo que impide que el contenido se reparta
          por todo el monitor.

          Y el `overflow-x-auto` SE MUDA AQUÍ, que es lo que costó dos intentos.
          Estando en el `<main>`, aquello seguía siendo contenedor de scroll
          también en VERTICAL: cuando un eje es `auto` y el otro `visible`, CSS
          obliga a que `visible` compute a `auto`. Así que mover solo el
          `overflow-y` no cambió nada — la barra la seguía pintando el `<main>`,
          en su borde. Los dos ejes tienen que estar en el mismo sitio.
        */}
        <div
          className={cx("flex min-w-0 flex-1 flex-col overflow-x-auto", ancho && "overflow-y-auto")}
        >
          <main className="mx-auto w-full min-w-0 max-w-wide flex-1 px-4 py-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
