import { SidebarBadgeCount, sidebarBadgeClasses } from "../../app/Sidebar.js";
import { messages } from "../../lib/messages.js";
import { usePendingCounts } from "./use-parent-console.js";

export function PendingBadge({ kind }: { kind: "tasks" | "redemptions" }): React.ReactElement | null {
  const { tasksToApprove, redemptionsWaiting } = usePendingCounts();
  const cuenta = kind === "tasks" ? tasksToApprove : redemptionsWaiting;

  if (cuenta.value === 0) {
    return null;
  }

  const cifra = `${String(cuenta.value)}${cuenta.exact ? "" : "+"}`;

  return (
    <span className={sidebarBadgeClasses()}>
      <SidebarBadgeCount>{cifra}</SidebarBadgeCount>

      <span className="sr-only">
        {cifra} {messages.nav.pendingSuffix}
      </span>
    </span>
  );
}
