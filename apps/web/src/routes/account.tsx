import { Link, createFileRoute } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { ChangePinScreen } from "../features/auth/ChangePinScreen.js";
import { ParentAvatarScreen } from "../features/auth/ParentAvatarScreen.js";
import { messages } from "../lib/messages.js";

/** La cuenta del padre: su foto y su PIN, que antes vivian tras dos booleanos. */
export const Route = createFileRoute("/account")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  component: AccountRoute,
});

function AccountRoute(): React.ReactElement {
  return (
    <section>
      <ParentAvatarScreen />
      <ChangePinScreen />
      <p style={{ marginTop: "1rem" }}>
        <Link to="/">{messages.auth.back}</Link>
      </p>
    </section>
  );
}
