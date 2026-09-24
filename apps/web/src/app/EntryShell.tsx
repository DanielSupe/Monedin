import { Outlet } from "@tanstack/react-router";
import { Logo } from "../ui/index.js";

export function EntryShell(): React.ReactElement {
  return (
    <div
      data-scale="entry"
      className="relative flex min-h-dvh flex-col overflow-hidden bg-surface text-ink"
    >

      <header className="relative px-4 py-3">
        <Logo size="medium" />
      </header>

      <main className="relative flex w-full flex-1 items-center justify-center px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
