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
  SidebarTrailing,
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

  tutorialSeen: boolean;

  theme: ThemePreference;

  fullHeight: boolean;

  tasksBadge?: ReactNode;
  redemptionsBadge?: ReactNode;
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
          <Link to="/account" className={sidebarItemClasses()}>
            <SidebarProfile name={name} avatar={avatar}>
              {messages.nav.parentAccount}
            </SidebarProfile>

            <SidebarTrailing>
              <IconAccount />
            </SidebarTrailing>
          </Link>
        }
      >

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
    <div
      data-scale="parent"
      className={cx(
        "flex flex-col bg-surface text-ink",
        ancho || fullHeight ? "h-dvh overflow-hidden" : "min-h-dvh",
      )}
    >
      <header className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-2">

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

        <Link to="/account" aria-label={messages.nav.parentAccount}>
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

      {tutorialSeen && <MonedinWidget role={"PARENT"} />}
    </div>
  );
}
