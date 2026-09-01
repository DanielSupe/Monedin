import { Link, Outlet } from "@tanstack/react-router";
import { messages } from "../lib/messages.js";
import { Drawer, Logo } from "../ui/index.js";
import { MenuButton, Sidebar, SidebarProfile, sidebarItemClasses } from "./Sidebar.js";
import { useDrawer } from "./use-drawer.js";
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

  return (
    <div data-scale="child" className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="flex items-center gap-3 border-b border-border px-4 py-2">
        <Drawer
          open={open}
          onOpenChange={setOpen}
          label={messages.nav.drawerLabel}
          trigger={<MenuButton />}
        >
          <Sidebar
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
                {texto}
                <Icono />
              </Link>
            ))}
          </Sidebar>
        </Drawer>

        <Link to="/" className="no-underline">
          <Logo size="medium" />
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
      <main className="min-w-0 flex-1 px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
