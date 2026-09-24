import { messages } from "../../lib/messages.js";
import { Button } from "../../ui/index.js";
import type { ButtonVariant } from "../../ui/index.js";
import { useLeaveProfile } from "./use-session.js";

export function LeaveProfile({
  variant = "ghost",
  block = false,
}: {
  variant?: ButtonVariant;
  block?: boolean;
} = {}): React.ReactElement {
  const leave = useLeaveProfile();

  return (
    <Button
      variant={variant}
      block={block}
      className={block ? undefined : "self-start"}
      pending={leave.isPending}
      onClick={() => leave.mutate()}
    >
      {messages.auth.changeProfile}
    </Button>
  );
}
