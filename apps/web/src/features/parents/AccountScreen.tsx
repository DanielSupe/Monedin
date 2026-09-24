import { ChangePinScreen } from "../auth/ChangePinScreen.js";
import { ParentAvatarScreen } from "../auth/ParentAvatarScreen.js";
import { ParentIdentity } from "../auth/ParentIdentity.js";
import { SignOut } from "../auth/SignOut.js";
import { ReplayTour } from "../tutorial/ReplayTour.js";
import { messages } from "../../lib/messages.js";

export function AccountScreen(): React.ReactElement {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.nav.parentAccountLead}
        </span>
        <h2 className="text-display font-extrabold">{messages.nav.parentAccount}</h2>
      </div>

      <ParentIdentity />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <ParentAvatarScreen />

        <div className="flex flex-col gap-5">
          <ChangePinScreen />
          <ReplayTour />
          <SignOut />
        </div>
      </div>
    </section>
  );
}
