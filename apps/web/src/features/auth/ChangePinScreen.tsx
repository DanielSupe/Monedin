import { PIN_LENGTH, changeAdultPinSchema } from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Card, Field, Input } from "../../ui/index.js";
import { describeAuthError, useChangeAdultPin } from "./use-session.js";

export function ChangePinScreen(): React.ReactElement {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const change = useChangeAdultPin();

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setFieldError(undefined);

    const parsed = changeAdultPinSchema.safeParse({ currentPin, newPin });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    change.mutate(parsed.data, {
      onSuccess: () => {
        setCurrentPin("");
        setNewPin("");
      },
    });
  }

  const error = fieldError ?? (change.error ? describeAuthError(change.error) : undefined);

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-body font-bold">{messages.auth.changePinTitle}</h3>

          <p className="text-small text-ink-muted">{messages.auth.pinVsPassword}</p>
        </div>

        <form onSubmit={submit} className="flex max-w-sm flex-col gap-4">

          <Field label={messages.auth.currentPin}>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={currentPin}
              onChange={(evento) => setCurrentPin(evento.target.value)}
            />
          </Field>

          <Field label={messages.auth.newPin}>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={newPin}
              onChange={(evento) => setNewPin(evento.target.value)}
            />
          </Field>

          <Button type="submit" variant="primary" pending={change.isPending}>
            {change.isPending ? messages.auth.working : messages.auth.changePinSubmit}
          </Button>
        </form>

        {change.isSuccess && error === undefined && (
          <Alert tone="done">{messages.auth.pinChanged}</Alert>
        )}

        {error !== undefined && <Alert tone="danger">{error}</Alert>}
      </div>
    </Card>
  );
}
