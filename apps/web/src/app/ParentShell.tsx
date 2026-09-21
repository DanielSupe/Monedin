import { Link, Outlet } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import type { ThemePreference } from "@monedin/contracts";
import { messages } from "../lib/messages.js";
import { ThemeToggle } from "./ThemeToggle.js";
import { useTheme } from "./use-theme.js";
import { Avatar, Drawer, Logo } from "../ui/index.js";
import {
  MenuButton,
  Sidebar,
  SidebarLabel,
  HelpLink,
  SidebarProfile,
  sidebarItemClasses,
} from "./Sidebar.js";
import { cx } from "../ui/cx.js";
import { MonedinWidget } from "./MonedinWidget.js";
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
  tutorialSeen,
  fullHeight,
  theme,
  tasksBadge,
  redemptionsBadge,
}: {
  avatar: string | null;
  name: string;
  /**
   * Si a este perfil ya se le explicó el producto.
   *
   * El marco lo necesita para NO montar el widget de la mascota mientras el
   * recorrido de bienvenida está en pantalla: allí ya hay un Monedín hablando, y
   * el segundo saldría apagado detrás del velo compitiendo con él.
   *
   * Se resuelve así y no cableando una señal desde `features/tutorial`, que es
   * quien monta el recorrido: esta es la MISMA condición con la que las dos
   * pantallas de inicio deciden montarlo, así que no hace falta un segundo
   * camino que pueda separarse del primero.
   */
  tutorialSeen: boolean;
  /** El tema que prefiere este perfil. Lo estampa el marco en la raíz. */
  theme: ThemePreference;
  /**
   * Si la pantalla de dentro gestiona su propio alto y desplaza por dentro.
   *
   * Hoy solo el chat. Lo declara la RUTA con `staticData`, igual que
   * `fullBleed`, y no un `if` sobre la dirección: una dirección escrita a mano
   * aquí se desincroniza el día que alguien renombre la ruta y el typecheck no
   * lo vería.
   *
   * Lo que cambia: el marco se ata a la ventana también en ESTRECHO, y el
   * `<main>` deja de crecer con su contenido. Sin las dos cosas, el campo de
   * escribir del chat se iría hacia abajo con los mensajes.
   */
  fullHeight: boolean;
  /**
   * Cuánto espera en cada bandeja, si espera algo.
   *
   * Entran como CONTENIDO y no los calcula el marco: contar tareas por aprobar
   * es negocio, y este archivo sabe de roles y de destinos. Es la misma frontera
   * que impide a `Pagination` construir sus propios enlaces.
   */
  tasksBadge?: ReactNode;
  redemptionsBadge?: ReactNode;
}): React.ReactElement {
  useTheme(theme);

  const { open, setOpen } = useDrawer();
  const ancho = useIsWide();
  // Sobrevive a la navegación porque el marco no se desmonta; se pierde al
  // recargar, y eso se acepta: persistirlo pediría almacenamiento que el
  // proyecto no usa hoy.
  const [contraido, setContraido] = useState(false);

  const lateral = (
    <Sidebar
      help={<HelpLink />}
      collapsed={ancho && contraido}
      {...(ancho ? { onToggleCollapse: () => setContraido((v) => !v) } : {})}
      profile={
          <Link to="/account" className={sidebarItemClasses()}>
            <SidebarProfile name={name} avatar={avatar}>
              {messages.nav.parentAccount}
            </SidebarProfile>
            {/* El icono del destino va DETRÁS en esta fila y no delante como en
                los demás: aquí quien encabeza es el avatar, y dos glifos
                seguidos compiten por el mismo sitio. */}
            <IconAccount />
          </Link>
        }
      >
        {/* Icono a la izquierda, texto, y la insignia al final si hay algo
            esperando. El icono es DECORATIVO: lo que nombra al destino es su
            texto, así que repetirlo en el icono se lo diría dos veces a un
            lector de pantalla. */}
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className={sidebarItemClasses()}
        >
          <IconHome />
          <SidebarLabel>{messages.nav.parentHome}</SidebarLabel>
        </Link>
        <Link
          to="/tasks"
          search={{ page: 1, status: "ALL" }}
          className={sidebarItemClasses()}
        >
          <IconTasks />
          <SidebarLabel>{messages.nav.parentTasks}</SidebarLabel>
          {tasksBadge}
        </Link>
        <Link
          to="/rewards"
          search={{ page: 1, status: "ACTIVE" }}
          className={sidebarItemClasses()}
        >
          <IconRewards />
          <SidebarLabel>{messages.nav.parentRewards}</SidebarLabel>
        </Link>
        <Link
          to="/redemptions"
          search={{ page: 1, status: "ALL" }}
          className={sidebarItemClasses()}
        >
          <IconRedemptions />
          <SidebarLabel>{messages.nav.parentRedemptions}</SidebarLabel>
          {redemptionsBadge}
        </Link>
        <Link
          to="/children"
          search={{ page: 1 }}
          className={sidebarItemClasses()}
        >
          <IconChildren />
          <SidebarLabel>{messages.nav.parentChildren}</SidebarLabel>
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
        ancho || fullHeight ? "h-dvh overflow-hidden" : "min-h-dvh",
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
        <ThemeToggle theme={theme} />

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
          className={cx(
            "flex min-w-0 flex-1 flex-col overflow-x-auto",
            /*
              Los DOS ejes en el mismo elemento, siempre: cuando uno es `auto` y
              el otro `visible`, CSS obliga a que `visible` compute a `auto`, y
              entonces este envoltorio desplaza también en vertical sin que
              nadie lo haya pedido. Costó dos intentos en `polish-home-layout`.

              Con `fullHeight` desplaza la PANTALLA, no el marco: si aquí
              quedara `auto`, habría dos contenedores de desplazamiento anidados
              y el de fuera se llevaría el campo de escribir del chat. Lo destapó
              un test que comprobaba justo eso.
            */
            fullHeight ? "overflow-y-hidden" : ancho ? "overflow-y-auto" : "overflow-y-visible",
          )}
        >
          <main
            className={cx(
              "mx-auto w-full min-w-0 max-w-wide flex-1 px-4 py-4",
              // Sin esto, un hijo alto empuja al `<main>` y el desplazamiento
              // vuelve a ser del marco: `flex-1` deja `min-height: auto`.
              fullHeight && "min-h-0",
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/*
        Monedín ofreciéndose, y NO mientras se está explicando el producto: allí
        ya hay un Monedín hablando dentro del foco, y el segundo saldría apagado
        detrás del velo compitiendo con él.
      */}
      {tutorialSeen && <MonedinWidget role={"PARENT"} />}
    </div>
  );
}
