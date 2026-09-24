import { Link } from "@tanstack/react-router";
import {
  type ButtonHTMLAttributes,
  type ReactNode,
  createContext,
  forwardRef,
  useContext,
} from "react";
import { messages } from "../lib/messages.js";
import { Avatar } from "../ui/index.js";
import { cx } from "../ui/cx.js";
import { IconHelp } from "./nav-icons.js";

export const MenuButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function MenuButton(props, ref) {
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      aria-label={messages.nav.menu}
      className="tap-target rounded-control flex items-center justify-center border border-border bg-surface-raised px-2 text-ink"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="size-6"
        aria-hidden="true"
      >
        <path
          d="M4 7h16M4 12h16M4 17h16"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
});

const Contraido = createContext(false);

function Chevron({
  pointing,
}: {
  pointing: "left" | "right";
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="size-5"
      aria-hidden="true"
    >
      <path
        d={pointing === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function sidebarItemClasses(): string {
  return cx(
    "tap-target rounded-control text-body flex w-full items-center gap-3 px-3 font-semibold text-ink no-underline transition-colors duration-quick",
    "hover:bg-surface-sunken",
    "data-[status=active]:bg-primary-soft data-[status=active]:text-primary",

    "group-data-[collapsed=true]:relative group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-0",
  );
}

export function sidebarBadgeClasses(): string {
  return cx(
    "rounded-pill text-micro ml-auto inline-flex min-w-6 shrink-0 items-center justify-center bg-conflict-soft px-2 py-0.5 font-extrabold text-conflict",

    "group-data-[collapsed=true]:absolute group-data-[collapsed=true]:right-2 group-data-[collapsed=true]:top-2",

    "group-data-[collapsed=true]:size-2 group-data-[collapsed=true]:min-w-0 group-data-[collapsed=true]:bg-conflict group-data-[collapsed=true]:p-0",
  );
}

export function SidebarBadgeCount({
  children,
}: {
  children: ReactNode;
}): React.ReactElement | null {
  if (useContext(Contraido)) {
    return null;
  }

  return <span aria-hidden="true">{children}</span>;
}

export function SidebarLabel({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  return (
    <span className="group-data-[collapsed=true]:sr-only">{children}</span>
  );
}

export function SidebarTrailing({
  children,
}: {
  children: ReactNode;
}): React.ReactElement | null {
  if (useContext(Contraido)) {
    return null;
  }

  return <span className="flex shrink-0">{children}</span>;
}

export function Sidebar({
  children,
  help,
  profile,
  collapsed = false,
  onToggleCollapse,
}: {
  children: ReactNode;

  help: ReactNode;

  profile: ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}): React.ReactElement {
  return (
    <Contraido.Provider value={collapsed}>
      <div
        data-collapsed={collapsed ? "true" : "false"}
        className="group flex min-h-0 flex-1 flex-col"
      >
        {onToggleCollapse !== undefined && (
          <div className="flex items-center justify-end border-b border-border p-3 group-data-[collapsed=true]:justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? messages.nav.expandSidebar
                  : messages.nav.collapseSidebar
              }
              className="tap-target rounded-control flex items-center justify-center border-transparent bg-transparent px-2 text-ink-muted hover:bg-surface-sunken"
            >
              <Chevron pointing={collapsed ? "right" : "left"} />
            </button>
          </div>
        )}

        <nav
          aria-label={messages.nav.drawerLabel}
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3"
        >
          {children}
        </nav>

        <div className="flex flex-col gap-2 border-t border-border p-3">

          {help}

          {profile}
        </div>
      </div>
    </Contraido.Provider>
  );
}

export function SidebarProfile({
  name,
  avatar,
  children,
}: {
  name: string;
  avatar: string | null;
  children?: ReactNode;
}): React.ReactElement {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar value={avatar} size="small" />
      <span className="flex min-w-0 flex-1 flex-col group-data-[collapsed=true]:sr-only">
        <span className="truncate text-body font-semibold">{name}</span>
        {children !== undefined && (
          <span className="text-small text-ink-muted">{children}</span>
        )}
      </span>
    </span>
  );
}

export function HelpLink(): React.ReactElement {
  return (
    <Link to="/help" className={sidebarItemClasses()}>
      <IconHelp />
      <SidebarLabel>{messages.help.title}</SidebarLabel>
    </Link>
  );
}
