import { messages } from "../../lib/messages.js";
import { Avatar, Card, Skeleton } from "../../ui/index.js";
import { useSession } from "./use-session.js";

export function ParentIdentity(): React.ReactElement {
  const { session } = useSession();
  const actor = session?.actor;

  if (actor === undefined || actor === null || actor.familyRole !== "PARENT") {
    return <Skeleton lines={2} />;
  }

  return (
    <Card>
      <div className="flex items-center gap-4">
        <Avatar value={actor.avatar} size="large" alt={actor.name} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-title font-bold">{actor.name}</p>
          <p className="text-small text-ink-muted truncate">
            <span className="sr-only">{messages.auth.accountEmailLabel}</span>
            {actor.email}
          </p>
        </div>
      </div>
    </Card>
  );
}
