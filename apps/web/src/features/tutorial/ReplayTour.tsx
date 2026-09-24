import { useNavigate } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Card, Mascota } from "../../ui/index.js";
import { useUpdateTutorial } from "../auth/use-session.js";

export function ReplayTour(): React.ReactElement {
  const marcar = useUpdateTutorial();
  const navigate = useNavigate();

  const pedirlo = async (): Promise<void> => {
    await marcar.mutateAsync({ seen: false });
    await navigate({ to: "/" });
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Mascota pose="presenta" size="small" className="shrink-0" />

          <div className="flex min-w-0 flex-col">
            <p className="text-body font-bold">{messages.tutorial.replay}</p>
            <p className="text-small text-ink-muted">{messages.tutorial.replayLead}</p>
          </div>
        </div>

        <Button
          variant="secondary"
          pending={marcar.isPending}

          onClick={() => void pedirlo().catch(() => undefined)}
        >
          {messages.tutorial.replayAction}
        </Button>
      </div>

      {marcar.error !== null && (
        <Alert tone="danger">{messages.tutorial.replayFailed}</Alert>
      )}
    </Card>
  );
}
