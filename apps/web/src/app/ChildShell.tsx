import { Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
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
  SidebarTrailing,
  sidebarItemClasses,
} from "./Sidebar.js";
import { cx } from "../ui/cx.js";
import { MonedinWidget } from "./MonedinWidget.js";
import { useDrawer } from "./use-drawer.js";
import { useIsWide } from "./use-wide.js";
import {
  IconHome,
  IconProfile,
  IconRedemptions,
  IconRewards,
  IconTasks,
} from "./nav-icons.js";

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
  tutorialSeen,
  fullHeight,
  theme,
}: {
  avatar: string | null;
  name: string;

  tutorialSeen: boolean;

  theme: ThemePreference;

  fullHeight: boolean;
}): React.ReactElement {
  useTheme(theme);

  const { open, setOpen } = useDrawer();
  const ancho = useIsWide();

  const [contraido, setContraido] = useState(false);

  const lateral = (
    <Sidebar
      help={<HelpLink />}
      collapsed={ancho && contraido}
      {...(ancho ? { onToggleCollapse: () => setContraido((v) => !v) } : {})}
      profile={
          <Link to="/me/settings" className={sidebarItemClasses()}>
            <SidebarProfile name={name} avatar={avatar}>
              {messages.children.myProfileTitle}
            </SidebarProfile>

            <SidebarTrailing>
              <IconProfile />
            </SidebarTrailing>
          </Link>
        }
      >

        {DESTINOS.map(({ to, texto, Icono, exacto }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: exacto }}
            className={sidebarItemClasses()}
          >

            <Icono />
            <SidebarLabel>{texto}</SidebarLabel>
          </Link>
        ))}
    </Sidebar>
  );

  return (
    <div
      data-scale="child"
      className={cx(
        "flex flex-col bg-surface text-ink",
        ancho || fullHeight ? "h-dvh overflow-hidden" : "min-h-dvh",
      )}
    >
      <header className="flex items-center gap-3 border-b border-border px-4 py-2">

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

        <ThemeToggle theme={theme} />

        <Link to="/me/settings" aria-label={messages.children.myProfileTitle}>
          <Avatar value={avatar} size="small" />
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">

        {ancho && (
          <aside
            className={cx(
              "flex shrink-0 flex-col border-r border-border bg-surface-raised transition-all duration-normal",

              contraido ? "w-sidebar-collapsed" : "w-sidebar xl:w-sidebar-wide",
            )}
          >
            {lateral}
          </aside>
        )}

        <div
          className={cx(
            "flex min-w-0 flex-1 flex-col overflow-x-auto",

            fullHeight ? "overflow-y-hidden" : ancho ? "overflow-y-auto" : "overflow-y-visible",
          )}
        >
          <main
            className={cx(
              "mx-auto w-full min-w-0 max-w-wide flex-1 px-4 py-4",

              fullHeight && "min-h-0",
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>

      {tutorialSeen && <MonedinWidget role={"CHILD"} />}
    </div>
  );
}
