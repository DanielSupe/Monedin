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
  IconHome,
  IconProfile,
  IconRedemptions,
  IconRewards,
  IconTasks,
} from "./nav-icons.js";

/**
 * El marco del niño: botón de menú, logo y el cajón con sus destinos.
 *
 * Declara `data-scale="child"`, que es lo que hace que las mismas piezas rindan
 * con cifras grandes y objetivos de toque de 44px sin duplicar ninguna.
 *
 * Hasta `add-sidebar-nav` la navegación era una barra inferior de cuatro
 * destinos —abajo «porque el pulgar está abajo»— y su quinto, «Mi perfil»,
 * colgaba del avatar de la cabecera, fuera de la barra. Lo que se pierde al
 * cambiarla por el cajón está declarado en la decisión 3 de su design: un toque
 * más para cambiar de sección. Lo que se gana: su perfil deja de estar escondido
 * y las cinco secciones tienen icono y nombre en vez de cuatro palabras
 * pequeñas.
 */
const DESTINOS = [
  { to: "/", texto: messages.nav.childHome, Icono: IconHome, exacto: true },
  { to: "/me/tasks", texto: messages.nav.childTasks, Icono: IconTasks, exacto: false },
  { to: "/me/rewards", texto: messages.nav.childRewards, Icono: IconRewards, exacto: false },
  {
    to: "/me/redemptions",
    texto: messages.nav.childRedemptions,
    Icono: IconRedemptions,
    exacto: false,
  },
] as const;

export function ChildShell({
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
          <Link to="/me/settings" className={sidebarItemClasses()}>
            <SidebarProfile name={name} avatar={avatar}>
              {messages.children.myProfileTitle}
            </SidebarProfile>
            <IconProfile />
          </Link>
        }
      >
        {/* Texto a la izquierda, icono a la derecha. El icono es DECORATIVO:
            lo que nombra al destino es su texto. */}
        {DESTINOS.map(({ to, texto, Icono, exacto }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: exacto }}
            className={sidebarItemClasses()}
          >
            <SidebarLabel>{texto}</SidebarLabel>
            <Icono />
          </Link>
        ))}
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
      data-scale="child"
      className={cx(
        "flex flex-col bg-surface text-ink",
        ancho ? "h-dvh overflow-hidden" : "min-h-dvh",
      )}
    >
      <header className="flex items-center gap-3 border-b border-border px-4 py-2">
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
        <Link to="/me/settings" aria-label={messages.children.myProfileTitle}>
          <Avatar value={avatar} size="small" />
        </Link>
      </header>

      {/*
        El `overflow-x-auto` se retiró en `redesign-child-tasks`, que es el
        change que su comentario prometía.

        La causa era UNA: el ancho mínimo intrínseco de un `input[type=file]`
        nativo, unos 360px, que en una rejilla arrastra a su columna. No estaba
        en ninguna de las pantallas que desbordaban, sino en `ImageUploadField`,
        y por eso ninguna podía arreglarlo por su cuenta. Medido antes y
        después: las cuatro del niño caben a 390px.

        `min-w-0` se queda: no es un parche, es lo que impide que un hijo ancho
        estire la columna de un contenedor flex, y un marco tiene que sostener
        eso pase lo que pase.
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
