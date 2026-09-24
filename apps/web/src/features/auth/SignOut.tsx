import { messages } from "../../lib/messages.js";
import { Button } from "../../ui/index.js";
import { useLogout } from "./use-session.js";

export function SignOut(): React.ReactElement {
  const logout = useLogout();

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="danger" pending={logout.isPending} onClick={() => logout.mutate()}>
        {messages.auth.signOut}
      </Button>

      <p className="text-small text-ink-muted">{messages.auth.signOutConsequence}</p>
    </div>
  );
}
